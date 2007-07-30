dojo.provide("dijit.TitlePane");

dojo.require("dojo.fx");

dojo.require("dijit._Templated");
dojo.require("dijit.layout.ContentPane");

dojo.declare(
	"dijit.TitlePane",
	[dijit.layout.ContentPane, dijit._Templated],
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
			this.hideNode.style.display = this.wipeNode.style.display = "none";
		}
		this._setCss();
		dojo.setSelectable(this.titleNode, false);
		dijit.TitlePane.superclass.postCreate.apply(this, arguments);
		dijit.wai.setAttr(this.containerNode, "waiState", "titleledby", this.titleNode.id);
		dijit.wai.setAttr(this.focusNode, "waiState", "haspopup", "true");

		// setup open/close animations
		var hideNode = this.hideNode, wipeNode = this.wipeNode;
		this._slideIn = dojo.fx.slideIn({
			node: this.wipeNode,
			duration: this.duration,
			beforeBegin: function(){
				hideNode.style.display="";
			}
		});
		this._slideOut = dojo.fx.slideOut({
			node: this.wipeNode,
			duration: this.duration,
			onEnd: function(){
				hideNode.style.display="none";
			}
		});
	},

	setContent: function(content){
		// summary
		// 		Typically called when an href is loaded.  Our job is to make the animation smooth
		if(this._slideOut.status() == "playing"){
			// we are currently *closing* the pane, so just let that continue
			dijit.layout.ContentPane.prototype.setContent.apply(this, content);
		}else{
			if(this._slideIn.status() == "playing"){
				this._slideIn.stop();
			}
			
			// freeze container at current height so that adding new content doesn't make it jump
			dojo.marginBox(this.wipeNode, {h: dojo.marginBox(this.wipeNode).h});

			// add the new content (erasing the old content, if any)
			dijit.layout.ContentPane.prototype.setContent.apply(this, arguments);
			
			// call _slideIn.play() to animate from current height to new height
			this._slideIn.play();
		}
	},

	toggle: function(){
		// summary: switches between opened and closed state
		dojo.forEach([this._slideIn, this._slideOut], function(animation){
			if(animation.status() == "playing"){
				animation.stop();
			}
		});

		this[this.open ? "_slideOut" : "_slideIn"].play();
		this.open=!this.open;

		// load content (if this is the first time we are opening the TitlePane
		// and content is specified as an href, or we have setHref when hidden)
		// FIXME: this breaks when user declares onShow='myFunction()' in markup
		// see #3905
		this.onShow();

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
