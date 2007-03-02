dojo.provide("dijit.Menu");

dojo.require("dojo.lang.*");
dojo.require("dojo.html.*");
dojo.require("dojo.html.selection");
dojo.require("dojo.event.browser");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.Container");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.util.PopupManager");

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
			dojo.lang.forEach(this.targetNodeIds, this.bindDomNode, this);
		}

		if(!dojo.html.isLeftToRight(this.domNode)){
			dojo.html.addClass(this.containerNode, "dojoRTL");
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
				this._highlighted_option.onUnhover();
				this.closeSubmenu();
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

		if(evt.ctrlKey || evt.altKey || !evt.key){ return false; }

		switch(evt.key){
 			case evt.KEY_DOWN_ARROW:
				this._highlightOption(1);
				return true; //do not pass to parent menu
			case evt.KEY_UP_ARROW:
				this._highlightOption(-1);
				return true; //do not pass to parent menu
			case evt.KEY_RIGHT_ARROW:
				return this._moveToChildMenu(evt);
			case evt.KEY_LEFT_ARROW:
				return this._moveToParentMenu(evt);
			case " ": //fall through
			case evt.KEY_ENTER: 
				if((rval = this._selectCurrentItem(evt))){
					break;
				}
				//fall through
			case evt.KEY_ESCAPE:
			case evt.KEY_TAB:
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
			if(curItem.onHover && curItem.domNode.style.display != "none"){
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
			if(this._highlighted_option) {
				this._highlighted_option.onUnhover();
			}
			item.onHover();
			dojo.html.scrollIntoView(item.domNode);
			// navigate into the item table and select the first caption tag
			try {
				var node = dojo.html.getElementsByClass("dojoMenuItemLabel", item.domNode)[0];
				node.focus();
			} catch(e) { }
		}
	},

	onItemClick: function(/*Widget*/ item) {
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

	bindDomNode: function(/*String|DomNode*/ node){
		// summary: attach menu to given node
		node = dojo.byId(node);

		var win = dojo.html.getElementWindow(node);
		if(dojo.html.isTag(node,'iframe') == 'iframe'){
			win = dojo.html.iframeContentWindow(node);
			node = dojo.withGlobal(win, dojo.body);
		}

		if(!this.hitchedOpen){
			this.hitchedOpen = dojo.lang.hitch(this, "open");
		}
		dojo.event.browser.addListener(node, "contextmenu", this.hitchedOpen);
	},

	unBindDomNode: function(/*String|DomNode*/ nodeName){
		// summary: detach menu from given node
		var node = dojo.byId(nodeName);
		dojo.event.browser.removeListener(node, "contextmenu", this.hitchedOpen);
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
		dijit.util.PopupManager.open(e, this);

		dojo.event.browser.stopEvent(e);
	},

	close: function(/*Boolean*/ force){
		// summary: close this menu

		if(this._highlighted_option){
			this._highlighted_option.onUnhover();
		}

		dijit.util.PopupManager.close(this);

		this.parentMenu = null;
		
		// TODO: focus back on parent menu?
	},

	closeAll: function(/*Boolean?*/force){
		// summary: close all popups in the chain
		var parentMenu = this.parentMenu
		this.close(force);
		if (parentMenu){
			parentMenu.closeAll(force);
		}
	},
	
	_openSubmenu: function(submenu, from_item){
		// summary: open the submenu to the side of the current menu item
		var orient = dojo.html.isLeftToRight(from_item.arrow) ? {'TR': 'TL', 'TL': 'TR'} : {'TL': 'TR', 'TR': 'TL'};
		submenu._openAsSubmenu(this, from_item.arrow, orient);

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
		+'<td><div class="dojoMenuArrowWrapper"><div class="dojoMenuItemSubmenu" style="display:none;" dojoAttachPoint="arrow"></div></div></td>'
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
			if((this.iconSrc.toLowerCase().substring(this.iconSrc.length-4) == ".png") && (dojo.render.html.ie55 || dojo.render.html.ie60)){
				this.iconStyle="filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+this.iconSrc+"', sizingMethod='image')";
			}else{
				this.iconStyle="background-image: url("+this.iconSrc+")";
			}
		}
		dijit.MenuItem.superclass.postMixInProperties.apply(this, arguments);
	},

	postCreate: function(){
		dojo.html.disableSelection(this.domNode);
		if(this.submenuId){
			this.arrow.style.display="";
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

		//this is to prevent some annoying behavior when both mouse and keyboard are used
		this.onUnhover();

		if(this.is_hovering){ return; }
		if(this.is_open){ return; }

		if(this.getParent()._highlighted_option){
			this.getParent()._highlighted_option.onUnhover();
		}
		this.getParent().closeSubmenu();
		this.getParent()._highlighted_option = this;

		this._highlightItem();

		if(this.is_hovering){ this._stopSubmenuTimer(); }
		this.is_hovering = true;
		this._startSubmenuTimer();
	},

	onUnhover: function(){
		// summary: callback when mouse is moved off of menu item
		if(!this.is_open){ this._unhighlightItem(); }

		this.is_hovering = false;

		this.getParent()._highlighted_option = null;

		this._stopSubmenuTimer();
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
		dojo.html.addClass(this.domNode, 'dojoMenuItemHover');
	},

	_unhighlightItem: function(){
		dojo.html.removeClass(this.domNode, 'dojoMenuItemHover');
	},

	_startSubmenuTimer: function(){
		this._stopSubmenuTimer();

		if(this.disabled){ return; }

		var self = this;
		var closure = function(){ return function(){ self._openSubmenu(); }; }();

		this.hover_timer = dojo.lang.setTimeout(closure, this.getParent().submenuDelay);
	},

	_stopSubmenuTimer: function(){
		if(this.hover_timer){
			dojo.lang.clearTimeout(this.hover_timer);
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

		if(this.disabled){
			dojo.html.addClass(this.domNode, 'dojoMenuItemDisabled');
		}else{
			dojo.html.removeClass(this.domNode, 'dojoMenuItemDisabled');
		}
	},

	enable: function(){
		// summary: enable this menu item so user can click it
		this.setDisabled(false);
	},

	disable: function(){
		// summary: disable this menu item so user can't click it
		this.setDisabled(true);
	},

	menuOpen: function(message) {
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
		dojo.html.disableSelection(this.domNode);
	}
});