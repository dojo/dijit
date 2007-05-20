dojo.provide("dijit.Menu");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.Container");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.util.PopupManager");
dojo.require("dijit.util.scroll");
dojo.require("dijit.util.window");

dojo.declare(
	"dijit.PopupMenu",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Container],
{
	templateString: 
		'<div class="dijitMenu dijitPopup">' +
			'<table class="dijitReset dijitMenuTable">' +
				'<tbody class="dijitReset" dojoAttachPoint="containerNode"></tbody>'+
			'</table>' +
		'</div>',

	// targetNodeIds: String[]
	//	Array of dom node ids of nodes to attach to.
	//	Fill this with nodeIds upon widget creation and it becomes context menu for those nodes.
	targetNodeIds: [],

	// submenuOverlap: Integer
	//	a submenu usually appears to the right, but slightly overlapping, it's parent menu;
	//	this controls the number of pixels the two menus overlap.
	submenuOverlap: 5,
	
	// contextMenuForWindow: Boolean
	//	if true, right clicking anywhere on the window will cause this context menu to open;
	//	if false, must specify targetNodeIds
	contextMenuForWindow: false,

	// parentMenu: Widget
	// pointer to menu that displayed me
	parentMenu: null,

	isMenu: true,

	// submenuDelay: Integer
	//	number of milliseconds before hovering (without clicking) causes the submenu to automatically open
	submenuDelay: 500,
	
	postCreate: function(){
		if(this.contextMenuForWindow){
			this.bindDomNode(dojo.body());
		}else if(this.targetNodeIds.length > 0){
			dojo.forEach(this.targetNodeIds, this.bindDomNode, this);
		}

		if(this.dir == "rtl"){
			this.containerNode.className += " dojoRTL";
		}
	},

	_getTopMenu: function(){
		var menu = this;
		while(menu.parentMenu){
			menu = menu.parentMenu;
		}
		return menu;
	},

	_moveToParentMenu: function(/*Event*/ evt){
		if(this.parentMenu){
			//only process event in the focused menu
			//and its immediate parentPopup to support
			//MenuBar2
			if(evt._menu2UpKeyProcessed){
				return true; //do not pass to parent menu
			}else{
				if(this._selectedItem){
					this._selectedItem._unselectItem();
				}
				var trigger = this.parentMenu.currentSubmenuTrigger;
				this.parentMenu.closeSubmenu();
				trigger._selectItem();
				dijit.util.scroll.scrollIntoView(trigger.domNode);
				evt._menu2UpKeyProcessed = true;
			}
		}
		return false;
	},

	_moveToChildMenu: function(/*Event*/ evt){
		if(this._selectedItem && this._selectedItem.submenuId){
			return this._activateCurrentItem(evt);
		}
		return false;
	},

	_activateCurrentItem: function(/*Event*/ evt){
		if(this._selectedItem){
			this._selectedItem._onClick();
			if(this.currentSubmenu){
				this.currentSubmenu._selectFirstItem();
			}
			return true; //do not pass to parent menu
		}
		return false;
	},

	processKey: function(/*Event*/ evt){
		// summary
		//	callback to process key strokes
		//	return true to stop the event being processed by the
		//	parent popupmenu
		if(evt.ctrlKey || evt.altKey){ return false; }

		var key = (evt.charCode == dojo.keys.SPACE ? dojo.keys.SPACE : evt.keyCode);
		switch(key){
 			case dojo.keys.DOWN_ARROW:
				this._selectNextItem(1);
				return true; //do not pass to parent menu
			case dojo.keys.UP_ARROW:
				this._selectNextItem(-1);
				return true; //do not pass to parent menu
			case dojo.keys.RIGHT_ARROW:
				return this._moveToChildMenu(evt);
			case dojo.keys.LEFT_ARROW:
				return this._moveToParentMenu(evt);
			case dojo.keys.SPACE: //fall through
			case dojo.keys.ENTER:
				if((rval = this._activateCurrentItem(evt))){
					return true; //do not pass to parent menu
				}
				//fall through
			case dojo.keys.ESCAPE:
				if(this.parentMenu){
					return this._moveToParentMenu(evt);
				}
				//fall through
			case dojo.keys.TAB:
				dijit.util.PopupManager.closeAll();
				return true; //do not pass to parent menu
		}
		// otherwise, pass to parent menu
		return false;
	},

	_findValidItem: function(dir, curItem){
		if(curItem){
			curItem = dir>0 ? curItem.getNextSibling() : curItem.getPreviousSibling();
		}

		var children = this.getChildren();
		for(var i=0; i < children.length; ++i){
			if(!curItem){
				curItem = dir>0 ? children[0] : children[children.length-1];
			}
			//find next/previous visible menu item, not including separators
			if(curItem.onHover && dojo.style(curItem.domNode, "display") != "none"){
				return curItem;
			}
			curItem = dir>0 ? curItem.getNextSibling() : curItem.getPreviousSibling();
		}
	},

	_selectNextItem: function(dir){
		var item;
		// || !this._selectedItem.parentNode
		if(!this._selectedItem){
			item = this._findValidItem(dir);
		}else{
			item = this._findValidItem(dir, this._selectedItem);
		}
		if(item){
			item._selectItem();
			dijit.util.scroll.scrollIntoView(item.domNode);
		}
	},

	_selectFirstItem: function(){
		var item = this._findValidItem(1);
		if(item){
			item._selectItem();
			dijit.util.scroll.scrollIntoView(item.domNode);
		}
	},

	onItemClick: function(/*Widget*/ item){
		// summary: user defined function to handle clicks on an item
	},

	closeSubmenu: function(force){
		// summary: close the currently displayed submenu
		if(!this.currentSubmenu){ return; }

		this.currentSubmenu.close(force);
		this.currentSubmenu = null;

		this.currentSubmenuTrigger.is_open = false;
		this.currentSubmenuTrigger._closedSubmenu(force);

		this.currentSubmenuTrigger = null;
	},

	// thanks burstlib!
	_iframeContentWindow: function(/* HTMLIFrameElement */iframe_el) {
		//	summary
		//	returns the window reference of the passed iframe
		var win = dijit.util.window.getDocumentWindow(dijit.Menu._iframeContentDocument(iframe_el)) ||
			// Moz. TODO: is this available when defaultView isn't?
			dijit.Menu._iframeContentDocument(iframe_el)['__parent__'] ||
			(iframe_el.name && document.frames[iframe_el.name]) || null;
		return win;	//	Window
	},

	_iframeContentDocument: function(/* HTMLIFrameElement */iframe_el){
		//	summary
		//	returns a reference to the document object inside iframe_el
		var doc = iframe_el.contentDocument // W3
			|| (iframe_el.contentWindow && iframe_el.contentWindow.document) // IE
			|| (iframe_el.name && document.frames[iframe_el.name] && document.frames[iframe_el.name].document) 
			|| null;
		return doc;	//	HTMLDocument
	},

	bindDomNode: function(/*String|DomNode*/ node){
		// summary: attach menu to given node
		node = dojo.byId(node);

		//TODO: this is to support context popups in Editor.  Maybe this shouldn't be in dijit.Menu
		var win = dijit.util.window.getDocumentWindow(node.ownerDocument);
		if(node.tagName.toLowerCase()=="iframe"){
			win = this._iframeContentWindow(node);
			node = dojo.withGlobal(win, dojo.body);
		}

		// to capture these events at the top level, 
		// attach to document, not body
		var cn = (node == dojo.body() ? dojo.doc : node);
		node[this.widgetId+'_connect'] = [
			dojo.connect(cn, "oncontextmenu", this, "_openMyself"),
			dojo.connect(cn, "onkeydown", this, "_contextKey")
		];
	},

	unBindDomNode: function(/*String|DomNode*/ nodeName){
		// summary: detach menu from given node
		var node = dojo.byId(nodeName);
		dojo.forEach(node[this.id+'_connect'], dojo.disconnect);
	},

	_contextKey: function(e){
		if (e.keyCode == dojo.keys.F10) {
			dojo.stopEvent(e);
			if (e.shiftKey && e.type=="keydown") {
				// FF: copying the wrong property from e will cause the system 
				// context menu to appear in spite of stopEvent. Don't know 
				// exactly which properties cause this effect.
				var _e = { target: e.target, pageX: e.pageX, pageY: e.pageY };
				_e.preventDefault = _e.stopPropagation = function(){};
				// IE: without the delay, focus work in "open" causes the system 
				// context menu to appear in spite of stopEvent.
				window.setTimeout(dojo.hitch(this, function(){ this._openMyself(_e); }), 1);
			}
		}
	},

	_openMyself: function(/*Event*/ e){
		// summary:
		//		Just an internal function for opening myself when the user
		//		does a right-click or something similar
		dojo.stopEvent(e);
		dijit.util.PopupManager.open(e, this);
	},


	onOpen: function(/*Event*/ e){
		// summary
		//		Open menu relative to the mouse
		this._selectFirstItem();
	},

	onClose: function(/*Boolean*/ force){
		// summary: close this menu and any open submenus

		if(this._selectedItem){
			this._selectedItem._unselectItem();
		}
		this.parentMenu = null;
		
		// TODO: focus back on parent menu?
	},

	_openSubmenu: function(submenu, from_item){
		// summary: open the submenu to the side of the current menu item
		var orient = (this.dir == "ltr") ? {'TR': 'TL', 'TL': 'TR'} : {'TL': 'TR', 'TR': 'TL'};
		
		if(submenu.isShowingNow){ return; }
		submenu.parentMenu = this;
		dijit.util.PopupManager.openAround(from_item.arrowCell, submenu, orient);

		this.currentSubmenu = submenu;
		this.currentSubmenuTrigger = from_item;
		this.currentSubmenuTrigger.is_open = true;
	},

	focus: function(){
		var trigger = this.currentSubmenuTrigger;
		if(trigger){
			try{
				var element = trigger.caption || trigger.domNode;
				element.focus();
			}catch(e){
				//squelch
			}
		}
	}
}
);

