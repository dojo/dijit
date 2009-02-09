dojo.provide("dijit.MenuBar");

dojo.require("dijit.Menu");

dojo.declare("dijit.MenuBar", dijit._MenuBase, {
	// summary:
	//		A menu bar, listing menu choices horizontally, like the "File" menu in most desktop applications

	templatePath: dojo.moduleUrl("dijit", "templates/MenuBar.html"),

	_isMenuBar: true,

	constructor: function(){
		// parameter to dijit.popup.open() about where to put popup (relative to this.domNode)
		this._orient = this.isLeftToRight() ? {BL: 'TL'} : {BR: 'TR'};
	},

	postCreate: function(){
		var k = dojo.keys, l = this.isLeftToRight();
		this.connectKeyNavHandlers(
			l ? [k.LEFT_ARROW] : [k.RIGHT_ARROW],
			l ? [k.RIGHT_ARROW] : [k.LEFT_ARROW]
		);
	},

	focusChild: function(item){
		// overload focusChild so that whenever the focus is moved to a new item,
		// check the previous focused whether it has its popup open, if so, after 
		// focusing the new item, open its submenu immediately
		var from_item = this.focusedChild,
			showpopup = from_item && from_item.popup && from_item.popup.isShowingNow;
		this.inherited(arguments);
		if(showpopup && !item.disabled){
			this._openPopup();
		}
	},
	
	_onKeyPress: function(/*Event*/ evt){
		// summary:
		//		Handle keyboard based menu navigation.
		if(evt.ctrlKey || evt.altKey){ return; }

		switch(evt.charOrCode){
			case dojo.keys.DOWN_ARROW:
				this._moveToPopup(evt);
				dojo.stopEvent(evt);
		}
	}
});
