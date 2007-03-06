dojo.provide("dijit.TitlePane");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");


dojo.require("dojo.html.style");
dojo.require("dojo.lfx.*");

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
	
	// width: String
	//		width of the pane
	width: "",

	templatePath: dojo.uri.moduleUri("dijit", "templates/TitlePane.html"),

	postCreate: function() {
		if (this.label) {
			this.labelNode.appendChild(document.createTextNode(this.label));
		}
		// NEEDS WORK - assuming width in pixels
		if (this.width) {
			this.labelNode.style.width = this.width+"px";
			this.containerNode.style.width = this.width+"px";
		}

		if (!this.open) {
			dojo.html.hide(this.containerNode);
		}
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
