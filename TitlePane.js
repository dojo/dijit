dojo.provide("dijit.TitlePane");

dojo.require("dojo.fx");

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
	
	templatePath: dojo.moduleUrl("dijit", "templates/TitlePane.html"),

	postCreate: function(){
		this.setLabel(this.label);
		if(!this.open){
			dojo.style(this.containerNode, "display", "none");
		}
		this._setCss();
		dijit.TitlePane.superclass.postCreate.apply(this, arguments);
		dijit.util.wai.setAttr(this.containerNode, "waiState", "labelledby", this.labelNode.id);
		dijit.util.wai.setAttr(this.labelNode, "waiState", "haspopup", "true");
	},

	onLabelClick: function(){
		// summary: callback when label is clicked
		dojo.fx[this.open ? "slideOut" : "slideIn"]({node: this.containerNode, duration: 250}).play();
		this.open=!this.open;
		this._setCss();
	},

	_setCss: function(){
		var classes = ["dojoClosed", "dojoOpen"];
		var boolIndex = this.open;
		this._removeClass(this.domNode, classes[!boolIndex+0]);
		this.domNode.className += " " + classes[boolIndex+0];
	},

	onLabelKey: function(/*Event*/ e){
		// summary: callback when user hits a key
		if(e.keyCode == dojo.keys.ENTER){
			this.onLabelClick();
			if(this.open){
				this.containerNode.focus();
			}
	 	}
	},

	setLabel: function(/*String*/ label){
		// summary: sets the text of the label
		this.labelNode.innerHTML=label;
	}
});
