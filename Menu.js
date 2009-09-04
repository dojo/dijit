dojo.provide("dijit.Menu");

dojo.require("dijit._Widget");
dojo.require("dijit._KeyNavContainer");
dojo.require("dijit._Templated");

dojo.declare("dijit._MenuBase",
	[dijit._Widget, dijit._Templated, dijit._KeyNavContainer],
{
	// summary:
	//		Base class for Menu and MenuBar

	// parentMenu: [readonly] Widget
	//		pointer to menu that displayed me
	parentMenu: null,

	// popupDelay: Integer
	//		number of milliseconds before hovering (without clicking) causes the popup to automatically open.
	popupDelay: 500,

	startup: function(){
		if(this._started){ return; }

		dojo.forEach(this.getChildren(), function(child){ child.startup(); });
		this.startupKeyNavChildren();

		this.inherited(arguments);
	},

	onExecute: function(){
		// summary:
		//		Attach point for notification about when a menu item has been executed.
		//		This is an internal mechanism used for Menus to signal to their parent to
		//		close them, because they are about to execute the onClick handler.   In
		//		general developers should not attach to or override this method.
		// tags:
		//		protected
	},

	onCancel: function(/*Boolean*/ closeAll){
		// summary:
		//		Attach point for notification about when the user cancels the current menu
		//		This is an internal mechanism used for Menus to signal to their parent to
		//		close them.  In general developers should not attach to or override this method.
		// tags:
		//		protected
	},

	_moveToPopup: function(/*Event*/ evt){
		// summary:
		//		This handles the right arrow key (left arrow key on RTL systems),
		//		which will either open a submenu, or move to the next item in the
		//		ancestor MenuBar
		// tags:
		//		private

		if(this.focusedChild && this.focusedChild.popup && !this.focusedChild.disabled){
			this.focusedChild._onClick(evt);
		}else{
			var topMenu = this._getTopMenu();
			if(topMenu && topMenu._isMenuBar){
				topMenu.focusNext();
			}
		}
	},

	onItemHover: function(/*MenuItem*/ item){
		// summary:
		//		Called when cursor is over a MenuItem.
		// tags:
		//		protected

		// Don't do anything unless user has "activated" the menu by:
		//		1) clicking it
		//		2) tabbing into it
		//		3) opening it from a parent menu (which automatically focuses it)
		if(this.isActive){
			this.focusChild(item);
	
			if(this.focusedChild.popup && !this.focusedChild.disabled && !this.hover_timer){
				this.hover_timer = setTimeout(dojo.hitch(this, "_openPopup"), this.popupDelay);
			}
		}
	},

	_onChildBlur: function(item){
		// summary:
		//		Called when a child MenuItem becomes inactive because focus
		//		has been removed from the MenuItem *and* it's descendant menus.
		// tags:
		//		private

		item._setSelected(false);

		// Close all popups that are open and descendants of this menu
		dijit.popup.close(item.popup);
		this._stopPopupTimer();
	},

	onItemUnhover: function(/*MenuItem*/ item){
		// summary:
		//		Callback fires when mouse exits a MenuItem
		// tags:
		//		protected
		if(this.isActive){
			this._stopPopupTimer();
		}
	},

	_stopPopupTimer: function(){
		// summary:
		//		Cancels the popup timer because the user has stop hovering
		//		on the MenuItem, etc.
		// tags:
		//		private
		if(this.hover_timer){
			clearTimeout(this.hover_timer);
			this.hover_timer = null;
		}
	},

	_getTopMenu: function(){
		// summary:
		//		Returns the top menu in this chain of Menus
		// tags:
		//		private
		for(var top=this; top.parentMenu; top=top.parentMenu);
		return top;
	},

	onItemClick: function(/*Widget*/ item, /*Event*/ evt){
		// summary:
		//		Handle clicks on an item.
		// tags:
		//		private
		if(item.disabled){ return false; }

		this.focusChild(item);

		if(item.popup){
			if(!this.is_open){
				this._openPopup();
			}
		}else{
			// before calling user defined handler, close hierarchy of menus
			// and restore focus to place it was when menu was opened
			this.onExecute();

			// user defined handler for click
			item.onClick(evt);
		}
	},

	_openPopup: function(){
		// summary:
		//		Open the popup to the side of/underneath the current menu item
		// tags:
		//		protected

		this._stopPopupTimer();
		var from_item = this.focusedChild;
		var popup = from_item.popup;

		if(popup.isShowingNow){ return; }
		popup.parentMenu = this;
		var self = this;
		dijit.popup.open({
			parent: this,
			popup: popup,
			around: from_item.domNode,
			orient: this._orient || (this.isLeftToRight() ? 
									{'TR': 'TL', 'TL': 'TR', 'BR': 'BL', 'BL': 'BR'} : 
									{'TL': 'TR', 'TR': 'TL', 'BL': 'BR', 'BR': 'BL'}),
			onCancel: function(){
				// called when the child menu is canceled
				dijit.popup.close(popup);
				from_item.focus();	// put focus back on my node
				self.currentPopup = null;
			},
			onExecute: dojo.hitch(this, "_onDescendantExecute")
		});

		this.currentPopup = popup;

		if(popup.focus){
			// If user is opening the popup via keyboard (right arrow, or down arrow for MenuBar),
			// if the cursor happens to collide with the popup, it will generate an onmouseover event
			// even though the mouse wasn't moved.   Use a setTimeout() to call popup.focus so that
			// our focus() call overrides the onmouseover event, rather than vice-versa.  (#8742)
			setTimeout(dojo.hitch(popup, "focus"), 0);
		}
	},

	onOpen: function(/*Event*/ e){
		// summary:
		//		Callback when this menu is opened.
		//		This is called by the popup manager as notification that the menu
		//		was opened.
		// tags:
		//		private

		this.isShowingNow = true;
	},

	onClose: function(){
		// summary:
		//		Callback when this menu is closed.
		//		This is called by the popup manager as notification that the menu
		//		was closed.
		// tags:
		//		private

		this._stopPopupTimer();
		this.parentMenu = null;
		this.isShowingNow = false;
		this.currentPopup = null;
		if(this.focusedChild){
			this._onChildBlur(this.focusedChild);
			this.focusedChild = null;
		}
	},

	_onFocus: function(){
		// summary:
		//		Called when this Menu gets focus from:
		//			1) clicking it
		//			2) tabbing into it
		//			3) being opened by a parent menu.
		//		This is not called just from mouse hover.
		// tags:
		//		protected
		this.isActive = true;
		dojo.addClass(this.domNode, "dijitMenuActive");
		dojo.removeClass(this.domNode, "dijitMenuPassive");
		this.inherited(arguments);
	},
	
	_onBlur: function(){
		// summary:
		//		Called when focus is moved away from this Menu and it's submenus.
		// tags:
		//		protected
		this.isActive = false;
		dojo.removeClass(this.domNode, "dijitMenuActive");
		dojo.addClass(this.domNode, "dijitMenuPassive");

		// If user blurs/clicks away from a MenuBar (or always visible Menu), then close all popped up submenus etc.
		this.onClose();

		this.inherited(arguments);
	},

	_onDescendantExecute: function(){
		// summary:
		//		Called when submenu is clicked.  Close hierarchy of menus.
		// tags:
		//		private
		this.onClose();
	}
});

