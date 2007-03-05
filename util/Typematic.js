dojo.provide("dijit.util.Typematic");

dojo.require("dojo.lang.func");
dojo.require("dojo.lang.extras");
dojo.require("dojo.event.browser");

dijit.typematic = {
	// summary:
	//              These functions are used to repetitively call a user specified callback 
	//		method when a specific key or mouse click over a specific DOM node is 
	//		held down for a specific amount of time.
	//		Only 1 such event is allowed to occur on the browser page at 1 time.
	//              
	//              but can also be used for a menubar or toolbar.   (For example, in the editor
	//              the user might type Ctrl-T to focus the toolbar, and then when he/she selects
	//              a menu choice, focus is returned to the editor window.)
	//
	//              Note that it doesn't deal with submenus off of an original menu;
	//              From this class's perspective it's all part of one big menu.
	//
	//              The widget must implement a close() callback, which will close dialogs or
	//              a context menu, and for a menubar, it will close the submenus and remove
	//              highlighting classes on the root node.

	_fireEventAndReload: function(){
		this._timer = null;
		this._callback(this._obj,++this._count);
		this._currentTimeout = (this._currentTimeout < 0) ? this._initialDelay : ((this._subsequentDelay > 1) ? this._subsequentDelay : Math.round(this._currentTimeout * this._subsequentDelay));
		this._timer = dojo.lang.setTimeout(this, "_fireEventAndReload", this._currentTimeout);
	},

	trigger: function(/* Object */ _this, /* Function */ callback, /* Object */ obj, /* Number */ subsequentDelay, /* Number */ initialDelay){
		// summary:
		//      Start a timed, repeating callback sequence.
		//	If already started, the function call is ignored.
		//	This method is not normally called by the user but can be
		//	when the normal listener code is insufficient.
		//	_this: pointer to the user's widget space.
		//	callback: function name to call until the sequence is stopped.
		//	obj: any user space object to pass to the callback.
		//	subsequentDelay: if > 1, the number of milliseconds until the 3->n events occur
		//		or else the fractional time multiplier for the next event.
		//	initialDelay: the number of milliseconds until the 2nd event occurs.
		if (obj != this._obj){ 
			this.stop();
			this._initialDelay = initialDelay ? initialDelay : 500;
			this._subsequentDelay = subsequentDelay ? subsequentDelay : 0.90;
			this._obj = obj;
			this._currentTimeout = -1;
			this._count = -1;
			this._callback = dojo.lang.hitch(_this, callback);
			this._fireEventAndReload();
		}
	},

	stop: function(){
		// summary:
		//      Stop an ongoing timed, repeating callback sequence.
		if(this._timer){
			dojo.lang.clearTimeout(this._timer);
			this._timer = null;
		}
		if(this._obj){
			this._callback(this._obj,-1);
			this._obj = null;
		}
	},

	addKeyListener: function(/*Node*/ node, /*Object*/ keyObject, /*Object*/ _this, /*Function*/ callback, /*Object*/ obj, /*Number*/ subsequentDelay, /*Number*/ initialDelay){
		// summary: Start listening for a specific typematic key.
		//	node: the DOM node object to listen on for key events.
		//	keyObject: an object defining the key to listen for.
		//		key: (mandatory) the keyCode (number) or character (string) to listen for.
		//		ctrlKey: desired ctrl key state to initiate the calback sequence:
		//			pressed (true)
		//			released (false)
		//			either (unspecified)
		//		altKey: same as ctrlKey but for the alt key
		//		shiftKey: same as ctrlKey but for the shift key
		//	See the trigger method for other parameters.
		dojo.event.browser.addListener(node, "key", function(evt){
			if(evt.key == keyObject.key
			&& ((typeof keyObject.ctrlKey == "undefined") || keyObject.ctrlKey == evt.ctrlKey)
			&& ((typeof keyObject.altKey == "undefined") || keyObject.altKey == evt.ctrlKey)
			&& ((typeof keyObject.shiftKey == "undefined") || keyObject.shiftKey == evt.ctrlKey)){
				dojo.event.browser.stopEvent(evt);
				dijit.typematic.trigger(_this, callback, obj, subsequentDelay, initialDelay);
			}else if (dijit.typematic._obj == obj){
				dijit.typematic.stop();
			}
		});
		dojo.event.browser.addListener(node, "keyup", function(evt){
			if (dijit.typematic._obj == obj){
				dijit.typematic.stop();
			}
		});
	},

	addMouseListener: function(/*Node*/ node, /*Object*/ _this, /*Function*/ callback, /*Object*/ obj, /*Number*/ subsequentDelay, /*Number*/ initialDelay){
		// summary: Start listening for a typematic mouse click.
		//	node: the DOM node object to listen on for mouse events.
		//	See the trigger method for other parameters.
		dojo.event.browser.addListener(node, "mousedown", function(evt){
			dojo.event.browser.stopEvent(evt);
			dijit.typematic.trigger(_this, callback, obj, subsequentDelay, initialDelay);
		});
		dojo.event.browser.addListener(node, "mouseup", function(evt){
			dojo.event.browser.stopEvent(evt);
			dijit.typematic.stop();
		});
		dojo.event.browser.addListener(node, "mouseout", function(evt){
			dojo.event.browser.stopEvent(evt);
			dijit.typematic.stop();
		});
		dojo.event.browser.addListener(node, "mousemove", function(evt){
			dojo.event.browser.stopEvent(evt);
		});
		dojo.event.browser.addListener(node, "dblclick", function(evt){
			dojo.event.browser.stopEvent(evt);
			if(dojo.render.html.ie){
				dijit.typematic.trigger(_this, callback, obj, subsequentDelay, initialDelay);
				setTimeout("dijit.typematic.stop()",50);
			}
		});
	},

	addListener: function(/*Node*/ mouseNode, /*Node*/ keyNode, /*Object*/ keyObject, /*Object*/ _this, /*Function*/ callback, /*Number*/ subsequentDelay, /*Number*/ initialDelay){
		// summary: Start listening for a specific typematic key and mouseclick.
		//	This is a thin wrapper to addKeyListener and addMouseListener.
		//	mouseNode: the DOM node object to listen on for mouse events.
		//	keyNode: the DOM node object to listen on for key events.
		//	The mouseNode is used as the callback obj parameter.
		//	See the trigger method for other parameters.
		this.addKeyListener(keyNode, keyObject, _this, callback, mouseNode, subsequentDelay, initialDelay);
		this.addMouseListener(mouseNode, _this, callback, mouseNode, subsequentDelay, initialDelay);
	}
};
