dojo.provide("dijit.base.Showable");

//TODO: do we need this class at all?
dojo.declare("dijit.base.Showable", null,
{
	// Summary
	//		Mixin for widgets that show/hide themselves in a fancy way

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
		this.domNode.style.display = "";
		this.onShow();
	},

	onShow: function(){
		// summary: callback for when widget is shown
	},

	hide: function(){
		// summary: hide the widget (ending up with display:none)
		if(!this.isShowing()){ return; }
		this.domNode.style.display = "none";
		this.onHide();
	},
	
	onHide: function(){
		// summary: callback for when widget is hidden
	}
});