dojo.declare("dijit.Menu",
	dijit._MenuBase,
	{
	// summary
	//		A context menu you can assign to multiple elements

	// TODO: most of the code in here is just for context menu (right-click menu)
	// support.  In retrospect that should have been a separate class (dijit.ContextMenu).
	// Split them for 2.0

	constructor: function(){
		this._bindings = [];
	},

	templateString: dojo.cache("dijit", "templates/Menu.html"),

	// targetNodeIds: [const] String[]
	//		Array of dom node ids of nodes to attach to.
	//		Fill this with nodeIds upon widget creation and it becomes context menu for those nodes.
	targetNodeIds: [],

	// contextMenuForWindow: [const] Boolean
	//		If true, right clicking anywhere on the window will cause this context menu to open.
	//		If false, must specify targetNodeIds.
	contextMenuForWindow: false,

	// leftClickToOpen: [const] Boolean
	//		If true, menu will open on left click instead of right click, similiar to a file menu.
	leftClickToOpen: false,
	
	// refocus: Boolean
	// 		When this menu closes, re-focus the element which had focus before it was opened.
	refocus: true,
		
	// _contextMenuWithMouse: [private] Boolean
	//		Used to record mouse and keyboard events to determine if a context
	//		menu is being opened with the keyboard or the mouse.
	_contextMenuWithMouse: false,

	postCreate: function(){
		if(this.contextMenuForWindow){
			this.bindDomNode(dojo.body());
		}else{
			// TODO: should have _setTargetNodeIds() method to handle initialization and a possible
			// later attr('targetNodeIds', ...) call.   There's also a problem that targetNodeIds[]
			// gets stale after calls to bindDomNode()/unBindDomNode() as it still is just the original list (see #9610)
			dojo.forEach(this.targetNodeIds, this.bindDomNode, this);
		}
		var k = dojo.keys, l = this.isLeftToRight();
		this._openSubMenuKey = l ? k.RIGHT_ARROW : k.LEFT_ARROW;
		this._closeSubMenuKey = l ? k.LEFT_ARROW : k.RIGHT_ARROW;
		this.connectKeyNavHandlers([k.UP_ARROW], [k.DOWN_ARROW]);
	},

	_onKeyPress: function(/*Event*/ evt){
		// summary:
		//		Handle keyboard based menu navigation.
		// tags:
		//		protected

		if(evt.ctrlKey || evt.altKey){ return; }

		switch(evt.charOrCode){
			case this._openSubMenuKey:
				this._moveToPopup(evt);
				dojo.stopEvent(evt);
				break;
			case this._closeSubMenuKey:
				if(this.parentMenu){
					if(this.parentMenu._isMenuBar){
						this.parentMenu.focusPrev();
					}else{
						this.onCancel(false);
					}
				}else{
					dojo.stopEvent(evt);
				}
				break;
		}
	},

	// thanks burstlib!
	_iframeContentWindow: function(/* HTMLIFrameElement */iframe_el){
		// summary:
		//		Returns the window reference of the passed iframe
		// tags:
		//		private
		var win = dijit.getDocumentWindow(this._iframeContentDocument(iframe_el)) ||
			// Moz. TODO: is this available when defaultView isn't?
			this._iframeContentDocument(iframe_el)['__parent__'] ||
			(iframe_el.name && dojo.doc.frames[iframe_el.name]) || null;
		return win;	//	Window
	},

	_iframeContentDocument: function(/* HTMLIFrameElement */iframe_el){
		// summary:
		//		Returns a reference to the document object inside iframe_el
		// tags:
		//		protected
		var doc = iframe_el.contentDocument // W3
			|| (iframe_el.contentWindow && iframe_el.contentWindow.document) // IE
			|| (iframe_el.name && dojo.doc.frames[iframe_el.name] && dojo.doc.frames[iframe_el.name].document)
			|| null;
		return doc;	//	HTMLDocument
	},

	bindDomNode: function(/*String|DomNode*/ node){
		// summary:
		//		Attach menu to given node
		node = dojo.byId(node);

		var cn;	// Connect node

		// Support context menus on iframes.   Rather than binding to the iframe itself we need
		// to bind to the <body> node inside the iframe.
		if(node.tagName.toLowerCase() == "iframe"){
			var iframe = node,
				win = this._iframeContentWindow(iframe);
			cn = dojo.withGlobal(win, dojo.body);
		}else{
			// to capture these events at the top level,
			// attach to document, not body
			cn = (node == dojo.body() ? dojo.doc : node);
		}

		// "binding" is the object to track our connection to the node (ie, the parameter to bindDomNode())
		var binding = {
			node: cn,
			iframe: iframe
		};
		
		// Save info about binding in _bindings[], and make node itself record index(+1) into
		// _bindings[] array.   Prefix w/_dijitMenu to avoid setting an attribute that may
		// start with a number, which fails on FF/safari.
		dojo.attr(node, "_dijitMenu" + this.id, this._bindings.push(binding));

		// Setup the connections to monitor click etc., unless we are connecting to an iframe which hasn't finished
		// loading yet, in which case we need to wait for the onload event first, and then connect
		var doConnects = dojo.hitch(this, function(cn){
			return [
				dojo.connect(cn, (this.leftClickToOpen)?"onclick":"oncontextmenu", this, function(evt){
					this._openMyself(evt, cn, iframe);
				}),
				dojo.connect(cn, "onkeydown", this, "_contextKey"),
				dojo.connect(cn, "onmousedown", this, "_contextMouse")
			];
		});
		binding.connects = cn ? doConnects(cn) : [];

		if(iframe){
			// Setup handler to [re]bind to the iframe when the contents are initially loaded,
			// and every time the contents change.
			// Need to do this b/c we are actually binding to the iframe's <body> node.
			// Note: can't use dojo.connect(), see #9609.
			
			binding.onloadHandler = dojo.hitch(this, function(){
				// want to remove old connections, but IE throws exceptions when trying to
				// access the <body> node because it's already gone, or at least in a state of limbo

				var win = this._iframeContentWindow(iframe);
					cn = dojo.withGlobal(win, dojo.body);
				binding.connects = doConnects(cn);
			});
			if(iframe.addEventListener){
				iframe.addEventListener("load", binding.onloadHandler, false);
			}else{
				iframe.attachEvent("onload", binding.onloadHandler);
			}
		}
	},

	unBindDomNode: function(/*String|DomNode*/ nodeName){
		// summary:
		//		Detach menu from given node

		var node;
		try {
			node = dojo.byId(nodeName);
		}catch(e){
			// On IE the dojo.byId() call will get an exception if the attach point was
			// the <body> node of an <iframe> that has since been reloaded (and thus the
			// <body> node is in a limbo state of destruction.
			return;
		}

		// node["_dijitMenu" + this.id] contains index(+1) into my _bindings[] array
		var attrName = "_dijitMenu" + this.id;
		if(node && dojo.hasAttr(node, attrName)){
			var bid = dojo.attr(node, attrName)-1, b = this._bindings[bid];
			dojo.forEach(b.connects, dojo.disconnect);

			// Remove listener for iframe onload events
			var iframe = b.iframe;
			if(iframe){
				if(iframe.removeEventListener){
					iframe.removeEventListener("load", b.onloadHandler, false);
				}else{
					iframe.detachEvent("onload", b.onloadHandler);
				}
			}

			dojo.removeAttr(node, attrName);
			delete this._bindings[bid];
		}
	},

	_contextKey: function(e){
		// summary:
		//		Code to handle popping up editor using F10 key rather than mouse
		// tags:
		//		private
		this._contextMenuWithMouse = false;
		if(e.keyCode == dojo.keys.F10){
			dojo.stopEvent(e);
			if(e.shiftKey && e.type=="keydown"){
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

	_contextMouse: function(e){
		// summary:
		//		Helper to remember when we opened the context menu with the mouse instead
		//		of with the keyboard
		// tags:
		//		private
		this._contextMenuWithMouse = true;
	},

	_openMyself: function(/*Event*/ e, /*DomNode?*/ node, /*DomNode?*/ iframe){
		// summary:
		//		Internal function for opening myself when the user
		//		does a right-click or something similar.
		// node:
		//		The node that is being clicked
		// iframe:
		//		If an <iframe> is being clicked, iframe points to that iframe and node
		//		points to the iframe's body.
		// tags:
		//		private

		if(this.leftClickToOpen&&e.button>0){
			return;
		}
		dojo.stopEvent(e);

		// Get coordinates.
		// If we are opening the menu with the mouse or on safari open
		// the menu at the mouse cursor
		// (Safari does not have a keyboard command to open the context menu
		// and we don't currently have a reliable way to determine
		// _contextMenuWithMouse on Safari)
		var x,y;
		if(dojo.isSafari || this._contextMenuWithMouse){
			x=e.pageX;
			y=e.pageY;
			
			if(iframe){
				// Event is on <body> node of an <iframe>, convert coordinates to match main document
				var od = e.target.ownerDocument,
					ifc = dojo.position(iframe, true),
					win = this._iframeContentWindow(iframe),
					scroll = dojo.withGlobal(win, "_docScroll", dojo); 

				var cs = dojo.getComputedStyle(iframe),
					tp = dojo._toPixelValue,
					left = (dojo.isIE && dojo.isQuirks ? 0 : tp(iframe, cs.paddingLeft)) + (dojo.isIE && dojo.isQuirks ? tp(iframe, cs.borderLeftWidth) : 0),
					top = (dojo.isIE && dojo.isQuirks ? 0 : tp(iframe, cs.paddingTop)) + (dojo.isIE && dojo.isQuirks ? tp(iframe, cs.borderTopWidth) : 0);

				x += ifc.x + left - scroll.x;
				y += ifc.y + top - scroll.y;
			}
		}else{
			// otherwise open near e.target
			var coords = dojo.position(e.target, true);
			x = coords.x + 10;
			y = coords.y + 10;
		}

		var self=this;
		var savedFocus = dijit.getFocus(this);
		function closeAndRestoreFocus(){
			// user has clicked on a menu or popup
			if(self.refocus){
				dijit.focus(savedFocus);
			}
			dijit.popup.close(self);
		}
		dijit.popup.open({
			popup: this,
			x: x,
			y: y,
			onExecute: closeAndRestoreFocus,
			onCancel: closeAndRestoreFocus,
			orient: this.isLeftToRight() ? 'L' : 'R'
		});
		this.focus();

		this._onBlur = function(){
			this.inherited('_onBlur', arguments);
			// Usually the parent closes the child widget but if this is a context
			// menu then there is no parent
			dijit.popup.close(this);
			// don't try to restore focus; user has clicked another part of the screen
			// and set focus there
		};
	},

	uninitialize: function(){
 		dojo.forEach(this._bindings, function(b){ if(b){ this.unBindDomNode(b.node); } }, this);
 		this.inherited(arguments);
	}
}
);

// Back-compat (TODO: remove in 2.0)
dojo.require("dijit.MenuItem");
dojo.require("dijit.PopupMenuItem");
dojo.require("dijit.CheckedMenuItem");
dojo.require("dijit.MenuSeparator");

