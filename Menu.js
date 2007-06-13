dojo.provide("dijit.Menu");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.Container");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.util.popup");
dojo.require("dijit.util.scroll");
dojo.require("dijit.util.window");
dojo.require("dijit.util.sniff");

dojo.declare(
	"dijit.PopupMenu",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Container],
{
	templateString:
		'<div class="dijit dijitMenu">' +
			'<table class="dijitReset dijitMenuTable" waiRole="menu">' +
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

	// submenuDelay: Integer
	//	number of milliseconds before hovering (without clicking) causes the submenu to automatically open
	submenuDelay: 500,

	postCreate: function(){
		if(this.contextMenuForWindow){
			this.bindDomNode(dojo.body());
		}else{
			dojo.forEach(this.targetNodeIds, this.bindDomNode, this);
		}

		if(!this.isLeftToRight()){
			this.containerNode.className += " dojoRTL";
		}
	},

	_moveToParentMenu: function(/*Event*/ evt){
		if(this.parentMenu){
			//only process event in the focused menu
			//and its immediate parentPopup to support
			//MenuBar
			if(evt._menuUpKeyProcessed){
				return true; //do not pass to parent menu
			}else{
				if(this._focusedItem){
					this._blurFocusedItem();
				}
				this.parentMenu.closeSubmenu();
				evt._menuUpKeyProcessed = true;
			}
		}
		return false;
	},

	_moveToChildMenu: function(/*Event*/ evt){
		if(this._focusedItem && this._focusedItem.submenuId && !this._focusedItem.disabled){
			return this._activateCurrentItem(evt);
		}
		return false;
	},

	_activateCurrentItem: function(/*Event*/ evt){
		if(this._focusedItem){
			this._focusedItem._onClick();
			if(this.currentSubmenu){
				this.currentSubmenu._focusFirstItem();
			}
			return true; //do not pass to parent menu
		}
		return false;
	},

	processKey: function(/*Event*/ evt){
		// summary
		//	Callback from dijit.util.popup to process key strokes
		//	return true to stop the event being processed by the
		//	parent popupmenu
		if(evt.ctrlKey || evt.altKey){ return false; }

		var key = (evt.charCode == dojo.keys.SPACE ? dojo.keys.SPACE : evt.keyCode);
		switch(key){
 			case dojo.keys.DOWN_ARROW:
				this._focusNeighborItem(1);
				return true; //do not pass to parent menu
			case dojo.keys.UP_ARROW:
				this._focusNeighborItem(-1);
				return true; //do not pass to parent menu
			case dojo.keys.RIGHT_ARROW:
				this._moveToChildMenu(evt);
				return true; //do not pass to parent menu
			case dojo.keys.LEFT_ARROW:
				return this._moveToParentMenu(evt);
			case dojo.keys.ESCAPE:
				if(this.parentMenu){
					return this._moveToParentMenu(evt);
				}else{
					dijit.util.popup.closeAll();
				}
				return true;
			case dojo.keys.SPACE: //fall through
			case dojo.keys.ENTER:
				return this._activateCurrentItem(evt);
			case dojo.keys.TAB:
				dijit.util.popup.closeAll();
				return true; //do not pass to parent menu
		}
		// otherwise, pass to parent menu
		return false;
	},

	_findValidItem: function(dir){
		// summary: find the next/previous item to focus on (depending on dir setting).

		var curItem = this._focusedItem;
		if(curItem){
			curItem = dir>0 ? curItem.getNextSibling() : curItem.getPreviousSibling();
		}

		var children = this.getChildren();
		for(var i=0; i < children.length; ++i){
			if(!curItem){
				curItem = children[(dir>0) ? 0 : (children.length-1)];
			}
			//find next/previous visible menu item, not including separators
			if(curItem._onHover && dojo.style(curItem.domNode, "display") != "none"){
				return curItem;
			}
			curItem = dir>0 ? curItem.getNextSibling() : curItem.getPreviousSibling();
		}
	},

	_focusNeighborItem: function(dir){
		// summary: focus on the next / previous item (depending on dir setting)
		var item = this._findValidItem(dir);
		this._focusItem(item);
	},

	_focusFirstItem: function(){
		// blur focused item to make findValidItem() find the first item in the menu
		if(this._focusedItem){
			this._blurFocusedItem();
		}
		var item = this._findValidItem(1);
		this._focusItem(item);
	},

	_focusItem: function(/*MenuItem*/ item){
		// summary: internal function to focus a given menu item

		if(!item || item==this._focusedItem){
			return;
		}

		if(this._focusedItem){
			this._blurFocusedItem();
		}
		item._focus();
		this._focusedItem = item;
	},

	onItemHover: function(/*MenuItem*/ item){
		this._focusItem(item);

		if(this._focusedItem.submenuId && !this._focusedItem.disabled && !this.hover_timer){
			this.hover_timer = setTimeout(dojo.hitch(this, "_openSubmenu"), this.submenuDelay);
		}
	},

	_blurFocusedItem: function(){
		// summary: internal function to remove focus from the currently focused item
		if(this._focusedItem){
			// Close all submenus that are open and descendents of this menu
			dijit.util.popup.closeTo(this);
			this._focusedItem._blur();
			this._stopSubmenuTimer();
			this._focusedItem = null;
		}
	},

	onItemUnhover: function(/*MenuItem*/ item){
		//this._blurFocusedItem();
	},

	_stopSubmenuTimer: function(){
		if(this.hover_timer){
			clearTimeout(this.hover_timer);
			this.hover_timer = null;
		}
	},

	onItemClick: function(/*Widget*/ item){
		// summary: user defined function to handle clicks on an item
		// summary: internal function for clicks
		if(item.disabled){ return false; }

		if(item.submenuId){
			if(!this.is_open){
				this._openSubmenu();
			}
		}else{
			dijit.util.popup.closeAll();
		}

		// user defined handler for click
		item.onClick();
	},

	closeSubmenu: function(force){
		// summary: close the currently displayed submenu
		if(!this.currentSubmenu){ return; }

		dijit.util.popup.closeTo(this);
		this._focusedItem._focus();	// put focus back on my node

		this.currentSubmenu = null;
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
		node[this.id+'_connect'] = [
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
		//		Internal function for opening myself when the user
		//		does a right-click or something similar
		dojo.stopEvent(e);
		dijit.util.popup.open(e, this);
	},

	onOpen: function(/*Event*/ e){
		// summary
		//		Open menu relative to the mouse
		this._focusFirstItem();
		this.isShowingNow = true;
	},

	onClose: function(){
		// summary: close this menu and any open submenus
		this._stopSubmenuTimer();
		this.parentMenu = null;
		this.isShowingNow = false;
		this.currentSubmenu = null;
	},

	_openSubmenu: function(){
		// summary: open the submenu to the side of the current menu item
		this._stopSubmenuTimer();
		var from_item = this._focusedItem;
		var submenu = dijit.byId(from_item.submenuId);

		if(submenu.isShowingNow){ return; }
		submenu.parentMenu = this;
		dijit.util.popup.openAround(from_item.arrowCell, submenu, {'TR': 'TL', 'TL': 'TR'});

		this.currentSubmenu = submenu;
	}
}
);

