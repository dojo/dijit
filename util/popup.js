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

	this.open = function(/*Object*/ args){
		// summary:
		//		Popup the widget at the specified position
		//
		// args: Object
		//		popup: Widget
		//			widget to display,
		//		around: DomNode
		//			DOM node (typically a button); place popup relative to this node
		//		orient: Object
		//			structure specifying position of object relative to "around" node
		//		onClose: Function
		//			callback when the popup is closed
		//		submenu: Boolean
		//			Is this a submenu off of the existing popup?
		//
		// examples:
		//		1. opening at the mouse position
		//			dijit.util.popup.open({widget: menuWidget, x: evt.pageX, y: evt.pageY});
		//		2. opening the widget as a dropdown
		//			dijit.util.popup.open({widget: menuWidget, around: buttonWidget, onClose: function(){...}  });

		var widget = args.popup,
			orient = args.orient || {'BL':'TL', 'TL':'BL'},
			around = args.around,
			id = (args.around && args.around.id) ? (args.around.id+"_dropdown") : ("popup_"+idGen++);

		if(!args.submenu){
			this.closeAll();
		}
		if(stack.length == 0){
			this._beforeTopOpen(around, widget);
		}

		// make wrapper div to hold widget and possibly hold iframe behind it.
		// we can't attach the iframe as a child of the widget.domNode because
		// widget.domNode might be a <table>, <ul>, etc.
		var wrapper = dojo.doc.createElement("div");
		wrapper.id = id;
		wrapper.className="dijitPopup";
		with(wrapper.style){
			zIndex = beginZIndex + stack.length;
		}
		dojo.body().appendChild(wrapper);

		widget.domNode.style.display="";
		wrapper.appendChild(widget.domNode);

		var iframe = new dijit.util.BackgroundIframe(wrapper);

		// position the wrapper node
		var best = around ?
			dijit.util.placeOnScreenAroundElement(wrapper, around, orient) :
			dijit.util.placeOnScreen(wrapper, args, ['TL','BL','TR','BR']);

		// TODO: use effects to fade in wrapper

		stack.push({wrapper: wrapper, iframe: iframe, widget: widget, onClose: args.onClose});

		if(widget.onOpen){
			widget.onOpen(best);
		}

		return best;
	};

	this.close = function(){
		// summary:
		//		Close popup on the top of the stack (the highest z-index popup)
		var top = stack.pop();
		var wrapper = top.wrapper,
			iframe = top.iframe,
			widget = top.widget,
			onClose = top.onClose;

		// #2685: check if the widget still has a domNode so ContentPane can change its URL without getting an error
		if(!widget||!widget.domNode){ return; }
		dojo.style(widget.domNode, "display", "none");
		dojo.body().appendChild(widget.domNode);
		iframe.destroy();
		dojo._destroyElement(wrapper);

		if(widget.onClose){
			widget.onClose();
		}
		if(onClose){
			onClose();
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

	this._beforeTopOpen = function(/*DomNode*/ button, /*Widget*/menu){
		// summary:
		//	Called when a popup is opened, typically a button opening a menu.
		//	Registers handlers so that clicking somewhere else on the screen will close the popup

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
	};

	this._onEvent = function(/*DomNode*/ node){
		// summary
		// Monitor clicks or focuses on elements on the screen.
		// Clicking or focusing anywhere on the screen will close the current popup hierarchy

		if(stack.length==0){ return; }

		// if they clicked on the trigger node (often a button), ignore the click
		if(currentTrigger && dojo.isDescendant(node, currentTrigger)){
			return;
		}

		// if they clicked on the popup itself then ignore it
		if(dojo.some(stack, function(elem){
			return dojo.isDescendant(node, elem.widget.domNode);
		})){
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

		var self=this;
		this._connects.push(dojo.connect(targetWindow.document, "onmousedown", this, function(evt){self._onEvent(evt.target||evt.srcElement);}));
		//this._connects.push(dojo.connect(targetWindow, "onscroll", this, ???);
		this._focusListener=dojo.subscribe("focus", this, "_onEvent");

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
		if(this._focusListener){
			dojo.unsubscribe(this._focusListener);
			this._focusListener=null;
		}
	};

	// #3531: causes errors, commenting out for now
	//dojo.addOnUnload(this, "_disconnectHandlers");
}();

dijit.util.BackgroundIframe = function(/* HTMLElement */node){
	//	summary:
	//		For IE z-index schenanigans. id attribute is required.
	//
	//	description:
	//		new dijit.util.BackgroundIframe(node)
	//			Makes a background iframe as a child of node, that fills
	//			area (and position) of node

	if(!node.id){ throw new Error("no id"); }

	if((dojo.isIE && dojo.isIE < 7) || (dojo.isFF && dojo.isFF < 3 && dojo.hasClass(dojo.body(), "dijit_a11y"))){
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
	destroy: function(){
		//	summary: destroy the iframe
		if(this.iframe){
			dojo._destroyElement(this.iframe);
			delete this.iframe;
		}
	}
});
