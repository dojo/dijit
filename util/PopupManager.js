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
		var win = dijit.util.window.getDocumentWindow(e.target.ownerDocument);
		var iframe = win._frameElement || win.frameElement;
		if(iframe){
			var cood = dojo.coords(iframe, true);
			x += cood.x - dojo.withGlobal(win, dijit.util.getScroll).left;
			y += cood.y - dojo.withGlobal(win, dijit.util.getScroll).top;
		}
		dijit.util.placeOnScreen(widget.domNode, x, y, padding, true);
		
		_open(widget);
	}

	this.openAround = function(/*Widget*/parent, /*Widget*/widget, /*String?*/orient, /*Array?*/padding){
		// summary:
		//		Open the widget relative to parent widget (typically as a drop down to that widget)
		//		TODO: if widget has href attach to onLoaded and reposition

		dijit.util.placeOnScreenAroundElement(widget.domNode, parent, padding, orient);
			
		_open(widget);
	};
	
	function _open(widget){
		// summary:
		//		Utility function to help opening

		// display temporarily, and move into position, then hide again
		with(widget.domNode.style){
			zIndex = beginZIndex + stack.length;
			position = "absolute";
		}

		if(stack.length == 0){
			beforeTopOpen(null, widget);
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

	};

	this.close = function(){
		// summary:
		//		Close top level popup

		var widget = stack.pop();

		dojo.style(widget.domNode, "display", "none");
		if(dojo.isIE && dojo.isIE < 7){
			widget.bgIframe.hide();
		}
		
		if(stack.length == 0){
			afterTopClose(widget);
		}
	};

	///////////////////////////////////////////////////////////////////////
	// Utility functions for making mouse click close popup chain
	var currentTrigger;
	
	function beforeTopOpen(/*Widget*/ button, /*Widget*/menu){
		// summary:
		//	Called when a popup is opened, typically a button opening a menu.
		//	Registers handlers so that clicking somewhere else on the screen will close the popup

		// TODO: should do this at every level of popup?
		dijit.util.FocusManager.save(menu);

		currentTrigger=button;

		// setup handlers to catch screen clicks and close current menu	
		setWindowEvents("connect");
	};

	function afterTopClose(/*Widget*/menu){
		// summary:
		//	called when the top level popup is closed, but before it performs it's actions
		//	removes handlers for mouse movement detection

		// remove handlers to catch screen clicks and close current menu
		// TODO: this doesn't seem to have any effect; try it after scott's new event code.	
		setWindowEvents("disconnect");

		currentTrigger = null;

		dijit.util.FocusManager.restore(menu);
	};

	function onKeyPress(/*Event*/e){
		// summary
		//	Handles keystrokes, passing them up the chain of menus
		if(!e.keyCode){ return; }
		if(stack.length==0){ return; }

		// loop from child menu up ancestor chain, ending at button that spawned the menu
		var m = stack[stack.length-1];
		while(m){
			if(m.processKey(e)){
				e.preventDefault();
				e.stopPropagation();
				break;
			}
			m = m.parentPopup || m.parentMenu;
		}
	};

	function onMouse(/*Event*/e){
		// summary
		// Monitor clicks in the screen.  If popup has requested it than
		// clicking anywhere on the screen will close the current menu hierarchy

		if(stack.length==0){ return; }

		//PORT from dojo.dom.isDescendantOf
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

		// the click didn't fall within the open menu tree so close it
		stack[0].close(true);
	};

	function setWindowEvents(/*String*/ command, /*Window*/targetWindow){
		// summary:
		//		This function connects or disconnects listeners on all the iframes
		//		and the top window, so that whereever the user clicks in the page,
		//		the popup menu will be closed

		if(!targetWindow){ //see comment below
			targetWindow = dijit.util.window.getDocumentWindow(window.top && window.top.document || window.document);
		}

		if(command == 'connect'){
			targetWindow._onmousedownhandler = dojo.connect(targetWindow.document, "onmousedown", null, onMouse);
			targetWindow._onscrollhandler = dojo.connect(targetWindow, "onscroll", null, onMouse);
			targetWindow._onkeyhandler = dojo.connect(targetWindow.document, "onkeypress", null, onKeyPress);
		}else{
			dojo.disconnect(targetWindow._onmousedownhandler);
			targetWindow._onmousedownhandler = null;
			dojo.disconnect(targetWindow._onscrollhandler);
			targetWindow._onscrollhandler = null;
			dojo.disconnect(targetWindow._onkeyhandler);
			targetWindow._onkeyhandler = null;
		}

		for(var i = 0; i < targetWindow.frames.length; i++){
			try{
				//do not remove dijit.util.window.getDocumentWindow, see comment in it
				var win = dijit.util.window.getDocumentWindow(targetWindow.frames[i].document);
				if(win){
					setWindowEvents(command, win);
				}
			}catch(e){ /* squelch error for cross domain iframes */ }
		}
	};
	dojo.addOnUnload(function(){ setWindowEvents("disconnect"); });
}();