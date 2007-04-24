dojo.provide("dijit.Tooltip");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.util.place");

dojo.declare(
	"dijit._MasterTooltip",
	[dijit.base.Widget, dijit.base.TemplatedWidget],
	{
		// summary
		//		Internal widget that holds the actual tooltip markup,
		//		which occurs once per page.
		//		Called by Tooltip widgets which are just containers to hold
		//		the markup

		// duration: Integer
		//		Milliseconds to fade in/fade out
		duration: 100,

		templatePath: dojo.moduleUrl("dijit", "templates/Tooltip.html"),

		postCreate: function(){
			this.domNode.style.display="none";
			dojo.body().appendChild(this.domNode);
		},

		show: function(/*String*/ innerHTML, /*DomNode*/ aroundNode){
			// summary: display tooltip w/specified contents underneath specified node

			if (this.isShowingNow){
				this.domNode.style.display="none";
			}
			this.containerNode.innerHTML=innerHTML;
			dijit.util.placeOnScreenAroundElement(this.domNode, aroundNode, [0,0],
				{'BL': 'TL', 'TL': 'BL'});
			var anim = dojo.fadeIn({node: this.domNode, duration: this.duration});
			dojo.connect(anim, "onEnd", this, function(){
				dojo.style(this.domNode, "display", "");
			});
			anim.play();
			this.isShowingNow = true;
		},

		hide: function(){
			// summary: hide the tooltip
			this.isShowingNow = false;
			var anim = dojo.fadeOut({node: this.domNode, duration: this.duration});
			dojo.connect(anim, "onEnd", this, function(){
				dojo.style(this.domNode, "display", "none");
			});
			anim.play();
		}
	}
);

// Make a single tooltip markup on the page that is reused as appropriate
dojo.addOnLoad(function(){
	dijit.MasterTooltip = new dijit._MasterTooltip();
});

dojo.declare(
	"dijit.Tooltip",
	dijit.base.Widget,
	{
		// summary
		//		Pops up a tooltip (a help message) when you hover over a node.

		// caption: String
		//		Text to display in the tooltip.
		//		Can also be specified as innerHTML (when creating the widget from markup).
		caption: "",
		
		// showDelay: Integer
		//		Number of milliseconds to wait after hovering over/focusing on the object, before
		//		the tooltip is displayed.
		showDelay: 400,
		
		// connectId: String
		//		Id of domNode to attach the tooltip to.
		//		(When user hovers over specified dom node, the tooltip will appear.)
		connectId: "",

		// A hash to hold connect handles for cleanup
		_connections: [],

		postCreate: function(){
			this._connectNode = dojo.byId(this.connectId);

			dojo.forEach(["onMouseOver", "onHover", "onMouseOut", "onUnHover"], function(event){
				this._connections.event = dojo.connect(this._connectNode, event.toLowerCase(), this, "_"+event);
			}, this);
		},

		//PORT from dojo.dom.isDescendantOf
		_isDescendantOf: function(/*Node*/node, /*Node*/ancestor){
			//	summary
			//	Returns boolean if node is a descendant of ancestor
			// guaranteeDescendant allows us to be a "true" isDescendantOf function

			while(node){
				if(node === ancestor){ 
					return true; // boolean
				}
				node = node.parentNode;
			}
			return false; // boolean
		},

		_onMouseOver: function(/*Event*/ e){
			if(this._isDescendantOf(e.relatedTarget, this._connectNode)){
				// false event; just moved from target child to target; ignore.
				return;
			}
			this._onHover(e);
		},

		_onMouseOut: function(/*Event*/ e){
			if(this._isDescendantOf(e.relatedTarget, this._connectNode)){
				// false event; just moved from target to target child; ignore.
				return;
			}
			this._onUnHover(e);
		},

		_onHover: function(/*Event*/ e){
			if(this._hover){ return; }
			this._hover=true;

			// If tooltip not showing yet then set a timer to show it shortly
			if(!this.isShowingNow && !this._showTimer){
				this._showTimer = setTimeout(dojo.hitch(this, "open"), this.showDelay);
			}
		},

		_onUnHover: function(/*Event*/ e){
			if(!this._hover){ return; }
			this._hover=false;

			if(this._showTimer){
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}else{
				this.close();
			}
		},

		open: function(){
			// summary: display the tooltip; usually not called directly.
			if(this.isShowingNow){ return; }
			if(this._showTimer){
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
			delete this._showTimer;
			dijit.MasterTooltip.show(this.caption || this.domNode.innerHTML, this._connectNode);
			this.isShowingNow = true;
		},

		close: function(){
			// summary: hide the tooltip; usually not called directly.
			if(!this.isShowingNow){ return; }
			dijit.MasterTooltip.hide();
			this.isShowingNow = false;
		},

		uninitialize: function(){
			this.close();
			for(var event in this._connections){
				dojo.disconnect(this._connectNode, event, this._connections.event);
			}
			this._connections = {};
		}
	}
);
