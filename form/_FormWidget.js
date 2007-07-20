dojo.provide("dijit.form._FormWidget");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit.util.sniff");
dojo.require("dijit.util.wai");
dojo.require("dijit.util.focus");

dojo.declare("dijit.form._FormWidget", [dijit._Widget, dijit._Templated],
{
	/*
	Summary:
		FormElement widgets correspond to native HTML elements such as <input> or <button> or <select>.
		Each FormElement represents a single input value, and has a (possibly hidden) <input> element,
		to which it serializes its input value, so that form submission (either normal submission or via FormBind?)
		works as expected.

		All these widgets should have these attributes just like native HTML input elements.
		You can set them during widget construction, but after that they are read only.

		They also share some common methods.
	*/

	// baseClass: String
	//		Used to add CSS classes like FormElementDisabled
	// TODO: remove this in favor of this.domNode.baseClass?
	baseClass: "",

	// value: String
	//		Corresponds to the native HTML <input> element's attribute.
	value: "",

	// name: String
	//		Name used when submitting form; same as "name" attribute or plain HTML elements
	name: "",

	// id: String
	//		Corresponds to the native HTML <input> element's attribute.
	//		Also becomes the id for the widget.
	id: "",

	// alt: String
	//		Corresponds to the native HTML <input> element's attribute.
	alt: "",

	// type: String
	//		Corresponds to the native HTML <input> element's attribute.
	type: "text",

	// tabIndex: Integer
	//		Order fields are traversed when user hits the tab key
	tabIndex: "0",

	// disabled: Boolean
	//		Should this widget respond to user input?
	//		In markup, this is specified as "disabled='disabled'", or just "disabled".
	disabled: false,

	// intermediateChanges: Boolean
	//              Fires onChange for each value change or only on demand
	intermediateChanges: false,

	setDisabled: function(/*Boolean*/ disabled){
		// summary:
		//		Set disabled state of widget.

		this.domNode.disabled = this.disabled = disabled;
		if(this.focusNode){
			this.focusNode.disabled = disabled;
		}
		dijit.util.wai.setAttr(this.focusNode || this.domNode, "waiState", "disabled", disabled);
		this._setStateClass();
	},


	_onMouse : function(/*Event*/ event){
		// summary:
		//	Sets _hovering, _active, and baseClass attributes depending on mouse state,
		//	then calls setStateClass() to set appropriate CSS class for this.domNode.
		//
		//	To get a different CSS class for hover, send onmouseover and onmouseout events to this method.
		//	To get a different CSS class while mouse button is depressed, send onmousedown to this method.

		var mouseNode = event.target;

		if(!this.disabled){
			switch(event.type){
				case "mouseover" :
					this._hovering = true;
					var baseClass, node=mouseNode;
					while( !(baseClass=node.getAttribute("baseClass")) && node != this.domNode ){
						node=node.parentNode;
					}
					this.baseClass= baseClass || "dijit"+this.declaredClass.replace(/.*\./g,"");
					break;

				case "mouseout" :	
					this._hovering = false;	
					this.baseClass=null;
					break;

				case "mousedown" :
					this._active = true;
					// set a global event to handle mouseup, so it fires properly
					//	even if the cursor leaves the button
					this._active = true;
					var self = this;
					// #2685: use this.connect and disconnect so destroy works properly
					var mouseUpConnector = this.connect(dojo.body(), "onmouseup", function(){
						self._active = false;
						self._setStateClass();
						self.disconnect(mouseUpConnector);
					});
					break;
			}
			this._setStateClass();
		}
	},

	focus: function(){
		dijit.util.focus.set(this.focusNode);
	},

	_setStateClass: function(/*String*/ base){
		// summary:
		//	Update the visual state of the widget by changing the css class on the domnode
		//	according to widget state.
		//
		//	State will be one of:
		//		<baseClass>
		//		<baseClass> + "Disabled"	- if the widget is disabled
		//		<baseClass> + "Active"		- if the mouse (or space/enter key?) is being pressed down
		//		<baseClass> + "Hover"		- if the mouse is over the widget (TODO: also on focus?)
		//
		//	Note: if you don't want to change the way the widget looks on hover, then don't call
		//	this routine on hover.  Similarly for mousedown --> active
		//
		//	For widgets which can be in a checked state (like checkbox or radio),
		//	in addition to the above classes...
		//		<baseClass> + "Checked"
		//		<baseClass> + "CheckedDisabled"	- if the widget is disabled
		//		<baseClass> + "CheckedActive"		- if the mouse is being pressed down
		//		<baseClass> + "CheckedHover"		- if the mouse is over the widget
		//
		//	TODO:
		//		Selected widgets. A menu item can be selected (ie, highlighted),
		//		and eventually will be able to be checked/not checked, independently.

		// get original class specified in template
		var origClass = this._origClass || (this._origClass = this.domNode.className);

		// compute the single classname representing the state of the widget
		var state = this.baseClass || this.domNode.getAttribute("baseClass");
		if(this.checked){
			state += "Checked"
		}
		if(this.disabled){
			state += "Disabled";
		}else if(this._active){
			state += "Active";
		}else if(this._hovering){
			state += "Hover";
		}
		this.domNode.className = origClass + " " + " " + state;
	},

	onChange: function(newValue){
		// summary: callback when value is changed
	},

	postCreate: function(){
		this.setDisabled(this.disabled);
		this._setStateClass();
		this.setValue(this.value, true);
	},

	setValue: function(/*anything*/ newValue, /*Boolean, optional*/ priorityChange){
		// summary: set the value of the widget.
		this._lastValue = newValue;
		dijit.util.wai.setAttr(this.focusNode || this.domNode, "waiState", "valuenow", this.forWaiValuenow());
		if((this.intermediateChanges || priorityChange) && newValue != this._lastValueReported){
			this._lastValueReported = newValue;
			this.onChange(newValue);
		}
	},

	getValue: function(){
		// summary: get the value of the widget.
		return this._lastValue;
	},

	undo: function(){
		// summary: restore the value to the last value passed to onChange
		this.setValue(this._lastValueReported, false);
	},

	_onKeyPress: function(e){
		if(e.keyCode == 27 && !e.shiftKey && !e.ctrlKey && !e.altKey){
			var v = this.getValue();
			if(v != this._lastValueReported && this._lastValueReported != undefined){
				this.undo();
				dojo.stopEvent(e);
			}else if(dojo.isMozilla){ // needed by FF2 to keep it from putting the value back
				this.setValue(v, false);
			}
		}
	},

	forWaiValuenow: function(){
		// summary: returns a value, reflecting the current state of the widget,
		//		to be used for the ARIA valuenow.
		// 		This method may be overridden by subclasses that want
		// 		to use something other than this.getValue() for valuenow
		return this.getValue();
	}
});
