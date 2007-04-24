dojo.provide("dijit.form._Spinner");

dojo.require("dijit.form.ValidationTextbox");
dojo.require("dijit.util.Typematic");
dojo.require("dijit.util.sniff");

dojo.declare(
	"dijit.form._Spinner",
	dijit.form.RangeBoundTextbox,
	{
		// summary: Mixin for validation widgets with a spinner
		// description: This class basically (conceptually) extends dijit.form.ValidationTextbox.
		//	It modifies the template to have up/down arrows, and provides related handling code.

		// defaultTimeout: Number
		//      number of milliseconds before a held key or button becomes typematic
		defaultTimeout: 500,

		// timeoutChangeRate: Number
		//      fraction of time used to change the typematic timer between events
		//      1.0 means that each typematic event fires at defaultTimeout intervals
		//      < 1.0 means that each typematic event fires at an increasing faster rate
		timeoutChangeRate: 0.90,

		// smallDelta: Number
		//      adjust the value by this much when spinning using the arrow keys/buttons
		smallDelta: 1,
		// largeDelta: Number
		//      adjust the value by this much when spinning using the PgUp/Dn keys
		largeDelta: 10,

		templatePath: dojo.moduleUrl("dijit.form", "templates/Spinner.html"),

		adjust: function(/* Object */ val, /*Number*/ delta){
			// summary: user replaceable function used to adjust a primitive value(Number/Date/...) by the delta amount specified
			// the val is adjusted in a way that makes sense to the object type
			return val;
		},

		// PORT copied from TemplatedWidgets.  Move to a util class?
		_addClass: function(/*HTMLElement*/ node, /*String*/ classStr){
			// summary
			//	adds classStr to node iff it isn't already there
			if(!(new RegExp('(^|\\s+)'+classStr+'(\\s+|$)')).test(node.className)){
				node.className += " "+classStr;
			}
		},

		// PORT copied from TemplatedWidgets.  Move to a util class?
		_removeClass: function(/*HTMLElement*/ node, /*String*/ classStr){
			// summary
			//	removes classStr from node if it is present

		//PERF: compare with plain string replace
			node.className = node.className.replace(new RegExp('(^|\\s+)'+classStr+'(\\s+|$)'), "$1$2");
		},

		_arrowPressed: function(/*Node*/ nodePressed, /*Number*/ direction){
			this._addClass(nodePressed, "dojoSpinnerButtonPushed");
			this.setValue(this.adjust(this.getValue(), direction*this.smallDelta));
		},

		_arrowReleased: function(/*Node*/ node){
			this._wheelTimer = null;
			this.textbox.focus();
			this._removeClass(node, "dojoSpinnerButtonPushed");
		},

		_typematicCallback: function(/*Node*/ node, /*Number*/ count){
			if(count == -1){ this._arrowReleased(node); }
			else{ this._arrowPressed(node, (node == this.upArrowNode) ? 1 : -1); }
		},

		_wheelTimer: null,
		_mouseWheeled: function(/*Event*/ evt){
			dojo.stopEvent(evt);
			var scrollAmount = 0;
			if(typeof evt.wheelDelta == 'number'){ // IE
				scrollAmount = evt.wheelDelta;
			}else if (typeof evt.detail == 'number'){ // Mozilla+Firefox
				scrollAmount = -evt.detail;
			}
			if(scrollAmount > 0){
				var node = this.upArrowNode;
				var dir = +1;
			}else if (scrollAmount < 0){
				var node = this.downArrowNode;
				var dir = -1;
			}else{ return; }
			this._arrowPressed(node, dir);
			if (this._wheelTimer != null){
				clearTimeout(this._wheelTimer);
			}
			this._wheelTimer = setTimeout(this, "_arrowReleased", 50, node);
		},

		postCreate: function(){
			dijit.form._Spinner.superclass.postCreate.apply(this, arguments);
			// there's some browser specific CSS

			var node = this.textbox;

			// textbox and domNode get the same style but the css separates the 2 using !important
			if(this.srcNodeRef){
				dojo.style(node, "cssText", this.srcNodeRef.style.cssText); // will fail on Opera?
				node.className += " " + this.srcNodeRef.className;
			}

			// extra listeners
			if(node.addEventListener){
				// dojo.connect() doesn't seem to work with DOMMouseScroll
				node.addEventListener('DOMMouseScroll', dojo.hitch(this, "_mouseWheeled"), false); // Mozilla + Firefox + Netscape
			}else{
				dojo.connect(node, "onmousewheel", this, "_mouseWheeled"); // IE + Safari
			}
			dijit.util.typematic.addListener(this.upArrowNode, node, {key:dojo.keys.UP_ARROW,ctrlKey:false,altKey:false,shiftKey:false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout);
			dijit.util.typematic.addListener(this.downArrowNode, node, {key:dojo.keys.DOWN_ARROW,ctrlKey:false,altKey:false,shiftKey:false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout);
		}
});
