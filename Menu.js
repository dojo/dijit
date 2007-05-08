dojo.provide("dijit.Menu");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.Container");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.util.bidi");
dojo.require("dijit.util.PopupManager");
dojo.require("dijit.util.scroll");
dojo.require("dijit.util.window");

dojo.declare(
	"dijit.PopupMenu",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Container],
{
	templateString: 
		'<table class="dojoMenu dojoPopup">' +
			'<tbody dojoAttachPoint="containerNode"></tbody>'+
		'</table>' ,

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
			var doc = dojo.body();
			this.bindDomNode(doc);
		}else if(this.targetNodeIds.length > 0){
			dojo.forEach(this.targetNodeIds, this.bindDomNode, this);
		}

		if(!dijit.util.bidi.isLeftToRight(this.domNode)){
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
		if(this._highlighted_option && this.parentMenu){
			//only process event in the focused menu
			//and its immediate parentPopup to support
			//MenuBar2
			if(evt._menu2UpKeyProcessed){
				return true; //do not pass to parent menu
			}else{
				this._highlighted_option._onUnhover();
				this.parentMenu.closeSubmenu();
				evt._menu2UpKeyProcessed = true;
			}
		}
		return false;
	},

	_moveToChildMenu: function(/*Event*/ evt){
		if(this._highlighted_option && this._highlighted_option.submenuId){
			this._highlighted_option._onClick(true);
			return true; //do not pass to parent menu
		}
		return false;
	},

	_selectCurrentItem: function(/*Event*/ evt){
		if(this._highlighted_option){
			this._highlighted_option._onClick();
			return true;
		}
		return false;
	},

	processKey: function(/*Event*/ evt){
		// summary
		//	callback to process key strokes
		//	return true to stop the event being processed by the
		//	parent popupmenu
		if(evt.ctrlKey || evt.altKey || !evt.keyCode){ return false; }

		switch(evt.keyCode){
 			case dojo.keys.DOWN_ARROW:
				this._highlightOption(1);
				return true; //do not pass to parent menu
			case dojo.keys.UP_ARROW:
				this._highlightOption(-1);
				return true; //do not pass to parent menu
			case dojo.keys.RIGHT_ARROW:
				return this._moveToChildMenu(evt);
			case dojo.keys.LEFT_ARROW:
				return this._moveToParentMenu(evt);
			case dojo.keys.SPACE: //fall through
			case dojo.keys.ENTER:
				if((rval = this._selectCurrentItem(evt))){
					break;
				}
				//fall through
			case dojo.keys.ESCAPE:
				if(this.parentMenu) {
					return this._moveToParentMenu(evt);
				}
				//fall through
			case dojo.keys.TAB:
				this.close(true);
				return true;
		}
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

	_highlightOption: function(dir){
		var item;
		// || !this._highlighted_option.parentNode
		if(!this._highlighted_option){
			item = this._findValidItem(dir);
		}else{
			item = this._findValidItem(dir, this._highlighted_option);
		}
		if(item){
			if(this._highlighted_option){
				this._highlighted_option._onUnhover();
			}
			item.onHover();
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

// some overlap here with _highlightOption
		this.currentSubmenuTrigger.onHover();
		dijit.util.scroll.scrollIntoView(this.currentSubmenuTrigger.domNode);

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
		node[this.widgetId+'connect'] = [
			dojo.connect(cn, "oncontextmenu", this, "open"),
			dojo.connect(cn, "onkeydown", this, "_contextKey")
		];
	},

	unBindDomNode: function(/*String|DomNode*/ nodeName){
		// summary: detach menu from given node
		var node = dojo.byId(nodeName);
		dojo.forEach(node[this.widgetId+'connect'], dojo.disconnect);
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
				window.setTimeout(dojo.hitch(this, function(){ this.open(_e); }), 1);
			}
		}
	},

	_openAsSubmenu: function(/*Widget|DomNode*/parent, /*Object*/explodeSrc, /*String?*/orient){
		// summary:
		//		Open this menu as a child to specified parent, which is a Menu or Button
		// parent:
		//		The parent menu or button
		// explodeSrc:
		//		Typically the MenuItem.domNode that the user clicked
		// orient:
		//		Location to place ourselves relative to explodeSrc
		if(this.isShowingNow){ return; }
		this.parentMenu = parent;

		dijit.util.PopupManager.openAround(explodeSrc, this, orient);
	},
	
	open: function(/*Event*/ e){
		// summary
		//		Open menu relative to the mouse
		dojo.stopEvent(e);
		dijit.util.PopupManager.open(e, this);
		this._highlightOption(1);
	},

	close: function(/*Boolean*/ force){
		// summary: close this menu

		if(this._highlighted_option){
			this._highlighted_option._onUnhover();
		}

		dijit.util.PopupManager.close(this);

		this.parentMenu = null;
		
		// TODO: focus back on parent menu?
	},

	closeAll: function(/*Boolean?*/force){
		// summary: close all popups in the chain
		var parentMenu = this.parentMenu;
		this.close(force);
		if (parentMenu){
			parentMenu.closeAll(force);
		}
	},
	
	_openSubmenu: function(submenu, from_item){
		// summary: open the submenu to the side of the current menu item
		var orient = dijit.util.bidi.isLeftToRight(from_item.arrowCell) ? {'TR': 'TL', 'TL': 'TR'} : {'TL': 'TR', 'TR': 'TL'};
		submenu._openAsSubmenu(this, from_item.arrowCell, orient);

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
	},

	onOpen: function(/*Event*/ e){
		// summary: callback when menu is opened
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
		 '<tr class="dojoMenuItem" dojoAttachEvent="onMouseOver: onHover; onMouseOut: onUnhover; onClick: _onClick;">'
		+'<td><div class="dojoMenuItemIcon" style="${this.iconStyle}"></div></td>'
		+'<td tabIndex="-1" class="dojoMenuItemLabel" dojoAttachPoint="containerNode"></td>'
		+'<td dojoAttachPoint="arrowCell"><div class="dojoRightArrowOuter"><div class="dojoRightArrowInner" style="display:none;" dojoAttachPoint="arrow"></div></div></td>'
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
		}
		if(this.disabled){
			this.setDisabled(true);
		}
		if(this.caption){
			this.containerNode.innerHTML=this.caption;
		}
	},

	onHover: function(){
		// summary: callback when mouse is moved onto menu item

		if(this.is_hovering || this.is_open){ return; }

		var parent = this.getParent();
		parent.closeSubmenu();
		if(parent._highlighted_option){
			parent._highlighted_option._onUnhover();
		}
		parent._highlighted_option = this;

		this._highlightItem();

		try{
			this.containerNode.focus();
		}catch(e){
			// this throws on IE (at least) in some scenarios
		}

		if(this.is_hovering){ this._stopSubmenuTimer(); }
		this.is_hovering = true;
		this._startSubmenuTimer();
	},

	_onUnhover: function(){
		// summary: internal function for unhover
		if(!this.is_open){ this._unhighlightItem(); }
		this.is_hovering = false;
		this.getParent()._highlighted_option = null;
		this._stopSubmenuTimer();
	},

	onUnhover: function(){
		// summary: callback when mouse is moved off of menu item
		// if we are unhovering the currently highlighted option
		// then unhighlight it
		if (this.getParent()._highlighted_option === this) {
			this._onUnhover();
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
			// for some browsers the onMouseOut doesn't get called (?), so call it manually
			this.onUnhover(); //only onUnhover when no submenu is available
			this.getParent().closeAll(true);
		}

		// user defined handler for click
		this.onClick();
		
		if(displayingSubMenu && focus){
			dijit.byId(this.submenuId)._highlightOption(1);
		}
	},

	onClick: function() {
		// summary
		//	User defined function to handle clicks
		//	this default function call the parent
		//	menu's onItemClick
		this.getParent().onItemClick(this);
	},

	_highlightItem: function(){
		dojo.addClass(this.domNode, 'dojoMenuItemHover');
	},

	_unhighlightItem: function(){
		dojo.removeClass(this.domNode, 'dojoMenuItemHover');
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

		// first close any other open submenu
		this.getParent().closeSubmenu();

		var submenu = dijit.byId(this.submenuId);
		if(submenu){
			this.getParent()._openSubmenu(submenu, this);
		}
	},

	_closedSubmenu: function(){
		this.onUnhover();
	},

	setDisabled: function(/*Boolean*/ value){
		// summary: enable or disable this menu item
		this.disabled = value;

		(value ? dojo.addClass : dojo.removeClass)(this.domNode, 'dojoMenuItemDisabled');
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

	templateString: '<tr class="dojoMenuSeparator2"><td colspan=3>'
			+'<div class="dojoMenuSeparator2Top"></div>'
			+'<div class="dojoMenuSeparator2Bottom"></div>'
			+'</td></tr>',

	postCreate: function(){
		dijit._disableSelection(this.domNode);
	}
});