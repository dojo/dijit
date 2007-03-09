dojo.provide("dijit.Tooltip");

dojo.require("dojo.lang.declare");
dojo.require("dojo.uri.Uri");
dojo.require("dojo.event.*");
dojo.require("dojo.html.style");
dojo.require("dojo.html.util");

dojo.require("dijit.base.Widget");
dojo.require("dijit.util.PopupManager");

dojo.declare(
	"dijit.Tooltip",
	[dijit.base.Widget],
	{
		// summary
		//		Pops up a tooltip (a help message) when you hover over a node

		// caption: String
		//		Text to display in the tooltip.
		//		Can also be specified as innerHTML (when creating the widget from markup).
		caption: "",
		
		// showDelay: Integer
		//		Number of milliseconds to wait after hovering over the object, before
		//		the tooltip is displayed.
		showDelay: 500,
		
		// hideDelay: Integer
		//		Number of milliseconds to wait after moving mouse off of the object (or
		//		off of the tooltip itself), before erasing the tooltip
		hideDelay: 100,
		
		// connectId: String
		//		Id of domNode to attach the tooltip to.
		//		(When user hovers over specified dom node, the tooltip will appear.)
		connectId: "",

		postCreate: function(){
			this._connectNode = dojo.byId(this.connectId);
			dojo.event.connect(this._connectNode, "onmouseover", this, "_onMouseOver");

			if(this.caption != ""){
				this.domNode.appendChild(document.createTextNode(this.caption));
			}
			dojo.html.addClass(this.domNode, "dojoTooltip");
		},

		_onMouseOver: function(/*Event*/ e){
			this._mouse = {pageX: e.pageX, pageY: e.pageY, target: e.target};

			// Start tracking mouse movements, so we know when to cancel timers or erase the tooltip
			if(!this._tracking){
				dojo.event.connect(document.documentElement, "onmousemove", this, "_onMouseMove");
				this._tracking=true;
			}

			this._onHover(e);			
		},

		_onMouseMove: function(/*Event*/ e) {
			this._mouse = {pageX: e.pageX, pageY: e.pageY, target: e.target};

			if(dojo.html.overElement(this._connectNode, e) || dojo.html.overElement(this.domNode, e)){
				this._onHover(e);
			} else {
				// mouse has been moved off the element/tooltip
				// note: can't use onMouseOut to detect this because the "explode" effect causes
				// spurious onMouseOut events (due to interference from outline), w/out corresponding _onMouseOver
				this._onUnHover(e);
			}
		},

		_onHover: function(/*Event*/ e) {
			if(this._hover){ return; }
			this._hover=true;

			// If the tooltip has been scheduled to be erased, cancel that timer
			// since we are hovering over element/tooltip again
			if(this._hideTimer) {
				clearTimeout(this._hideTimer);
				delete this._hideTimer;
			}
			
			// If tooltip not showing yet then set a timer to show it shortly
			if(!this.isShowingNow && !this._showTimer){
				this._showTimer = setTimeout(dojo.lang.hitch(this, "open"), this.showDelay);
			}
		},

		_onUnHover: function(/*Event*/ e){
			if(!this._hover){ return; }
			this._hover=false;

			if(this._showTimer){
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
			if(this.isShowingNow && !this._hideTimer){
				this._hideTimer = setTimeout(dojo.lang.hitch(this, "close"), this.hideDelay);
			}
			
			// If we aren't showing the tooltip, then we can stop tracking the mouse now;
			// otherwise must track the mouse until tooltip disappears
			if(!this.isShowingNow){
				dojo.event.disconnect(document.documentElement, "onmousemove", this, "_onMouseMove");
				this._tracking=false;
			}
		},

		open: function() {
			// summary: display the tooltip; usually not called directly.

			if (this.isShowingNow) { return; }
			dijit.util.PopupManager.open(this._mouse, this, [10,15]);
			this.isShowingNow = true;
		},

		close: function() {
			// summary: hide the tooltip; usually not called directly.
			if (this.isShowingNow) {
				if ( this._showTimer ) {
					clearTimeout(this._showTimer);
					delete this._showTimer;
				}
				if ( this._hideTimer ) {
					clearTimeout(this._hideTimer);
					delete this._hideTimer;
				}
				dojo.event.disconnect(document.documentElement, "onmousemove", this, "_onMouseMove");
				this._tracking=false;
				dijit.util.PopupManager.close();
				this.isShowingNow = false;
			}
		},

		_loadedContent: function(){
			if(this.isShowingNow){
				// the tooltip has changed size due to downloaded contents, so reposition it
				// TODO: this.move(this._mouse, [10,15], "TL,TR,BL,BR");
			}
		},

		uninitialize: function(){
			this.close();
			dojo.event.disconnect(this._connectNode, "onmouseover", this, "_onMouseOver");
		}
	}
);
