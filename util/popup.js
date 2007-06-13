dojo.provide("dijit.util.popup");

dojo.require("dijit.util.focus");
dojo.require("dijit.util.place");
dojo.require("dijit.util.window");

dijit.util.popup = new function(){
	// summary:
	//		This class is used to show/hide popups.
	//
	//		The widget must implement a close() callback, which is called when someone
	//		clicks somewhere random on the screen.  It will hide the [chain of] context menus

	var stack = [];
	var beginZIndex=1000;
	var idGen = 1;

	this.open = function(/*Event*/ e, /*Widget*/widget, /*Array?*/ padding){
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
			x += cood.x - dojo.withGlobal(win, dijit.util.getScroll).x;
			y += cood.y - dojo.withGlobal(win, dijit.util.getScroll).y;
		}

		return this._open(widget, padding, {x: x, y: y, id: "dropdown_"+idGen++});
	};

	this.openAround = function(/*Widget*/parent, /*Widget*/widget, /*String?*/orient, /*Array?*/padding){
		// summary:
		//		Open the widget relative to parent widget (typically as a drop down to that widget)
		//		TODO: if widget has href attach to onLoaded and reposition

		return this._open(widget, padding, { around: parent, orient: orient || {'BL':'TL', 'TL':'BL'}, id: parent.id+"_dropdown" });
	};

	this._open = function(/*Widget*/ widget, /*Array*/ padding, /*Object*/ args){
		// summary: utility function to help opening

		if(!padding){ padding=[0,0]; }

		if(stack.length == 0){
			this._beforeTopOpen(null, widget);
		}

		// make wrapper div to hold widget and possibly hold iframe behind it.
		// we can't attach the iframe as a child of the widget.domNode because
		// widget.domNode might be a <table>, <ul>, etc.
		var wrapper = dojo.doc.createElement("div");
		wrapper.id = args.id;
		wrapper.className="dijitPopup";
		with(wrapper.style){
			zIndex = beginZIndex + stack.length;
		}
		dojo.body().appendChild(wrapper);

		widget.domNode.style.display="";
		wrapper.appendChild(widget.domNode);

		var iframe = new dijit.util.BackgroundIframe(wrapper);

		// position the wrapper node
		var best = args.around ?
			dijit.util.placeOnScreenAroundElement(wrapper, args.around, padding, args.orient) :
			dijit.util.placeOnScreen(wrapper, args.x, args.y, padding, true);

		// TODO: use effects to fade in wrapper

		stack.push({wrapper: wrapper, iframe: iframe, widget: widget});

		if(widget.onOpen){
			widget.onOpen();
		}

		return best;
	};

	this.close = function(){
		// summary:
		//		Close popup on the top of the stack (the highest z-index popup)
		var top = stack.pop();
		var wrapper = top.wrapper,
			iframe = top.iframe,
			widget = top.widget;
		// #2685: check if the widget still has a domNode so ContentPane can change its URL without getting an error
		if(!widget||!widget.domNode){ return; }
		dojo.style(widget.domNode, "display", "none");
		iframe.remove();
		wrapper.parentNode.removeChild(wrapper);

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
		while(stack.length && stack[stack.length-1].widget != widget){
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
		dijit.util.focus.save(menu);

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

		dijit.util.focus.restore(menu);
	};

	this._onKeyPress = function(/*Event*/e){
		// summary
		//	Handles keystrokes, passing them up the chain of menus
		if((!e.keyCode) && (e.charCode != dojo.keys.SPACE)){ return; }
		if(stack.length==0){ return; }

		// loop from child menu up ancestor chain, ending at button that spawned the menu
		var m = stack[stack.length-1].widget;
		while(m){
			if(m.processKey && m.processKey(e)){
				e.preventDefault();
				e.stopPropagation();
				break;
			}
			// TODO: shouldn't this be going up the stack rather than using internal vars?
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
		if(dojo.some(stack, function(elem){
			return isDescendantOf(e.target, elem.widget.domNode);
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
		//this._connects.push(dojo.connect(targetWindow, "onscroll", this, "_onMouse"));
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

dijit.util.BackgroundIframe = function(/* HTMLElement */node){
	//	summary:
	//		For IE z-index schenanigans
	//		new dijit.util.BackgroundIframe(node)
	//			Makes a background iframe as a child of node, that fills
	//			area (and position) of node
	if(  (dojo.isIE && dojo.isIE < 7) || (dojo.isFF && dojo.isFF < 3 && dojo.hasClass(dojo.body(), "dijit_a11y")) ){
		var iframe;
		if(dojo.isIE){
			var html="<iframe src='javascript:\"\"'"
				+ " style='position: absolute; left: 0px; top: 0px;"
				+ " width: expression(document.getElementById(\"" + node.id + "\").offsetWidth);"
				+ " height: expression(document.getElementById(\"" + node.id + "\").offsetHeight); "
				+ "z-index: -1; filter:Alpha(Opacity=\"0\");'>";
			iframe = dojo.doc.createElement(html);
		}else{
		 	iframe = dojo.doc.createElement("iframe");
			iframe.src = 'javascript:""';
			iframe.className = "dijitBackgroundIframe";
		}
		iframe.tabIndex = -1; // Magic to prevent iframe from getting focus on tab keypress - as style didnt work.
		node.appendChild(iframe);
		this.iframe = iframe;
	}
};

dojo.extend(dijit.util.BackgroundIframe, {
	remove: function(){
		//	summary: remove the iframe
		if(this.iframe){
			this.iframe.parentNode.removeChild(this.iframe); // PORT: leak?
			delete this.iframe;
			this.iframe=null;
		}
	}
});