dojo.declare(
	"dijit.MenuItem",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Contained],
{
	// summary
	//	A line item in a Menu2

	// Make 3 columns
	//   icon, label, and arrow (BiDi-dependent) indicating sub-menu
	templateString:
		 '<tr class="dijitReset dijitMenuItem" dojoAttachEvent="onmouseover: _onHover; onmouseout: _onUnhover; onclick: _onClick;">'
		+'<td class="dijitReset"><div class="dijitMenuItemIcon" style="${iconStyle}"></div></td>'
		+'<td tabIndex="-1" class="dijitReset dijitMenuItemLabel" dojoAttachPoint="containerNode" waiRole="menuitem"></td>'
		+'<td class="dijitReset" dojoAttachPoint="arrowCell">'
			+'<span class="dijitA11yRightArrow" style="display:none;" dojoAttachPoint="arrow">&#9658;</span>'
		+'</td>'
		+'</tr>',

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

	_onHover: function(){
		// summary: callback when mouse is moved onto menu item
		this.getParent().onItemHover(this);
	},

	_onUnhover: function(){
		// summary: callback when mouse is moved off of menu item
		// if we are unhovering the currently selected item
		// then unselect it
		this.getParent().onItemUnhover(this);
	},

	_onClick: function(focus){
		this.getParent().onItemClick(this);
	},

	onClick: function() {
		// summary
		//	User defined function to handle clicks
	},

	_focus: function(){
		dojo.addClass(this.domNode, 'dijitMenuItemHover');
		try{
			this.containerNode.focus();
		}catch(e){
			// this throws on IE (at least) in some scenarios
		}
		dijit.util.scroll.scrollIntoView(this.domNode);
	},

	_blur: function(){
		dojo.removeClass(this.domNode, 'dijitMenuItemHover');
	},

	setDisabled: function(/*Boolean*/ value){
		// summary: enable or disable this menu item
		this.disabled = value;
		dojo[value ? "addClass" : "removeClass"](this.domNode, 'dijitMenuItemDisabled');
		dijit.util.wai.setAttr(this.containerNode, 'waiState', 'disabled', value ? 'true' : 'false');
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