dojo.declare(
	"dijit.MenuItem",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Contained],
{
	// summary
	//	A line item in a Menu2

	// Make 3columns
	//   icon, label, and arrow (BiDi-dependent) indicating sub-menu
	templateString:
		 '<tr class="dijitReset dijitMenuItem" dojoAttachEvent="onmouseover: onHover; onmouseout: onUnhover; onclick: _onClick;">'
		+'<td class="dijitReset"><div class="dijitMenuItemIcon" style="${iconStyle}"></div></td>'
		+'<td tabIndex="-1" class="dijitReset dijitMenuItemLabel" dojoAttachPoint="containerNode" waiRole="menuitem"></td>'
		+'<td class="dijitReset" dojoAttachPoint="arrowCell"><div class="dijitRightArrowOuter"><div class="dijitRightArrowInner" style="display:none;" dojoAttachPoint="arrow"></div></div></td>'
		+'</tr>',

	//
	// internal settings
	//

	is_hovering: false,
	hover_timer: null,
	is_open: false,
	topPosition: 0,

	//
	// options
	//

	// iconSrc: String
	//	path to icon to display to the left of the menu text
	iconSrc: '',

	// caption: String
	//	menu text
	caption: '',

	// submenuId: String
	//	widget ID of Menu2 widget to open when this menu item is clicked
	submenuId: '',
	
	// disabled: Boolean
	//  if true, the menu item is disabled
	//  if false, the menu item is enabled
	disabled: false,
	
	postMixInProperties: function(){
		this.iconStyle="";
		if(this.iconSrc){
			this.iconStyle = ((this.iconSrc.toLowerCase().substring(this.iconSrc.length-4) == ".png") &&
				(dojo.isIE && dojo.isIE < 7)) ?
				"filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+this.iconSrc+"', sizingMethod='image')" :
				"background-image: url("+this.iconSrc+")";
		}
		dijit.MenuItem.superclass.postMixInProperties.apply(this, arguments);
	},

	postCreate: function(){
		dijit._disableSelection(this.domNode);
		if(this.submenuId){
			dojo.style(this.arrow, "display", "");
			dijit.util.wai.setAttr(this.containerNode, "waiState", "haspopup", "true");
		}
		this.setDisabled(this.disabled);
		if(this.caption){
			this.containerNode.innerHTML=this.caption;
		}
	},

	_selectItem: function(){
		// summary: internal function to select an item

		var thisMenu = this.getParent();

		// Close all submenus that are open and descendents of this menu
		dijit.util.PopupManager.closeTo(thisMenu);
		
		// Change highlighting to this item
		// TODO: move highlightItem function to Menu to make this easier?
		if(thisMenu._selectedItem){
			thisMenu._selectedItem._unselectItem();
		}
		thisMenu._selectedItem = this;
		this._highlightItem();

		try{
			this.containerNode.focus();
		}catch(e){
			// this throws on IE (at least) in some scenarios
		}

		if(this.is_hovering){ this._stopSubmenuTimer(); }
		this.is_hovering = true;
	},

	onHover: function(){
		// summary: callback when mouse is moved onto menu item
		if(this.disabled){ return false; }
		if(this.is_hovering || this.is_open){ return; }
		this._selectItem();
		if(this.submenuId){
			this._startSubmenuTimer();
		}
	},

	_unselectItem: function(){
		// summary: internal function to remove selection from an item
		if(!this.is_open){
			this._unhighlightItem();
			this.getParent()._selectedItem = null;
		}
		this.is_hovering = false;
		this._stopSubmenuTimer();
	},

	onUnhover: function(){
		// summary: callback when mouse is moved off of menu item
		// if we are unhovering the currently selected item
		// then unselect it
		if(this.getParent()._selectedItem === this){
			this._unselectItem();
		}
	},

	_onClick: function(focus){
		// summary: internal function for clicks
		var displayingSubMenu = false;
		if(this.disabled){ return false; }

		if(this.submenuId){
			if(!this.is_open){
				this._stopSubmenuTimer();
				this._openSubmenu();
			}
			displayingSubMenu = true;
		}else{
			// selection of given element

			// for some browsers the onMouseOut doesn't get called (?), so call it manually
			this.onUnhover(); //only onUnhover when no submenu is available
			dijit.util.PopupManager.closeAll();
		}

		// user defined handler for click
		this.onClick();
	},

	onClick: function() {
		// summary
		//	User defined function to handle clicks
		//	this default function call the parent
		//	menu's onItemClick
		this.getParent().onItemClick(this);
	},

	_highlightItem: function(){
		dojo.addClass(this.domNode, 'dijitMenuItemHover');
	},

	_unhighlightItem: function(){
		dojo.removeClass(this.domNode, 'dijitMenuItemHover');
	},

	_startSubmenuTimer: function(){
		this._stopSubmenuTimer();

		if(this.disabled){ return; }

		var self = this;
		var closure = function(){ return function(){ self._openSubmenu(); }; }();

		this.hover_timer = setTimeout(closure, this.getParent().submenuDelay);
	},

	_stopSubmenuTimer: function(){
		if(this.hover_timer){
			clearTimeout(this.hover_timer);
			this.hover_timer = null;
		}
	},

	_openSubmenu: function(){
		if(this.disabled){ return; }

		var thisMenu = this.getParent();

		// first close any other open submenu
		thisMenu.closeSubmenu();

		var submenu = dijit.byId(this.submenuId);
		if(submenu){
			thisMenu._openSubmenu(submenu, this);
		}
	},

	_closedSubmenu: function(){
		this._unselectItem();
	},

	setDisabled: function(/*Boolean*/ value){
		// summary: enable or disable this menu item
		this.disabled = value;

		if(value){
			dojo.addClass(this.domNode, 'dijitMenuItemDisabled');
			dijit.util.wai.setAttr(this.containerNode, 'waiState', 'disabled', 'true');
		}else{
			dojo.removeClass(this.domNode, 'dijitMenuItemDisabled');
			dijit.util.wai.setAttr(this.containerNode, 'waiState', 'disabled', 'false');
		}
	},

	menuOpen: function(message){
		// summary: callback when menu is opened
		// TODO: I don't see anyone calling this menu item
	}
});

dojo.declare(
	"dijit.MenuSeparator",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Contained],
{
	// summary
	//	A line between two menu items

	templateString: '<tr class="dijitMenuSeparator"><td colspan=3>'
			+'<div class="dijitMenuSeparatorTop"></div>'
			+'<div class="dijitMenuSeparatorBottom"></div>'
			+'</td></tr>',

	postCreate: function(){
		dijit._disableSelection(this.domNode);
	}
});
