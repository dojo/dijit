dojo.provide("dijit.base.Showable");

dojo.declare("dijit.base.Showable", null,
{
	// Summary
	//		Mixin for widgets that show/hide themselves in a fancy way

	// toggle: String
	//	Controls animation effect for when show() and hide() (or toggle()) are called.
	//	Possible values: "plain", "wipe", "fade", "explode"
	toggle: "plain",

	// toggleDuration: Integer
	//	Number of milliseconds for toggle animation effect to complete
	toggleDuration: 150,

	isShowing: function(){
		// summary
		//	Tests whether widget is set to show-mode or hide-mode (see show() and 
		//	hide() methods)
		//
		//	This function is poorly named.  Even if widget is in show-mode,
		//	if it's inside a container that's hidden
		//	(either a container widget, or just a domnode with display:none),
		//	then it won't be displayed
		return dojo.style(this.domNode, "display") != 'none';	// Boolean
	},

	toggleShowing: function(){
		// summary: show or hide the widget, to switch it's state
		if(this.isShowing()){
			this.hide();
		}else{
			this.show();
		}
	},

	show: function(){
		// summary: show the widget
		if(this.isShowing()){ return; }
		this.animationInProgress=true;
//Q: where is toggleObj defined?
		this.toggleObj.show(this.domNode, this.toggleDuration, null,
			dojo.hitch(this, this.onShow), this.explodeSrc);
	},

	_onShow: function(){
		// summary: called after the show() animation has completed
		this.animationInProgress=false;
	},

	onShow: function(){
		// summary: callback for when widget is shown
	},

	hide: function(){
		// summary: hide the widget (ending up with display:none)
		if(!this.isShowing()){ return; }
		this.animationInProgress = true;
		this.toggleObj.hide(this.domNode, this.toggleDuration, null,
			dojo.hitch(this, this.onHide), this.explodeSrc);
	},

	_onHide: function(){
		// summary: called after the hide() animation has completed
		this.animationInProgress=false;
	},
	
	onHide: function(){
		// summary: callback for when widget is hidden
	}
});
