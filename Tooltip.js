dojo.provide("dijit.Tooltip");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.util.place");
dojo.require("dijit.util.popup");
dojo.require("dijit.util.sniff");

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
		duration: 200,

		templatePath: dojo.moduleUrl("dijit", "templates/Tooltip.html"),

		postCreate: function(){
			dojo.body().appendChild(this.domNode);

			this.bgIframe = new dijit.util.BackgroundIframe(this.domNode);

			// Setup fade-in and fade-out functions.  An IE bug prevents the arrow from showing up
			// unless opacity==1, because it's displayed via overflow: visible on the main div.
			var opacity = dojo.isIE ? 1 : dojo.style(this.domNode, "opacity");
			this.fadeIn = dojo._fade({node: this.domNode, duration: this.duration, end: opacity});
			dojo.connect(this.fadeIn, "onEnd", this, "_onShow");
			this.fadeOut = dojo._fade({node: this.domNode, duration: this.duration, end: 0});
			dojo.connect(this.fadeOut, "onEnd", this, "_onHide");

		},

		show: function(/*String*/ innerHTML, /*DomNode*/ aroundNode){
			// summary:
			//	Display tooltip w/specified contents to right specified node
			//	(To left if there's no space on the right, or if LTR==right

			if(this.fadeOut.status() == "playing"){
				// previous tooltip is being hidden; wait until the hide completes then show new one
				this._onDeck=arguments;
				return;
			}
			this.containerNode.innerHTML=innerHTML;

			// position the element and change CSS according to position	
			var align = this.isLeftToRight() ? {'BR': 'BL', 'BL': 'BR'} : {'BL': 'BR', 'BR': 'BL'};
			dijit.util.placeOnScreenAroundElement(this.domNode, aroundNode, [0,0], align);
			// TODO: need to know which position placeOnScreenAroundElement picked
			this.domNode.className="dijitTooltip dijitTooltip" + (this.isLeftToRight() ? "Right" : "Left");
			
			// show it
			dojo.style(this.domNode, "opacity", 0);
			this.fadeIn.play();
			this.isShowingNow = true;
		},

		_onShow: function(){
			if(dojo.isIE){
				// the arrow won't show up on a node w/an opacity filter
				this.domNode.style.filter="";
			}
		},

		hide: function(){
			// summary: hide the tooltip
			if(this._onDeck){
				// this hide request is for a show() that hasn't even started yet;
				// just cancel the pending show()
				this._onDeck=null;
				return;
			}
			this.fadeIn.stop();
			this.isShowingNow = false;
			this.fadeOut.play();
		},

		_onHide: function(){
			this.domNode.style.cssText="";	// to position offscreen again
			if(this._onDeck){
				// a show request has been queued up; do it now
				this.show.apply(this, this._onDeck);
				this._onDeck=null;
			}
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

		postCreate: function(){
			this._connectNode = dojo.byId(this.connectId);

			dojo.forEach(["onMouseOver", "onHover", "onMouseOut", "onUnHover"], function(event){
				this.connect(this._connectNode, event.toLowerCase(), "_"+event);
			}, this);
		},

		//PORT #2804
		_isDescendantOf: function(/*Node*/node, /*Node*/ancestor){
			//	summary
			//	Returns boolean if node is a descendant of ancestor

			while(node){
				if(node === ancestor){
					return true; // boolean
				}
				try{
					node = node.parentNode;
				}catch(e){
					return false;
				}
			}
			return false; // boolean
		},

		_onMouseOver: function(/*Event*/ e){
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
		}
	}
);
