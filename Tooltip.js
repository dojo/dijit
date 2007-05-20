dojo.provide("dijit.Tooltip");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.util.place");
dojo.require("dijit.util.BackgroundIframe");

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

		// opacity: Number
		//		Final opacity tooltips are shown at, after fade in
		opacity: 0.95,

		templatePath: dojo.moduleUrl("dijit", "templates/Tooltip.html"),

		postCreate: function(){
			dojo.body().appendChild(this.domNode);

			this.bgIframe = new dijit.util.BackgroundIframe();
			this.bgIframe.setZIndex(dojo.style(this.domNode, "zIndex")-1);

			this.fadeIn = dojo._fade({node: this.domNode, duration: this.duration, end: this.opacity});
			dojo.connect(this.fadeIn, "onEnd", this, "_onShow");
			this.fadeOut = dojo._fade({node: this.domNode, duration: this.duration, end: 0});
			dojo.connect(this.fadeOut, "onEnd", this, "_onHide");

		},

		show: function(/*String*/ innerHTML, /*DomNode*/ aroundNode){
			// summary: display tooltip w/specified contents underneath specified node

			if(this.fadeOut.status() == "playing"){
				// previous tooltip is being hidden; wait until the hide completes then show new one
				this._onDeck=arguments;
				return;
			}
			this.containerNode.innerHTML=innerHTML;
			dijit.util.placeOnScreenAroundElement(this.domNode, aroundNode, [0,0],
				{'BL': 'TL', 'TL': 'BL'});
			dojo.style(this.domNode, "opacity", 0);
			this.fadeIn.play();
			this.isShowingNow = true;
		},

		_onShow: function(){
			this.bgIframe.size(this.domNode);
			this.bgIframe.show();
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
			this.bgIframe.hide();
			if(this._onDeck){
				// a show request has been queue up; do it now
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
			// guaranteeDescendant allows us to be a "true" isDescendantOf function

			while(node){
				if(node === ancestor){ 
					return true; // boolean
				}
				try{
					node = node.parentNode;
				}catch(e){
					return true;
				}
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
		}
	}
);
