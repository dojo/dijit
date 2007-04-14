dojo.provide("dijit.Tooltip");

dojo.require("dojo.lang.declare");
dojo.require("dojo.uri.Uri");
dojo.require("dojo.event.*");
dojo.require("dojo.html.style");
dojo.require("dojo.html.util");
dojo.require("dojo.lfx.html");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");

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

		templatePath: dojo.uri.moduleUri("dijit", "templates/Tooltip.html"),

		postCreate: function() {
			this.domNode.style.display="none";
			dojo.body().appendChild(this.domNode);
			this.fadeShow=dojo.lfx.fadeShow(this.domNode, this.duration);
			this.fadeHide=dojo.lfx.fadeHide(this.domNode, this.duration);
		},

		show: function(/*String*/ innerHTML, /*DomNode*/ aroundNode) {
			// summary: display the tooltip

			if (this.isShowingNow) {
				this.hide();
			}
			this.containerNode.innerHTML=innerHTML;
			dojo.html.placeOnScreenAroundElement(this.domNode, aroundNode, [0,0],
				dojo.html.boxSizing.BORDER_BOX, {'BL': 'TL', 'TL': 'BL'});
			this.fadeShow.play();
			this.isShowingNow = true;
		},

		hide: function() {
			// summary: hide the tooltip
			this.isShowingNow = false;
			this.fadeHide.play();
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

			dojo.event.connect(this._connectNode, "onmouseover", this, "_onMouseOver");
			dojo.event.connect(this._connectNode, "onfocus", this, "_onHover");
			dojo.event.connect(this._connectNode, "onmouseout", this, "_onMouseOut");
			dojo.event.connect(this._connectNode, "onblur", this, "_onUnHover");
		},

		_onMouseOver: function(/*Event*/ e){
			if(dojo.dom.isDescendantOf(e.relatedTarget, this._connectNode)){
				// false event; just moved from target child to target; ignore.
				return;
			}
			this._onHover(e);
		},

		_onMouseOut: function(/*Event*/ e){
			if(dojo.dom.isDescendantOf(e.relatedTarget, this._connectNode)){
				// false event; just moved from target to target child; ignore.
				return;
			}
			this._onUnHover(e);
		},

		_onHover: function(/*Event*/ e) {
			if(this._hover){ return; }
			this._hover=true;

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
			this.close();
		},

		open: function() {
			// summary: display the tooltip; usually not called directly.
			if (this.isShowingNow) { return; }
			dijit.MasterTooltip.show(this.caption || this.domNode.innerHTML, this._connectNode);
		},

		close: function() {
			// summary: hide the tooltip; usually not called directly.
			dijit.MasterTooltip.hide();
		},

		uninitialize: function(){
			this.close();
			dojo.event.disconnect(this._connectNode, "onmouseover", this, "_onMouseOver");
			dojo.event.disconnect(this._connectNode, "onfocus", this, "_onHover");
			dojo.event.disconnect(this._connectNode, "onmouseout", this, "_onMouseOut");
			dojo.event.disconnect(this._connectNode, "onblur", this, "_onUnHover");
		}
	}
);

