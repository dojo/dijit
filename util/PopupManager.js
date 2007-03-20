dojo.provide("dijit.util.PopupManager");

dojo.require("dojo.lang.array");
dojo.require("dojo.html.selection");
dojo.require("dojo.html.util");
dojo.require("dojo.html.iframe");
dojo.require("dojo.event.*");

dojo.require("dijit.util.FocusManager");

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
		var win = dojo.html.getElementWindow(e.target);
		var iframe = win._frameElement || win.frameElement;
		if(iframe){
			var cood = dojo.html.abs(iframe, true);
			x += cood.x - dojo.withGlobal(win, dojo.html.getScroll).left;
			y += cood.y - dojo.withGlobal(win, dojo.html.getScroll).top;
		}
		dojo.html.placeOnScreen(widget.domNode, x, y, padding, true);
		
		_open(widget);
	}

	this.openAround = function(/*Widget*/parent, /*Widget*/widget, /*String?*/orient, /*Array?*/padding){
		// summary:
		//		Open the widget relative to parent widget (typically as a drop down to that widget)
		//		TODO: if widget has href attach to onLoaded and reposition

		dojo.html.placeOnScreenAroundElement(widget.domNode, parent, padding,
			dojo.html.boxSizing.BORDER_BOX, orient);
			
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
			beforeTopOpen(widget);
		}

		stack.push(widget);

		// TODO: use effects
		widget.domNode.style.display="";

		if(dojo.render.html.ie60){
			if(!widget.bgIframe){
				widget.bgIframe = new dojo.html.BackgroundIframe();
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

		widget.domNode.style.display="none";
		if(dojo.render.html.ie60){
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
		setWindowEvents("connectOnce");
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

	function onKey(/*Event*/e){
		// summary
		//	Handles keystrokes, passing them up the chain of menus
		if (!e.key) { return; }
		if(stack.length==0){ return; }

		// loop from child menu up ancestor chain, ending at button that spawned the menu
		var m = stack[stack.length-1];
		while (m){
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

		// if they clicked on the trigger node (often a button), ignore the click
		if(currentTrigger && dojo.html.isDescendantOf(e.target, currentTrigger)){
			return;
		}

		// if they clicked on the popup itself then ignore it
		if(dojo.lang.some(stack, function(widget){
			return dojo.html.overElement(widget.domNode, e) || dojo.html.isDescendantOf(e.target, widget.domNode);
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

		if(!targetWindow) { //see comment below
			targetWindow = dojo.html.getDocumentWindow(window.top && window.top.document || window.document);
		}

		dojo.event[command](targetWindow.document, 'onmousedown', onMouse);
		dojo.event[command](targetWindow, "onscroll", onMouse);
		dojo.event[command](targetWindow.document, "onkey", onKey);

		for (var i = 0; i < targetWindow.frames.length; i++){
			try{
				//do not remove dojo.html.getDocumentWindow, see comment in it
				var win = dojo.html.getDocumentWindow(targetWindow.frames[i].document);
				if(win){
					setWindowEvents(command, win);
				}
			}catch(e){ /* squelch error for cross domain iframes */ }
		}
	};
	dojo.addOnUnload(function(){ setWindowEvents("disconnect"); });
}();