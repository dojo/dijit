dojo.provide("dijit.TitlePane");

dojo.require("dojo.fx");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare(
	"dijit.TitlePane",
	[dijit._Widget, dijit._Templated],
{
	// summary
	//		A pane with a title on top, that can be opened or collapsed.

	// title: String
	//		Title of the pane
	title: "",

	// open: Boolean
	//		Whether pane is opened or closed.
	open: true,

	// duration: Integer
	//		milliseconds to fade in/fade out
	duration: 250,

	templatePath: dojo.moduleUrl("dijit", "templates/TitlePane.html"),

	postCreate: function(){
		this.setTitle(this.title);
		if(!this.open){
			dojo.style(this.containerNode, "display", "none");
		}
		this._setCss();
		dojo.setSelectable(this.titleNode, false);
		dijit.TitlePane.superclass.postCreate.apply(this, arguments);
		dijit.wai.setAttr(this.containerNode, "waiState", "titleledby", this.titleNode.id);
		dijit.wai.setAttr(this.focusNode, "waiState", "haspopup", "true");

		// setup open/close animations
		this._slideIn = dojo.fx.slideIn({node: this.containerNode, duration: this.duration});
		this._slideOut = dojo.fx.slideOut({node: this.containerNode, duration: this.duration});
	},

	_onTitleClick: function(){
		// summary: callback when title is clicked
		dojo.forEach([this._slideIn, this._slideOut], function(animation){
			if(animation.status() == "playing"){
				animation.stop();
			}
		});
		this[this.open ? "_slideOut" : "_slideIn"].play();
		this.open=!this.open;
		this._setCss();
	},

	_setCss: function(){
		var classes = ["dijitClosed", "dijitOpen"];
		var boolIndex = this.open;
		dojo.removeClass(this.domNode, classes[!boolIndex+0]);
		this.domNode.className += " " + classes[boolIndex+0];

		// provide a character based indicator for images-off mode
		this.arrowNodeInner.innerHTML =
			this.open ? "&#9660;" : this.isLeftToRight() ? "&#9658;" : "&#9668"; 
	},	

	_onTitleKey: function(/*Event*/ e){
		// summary: callback when user hits a key
		if(e.keyCode == dojo.keys.ENTER || e.charCode == dojo.keys.SPACE){
			this._onTitleClick();
		}
		else if (e.keyCode == dojo.keys.DOWN_ARROW){
			if(this.open){
				this.containerNode.focus();
				e.preventDefault();
			}
	 	}
	},

	setTitle: function(/*String*/ title){
		// summary: sets the text of the title
		this.titleNode.innerHTML=title;
	}
});
