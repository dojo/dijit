dojo.provide("dijit.TitlePane");

dojo.require("dojo.html.style");
dojo.require("dojo.lfx.*");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");

dojo.declare(
	"dijit.TitlePane",
	[dijit.base.Widget, dijit.base.TemplatedWidget],
{
	// summary
	//		A pane with a title on top, that can be opened or collapsed.
	
	// label: String
	//		Title of the pane
	label: "",
	
	// open: Boolean
	//		Whether pane is opened or closed.
	open: true,
	
	templatePath: dojo.uri.moduleUri("dijit", "templates/TitlePane.html"),

	postCreate: function() {
		this.setLabel(this.label);
		if (!this.open) {
			dojo.html.hide(this.containerNode);
		}
		this._setCss();
		dijit.TitlePane.superclass.postCreate.apply(this, arguments);
		dijit.util.wai.setAttr(this.containerNode, "waiState", "labelledby", this.labelNode.id);
		dijit.util.wai.setAttr(this.labelNode, "waiState", "haspopup", "true");
	},

	onLabelClick: function() {
		// summary: callback when label is clicked
		if (this.open) {
			dojo.lfx.wipeOut(this.containerNode, 250).play();
			this.open=false;
		} else {
			dojo.lfx.wipeIn(this.containerNode, 250).play();
			this.open=true;
		}
		this._setCss();
	},

	_setCss: function(){
		dojo.html.removeClass(this.domNode, this.open ? "dojoClosed" : "dojoOpen");
		dojo.html.addClass(this.domNode, this.open ? "dojoOpen" : "dojoClosed");
	},

	onLabelKey: function(/*Event*/ e){
		// summary: callback when user hits a key
		var k = dojo.event.browser.keys;
		if(e.key == k.KEY_ENTER){
			this.onLabelClick();
			if (this.open == true) {
				this.containerNode.focus();
			}
	 	}
	},

	setLabel: function(/*String*/ label) {
		// summary: sets the text of the label
		this.labelNode.innerHTML=label;
	}
});
