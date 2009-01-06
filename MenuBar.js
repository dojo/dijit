dojo.provide("dijit.MenuBar");

dojo.require("dijit.Menu");

dojo.declare("dijit.MenuBar", dijit._MenuBase, {
	// summary:
	//		A menu bar, listing menu choices horizontally, like the "File" menu in most desktop applications

	templateString: '<div class="dijitMenuBar dijitMenuPassive" dojoAttachPoint="containerNode"  tabIndex="${tabIndex}" dojoAttachEvent="onkeypress: _onKeyPress"></div>',

	_isMenuBar: true,

	constructor: function(){
		//	parameter to dijit.popup.open() about where to put popup (relative to this.domNode)
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
		//	overload focusChild so that whenever the focus is moved to a new item,
		//	check the previous focused whether it has its popup open, if so, after 
		//	focusing the new item, open its submenu immediately
		var from_item = this.focusedChild,
			showpopup = from_item && from_item.popup && from_item.popup.isShowingNow;
		this.inherited(arguments);
		if(showpopup){
			this._openPopup();
		}
	},
	
	_onKeyPress: function(/*Event*/ evt){
		// summary: Handle keyboard based menu navigation.
		if(evt.ctrlKey || evt.altKey){ return; }

		switch(evt.charOrCode){
			case dojo.keys.DOWN_ARROW:
				this._moveToPopup(evt);
				dojo.stopEvent(evt);
		}
	}
});

dojo.declare("dijit.MenuBarItem", dijit.PopupMenuItem, {
	// summary:
	//		Item in a MenuBar like "File" or "Edit", that spawns a submenu when pressed (or hovered)
		
	templateString:
		 '<div class="dijitReset dijitInline dijitMenuItem dijitMenuItemLabel" dojoAttachPoint="focusNode,containerNode" waiRole="menuitem" tabIndex="-1"'
					+'dojoAttachEvent="onmouseenter:_onHover,onmouseleave:_onUnhover,ondijitclick:_onClick"></div>',

	// overriding attributeMap because we don't have icon
	attributeMap: dojo.delegate(dijit._Widget.prototype.attributeMap, {
		label: { node: "containerNode", type: "innerHTML" }
	})
	
});
