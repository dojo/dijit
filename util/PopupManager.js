dojo.provide("dijit.util.PopupManager");

dojo.require("dijit.util.BackgroundIframe");
dojo.require("dijit.util.FocusManager");
dojo.require("dijit.util.place");
dojo.require("dijit.util.window");

dijit.util.PopupManager = new function(){
	// summary:
	//		This class is used to show/hide popups.
	//
	//		The widget must implement a close() callback, which is called when someone
	//		clicks somewhere random on the screen.  It will hide the [chain of] context menus

	var stack = [];
	var beginZIndex=1000;

	this.open = function(/*Event*/ e, /*Widget*/widget, /*Object*/ padding){
		// summary:
		//		Open the widget at mouse position
		//		TODO: if widget has href, attach to onLoaded() and reposition

		var x = e.pageX, y = e.pageY;
		// FIXME: consider skipping everything up to _open
		// if x == y == 0, allowing the popup to appear 
		// wherever it was last time. 
		var win = dijit.util.window.getDocumentWindow(e.target.ownerDocument);
		var iframe = win._frameElement || win.frameElement;
		if(iframe){
			var cood = dojo.coords(iframe, true);
			x += cood.x - dojo.withGlobal(win, dijit.util.getScroll).left;
			y += cood.y - dojo.withGlobal(win, dijit.util.getScroll).top;
		}
		dijit.util.placeOnScreen(widget.domNode, x, y, padding, true);
		
		this._open(widget);
	}

	this.openAround = function(/*Widget*/parent, /*Widget*/widget, /*String?*/orient, /*Array?*/padding){
		// summary:
		//		Open the widget relative to parent widget (typically as a drop down to that widget)
		//		TODO: if widget has href attach to onLoaded and reposition

		// default values for args
		if(!orient){ orient={'BL':'TL', 'TL':'BL'}; }
		if(!padding){ padding=[0,0]; }

		dijit.util.placeOnScreenAroundElement(widget.domNode, parent, padding, orient);
			
		this._open(widget);
	};

	this._open = function(widget){
		// summary:
		//		Utility function to help opening

		// display temporarily, and move into position, then hide again
		with(widget.domNode.style){
			zIndex = beginZIndex + stack.length;
			position = "absolute";
		}

		if(stack.length == 0){
			this._beforeTopOpen(null, widget);
		}

		stack.push(widget);

		// TODO: use effects
		dojo.style(widget.domNode, "display", "");

		if(dojo.isIE && dojo.isIE < 7){
			if(!widget.bgIframe){
				widget.bgIframe = new dijit.util.BackgroundIframe();
				widget.bgIframe.setZIndex(widget.domNode);
			}
			widget.bgIframe.size(widget.domNode);
			widget.bgIframe.show();
		}

		if(widget.onOpen){
			widget.onOpen();
		}
	};

	this.close = function(){
		// summary:
		//		Close popup on the top of the stack (the highest z-index popup)

		var widget = stack.pop();

		dojo.style(widget.domNode, "display", "none");
		if(dojo.isIE && dojo.isIE < 7){
			widget.bgIframe.hide();
		}

		if(widget.onClose){
			widget.onClose();
		}

		if(stack.length == 0){
			this._afterTopClose(widget);
		}
	};

	this.closeAll = function(){
		// summary: close every popup, from top of stack down to the first one
		while(stack.length){
			this.close();
		}
	};

	this.closeTo = function(/*Widget*/ widget){
		// summary: closes every popup above specified widget
		while(stack.length && stack[stack.length-1] != widget){
			this.close();
		}
	};

	///////////////////////////////////////////////////////////////////////
	// Utility functions for making mouse click close popup chain
	var currentTrigger;
	
	this._beforeTopOpen = function(/*Widget*/ button, /*Widget*/menu){
		// summary:
		//	Called when a popup is opened, typically a button opening a menu.
		//	Registers handlers so that clicking somewhere else on the screen will close the popup

		// TODO: should do this at every level of popup?
		dijit.util.FocusManager.save(menu);

		currentTrigger=button;

		// setup handlers to catch screen clicks and close current menu	
		this._connectHandlers();
	};

	this._afterTopClose = function(/*Widget*/menu){
		// summary:
		//	called when the top level popup is closed, but before it performs it's actions
		//	removes handlers for mouse movement detection

		// remove handlers to catch screen clicks and close current menu
		this._disconnectHandlers();

		currentTrigger = null;

		dijit.util.FocusManager.restore(menu);
	};

	this._onKeyPress = function(/*Event*/e){
		// summary
		//	Handles keystrokes, passing them up the chain of menus
		if((!e.keyCode) && (e.charCode != dojo.keys.SPACE)){ return; }
		if(stack.length==0){ return; }

		// loop from child menu up ancestor chain, ending at button that spawned the menu
		var m = stack[stack.length-1];
		while(m){
			if(m.processKey && m.processKey(e)){
				e.preventDefault();
				e.stopPropagation();
				break;
			}
			m = m.parentPopup || m.parentMenu;
		}
	};

	this._onMouse = function(/*Event*/e){
		// summary
		// Monitor clicks in the screen.  If popup has requested it than
		// clicking anywhere on the screen will close the current menu hierarchy

		if(stack.length==0){ return; }

		//PORT #2804. Use isAncestor
		var isDescendantOf = function(/*Node*/node, /*Node*/ancestor){
			//	summary
			//	Returns boolean if node is a descendant of ancestor
			// guaranteeDescendant allows us to be a "true" isDescendantOf function

			while(node){
				if(node === ancestor){ 
					return true; // boolean
				}
				node = node.parentNode;
			}
			return false; // boolean
		}

		// if they clicked on the trigger node (often a button), ignore the click
		if(currentTrigger && isDescendantOf(e.target, currentTrigger)){
			return;
		}

		// if they clicked on the popup itself then ignore it
		if(dojo.some(stack, function(widget){
			return isDescendantOf(e.target, widget.domNode);
		}))
		{
			return;
		}

		// the click didn't fall within the open popups so close all open popups
		this.closeAll();
	};

	// List of everything we need to disconnect
	this._connects = [];

	this._connectHandlers = function(/*Window?*/targetWindow){
		// summary:
		//		Listens on top window and all the iframes so that whereever 
		//		the user clicks in the page, the popup menu will be closed

		if(!targetWindow){ //see comment below
			targetWindow = dijit.util.window.getDocumentWindow(window.top && window.top.document || window.document);
		}

		this._connects.push(dojo.connect(targetWindow.document, "onmousedown", this, "_onMouse"));
		this._connects.push(dojo.connect(targetWindow, "onscroll", this, "_onMouse"));
		this._connects.push(dojo.connect(targetWindow.document, "onkeypress", this, "_onKeyPress"));

		dojo.forEach(targetWindow.frames, function(frame){
			try{
				//do not remove dijit.util.window.getDocumentWindow, see comment in it
				var win = dijit.util.window.getDocumentWindow(frame.document);
				if(win){
					this._connectHandlers(win);
				}
			}catch(e){ /* squelch error for cross domain iframes */ }
		}, this);
	};

	this._disconnectHandlers = function(){
		// summary:
		//		Disconnects handlers for mouse click etc. setup by _connectHandlers()
		dojo.forEach(this._connects, dojo.disconnect);
		this._connects=[];
	};

	dojo.addOnUnload(this, "_disconnectHandlers");
}();