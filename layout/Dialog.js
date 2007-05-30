dojo.provide("dijit.layout.Dialog");

dojo.require("dijit.util.place");
dojo.require("dijit.util.BackgroundIframe");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dojo.dnd.move");


dojo.declare(
	"dijit.layout.ModalDialogBase", 
	null,
	{
		// summary
		//	Mixin for widgets implementing a modal dialog

		// focusElement: String
		//	provide a focusable element or element id if you need to
		//	work around FF's tendency to send focus into outer space on hide
		focusElement: "",

		// bgColor: String
		//	color of viewport when displaying a dialog
		bgColor: "black",
		
		// bgOpacity: Number
		//	opacity (0~1) of viewport color (see bgColor attribute)
		bgOpacity: 0.4,

		// followScroll: Boolean
		//	if true, readjusts the dialog (and dialog background) when the user moves the scrollbar
		followScroll: true,

		// closeOnBackgroundClick: Boolean
		//	clicking anywhere on the background will close the dialog
		closeOnBackgroundClick: false,

		trapTabs: function(/*Event*/ e){
			// summary
			//	callback on focus
			if(e.target == this.tabStartOuter) {
				if(this._fromTrap) {
					this.tabStart.focus();
					this._fromTrap = false;
				} else {
					this._fromTrap = true;
					this.tabEnd.focus();
				}
			} else if (e.target == this.tabStart) {
				if(this._fromTrap) {
					this._fromTrap = false;
				} else {
					this._fromTrap = true;
					this.tabEnd.focus();
				}
			} else if(e.target == this.tabEndOuter) {
				if(this._fromTrap) {
					this.tabEnd.focus();
					this._fromTrap = false;
				} else {
					this._fromTrap = true;
					this.tabStart.focus();
				}
			} else if(e.target == this.tabEnd) {
				if(this._fromTrap) {
					this._fromTrap = false;
				} else {
					this._fromTrap = true;
					this.tabStart.focus();
				}
			}
		},

		clearTrap: function(/*Event*/ e) {
			// summary
			//	callback on blur
			var _this = this;
			setTimeout(function() {
				_this._fromTrap = false;
			}, 100);
		},

		_setup: function() {
			// summary
			//	stuff we need to do before showing the Dialog for the first time
			//	(but we defer it until right beforehand, for performance reasons)

			with(this.domNode.style){
				position = "absolute";
				zIndex = 999;
				display = "none";
				overflow = "visible";
			}
			var b = dojo.body();
			b.appendChild(this.domNode);

			// make background (which sits behind the dialog but above the normal text)
			this.bg = document.createElement("div");
			this.bg.className = "dialogUnderlay";
			with(this.bg.style){
				position = "absolute";
				left = top = "0px";
				zIndex = 998;
				display = "none";
			}
			b.appendChild(this.bg);
			this.setBackgroundColor(this.bgColor);

			this.bgIframe = new dijit.util.BackgroundIframe(this.domNode);
            if(this.bgIframe.iframe){
				with(this.bgIframe.iframe.style){
					position = "absolute";
					left = top = "0px";
					zIndex = 90;
					display = "none";
				}
			}

			if(this.closeOnBackgroundClick){
				this.connect(this.bg, "onclick", "onBackgroundClick");
			}
			this._modalconnects = [];
			
			if(this.titleBar){
				this.titleBar.style.display = "block";
				this.moveable = new dojo.dnd.Moveable(this.domNode, this.titleBar);
			}
		},

		uninitialize: function(){
			if(this.bgIframe){
				this.bgIframe.remove();
			}
			if(this.bg && this.bg.parentNode){
				this.bg.parentNode.removeChild(this.bg);
			}
		},

		setBackgroundColor: function(/*String*/ color) {
			// summary
			//	changes background color specified by "bgColor" parameter
			//	usage:
			//		setBackgroundColor("black");
			//		setBackgroundColor(0xff, 0xff, 0xff);
			if(arguments.length >= 3) {
				color = new dojo.Color(arguments[0], arguments[1], arguments[2]);
			} else {
				color = new dojo.Color(color);
			}
			this.bg.style.backgroundColor = color.toString();
			return this.bgColor = color;	// String: the color
		},

		setBackgroundOpacity: function(/*Number*/ op) {
			// summary
			//	changes background opacity set by "bgOpacity" parameter
			if(arguments.length == 0) { op = this.bgOpacity; }
			dojo._setOpacity(this.bg, op);
			try {
				this.bgOpacity = dojo._getOpacity(this.bg);
			} catch (e) {
				this.bgOpacity = op;
			}
			return this.bgOpacity;	// Number: the opacity
		},

		_sizeBackground: function() {
			if(this.bgOpacity > 0) {
				
				var viewport = dijit.util.getViewport();
				var h = viewport.height;
				var w = viewport.width;
				with(this.bg.style){
					width = w + "px";
					height = h + "px";
				}
				var scroll_offset = dijit.util.getScroll().offset;
				this.bg.style.top = scroll_offset.y + "px";
				this.bg.style.left = scroll_offset.x + "px";
				// process twice since the scroll bar may have been removed
				// by the previous resizing
				var viewport = dijit.util.getViewport();
				if (viewport.width != w) { this.bg.style.width = viewport.width + "px"; }
				if (viewport.height != h) { this.bg.style.height = viewport.height + "px"; }
			}
			this.bgIframe.size(this.bg);
		},

		_showBackground: function() {
			if(this.bgOpacity > 0) {
				this.bg.style.display = "block";
			}
			if(this.bgIframe.iframe){
				this.bgIframe.iframe.style.display = "block";
			}
		},

		placeModalDialog: function() {
			// summary: position modal dialog in center of screen

			var scroll_offset = dijit.util.getScroll().offset;
			var viewport_size = dijit.util.getViewport();
			
			// find the size of the dialog (dialog needs to be showing to get the size)
			var mb;
			var padborder;
			if(this.isShowing()){
				mb = dojo.marginBox(this.domNode);
				padborder = dojo._getPadBorderExtents(this.domNode);
			}else{
				dojo.style(this.domNode, "visibility", 'hidden');
				dojo.style(this.domNode, 'display', 'block');;
				mb = dojo.marginBox(this.domNode);
				padborder = dojo._getPadBorderExtents(this.domNode);
				dojo.style(this.domNode, 'display', 'none');;
				dojo.style(this.domNode, "visibility", 'visible');
			}
			
			var x = scroll_offset.x + (viewport_size.w - mb.w)/2;
			var y = scroll_offset.y + (viewport_size.h - mb.h)/2;
			var maxheight = viewport_size.h - padborder.h;

			// dialogs can be too long or too short, try to adjust accordingly 
			// we need to explicitly set the height on the containerNode so that 
			// the overflow policy works correctly for the dialog - #757 and 2088 
			if(viewport_size.h < mb.h){
				this.containerNode.style.height = maxheight + "px";
			} else if(this.containerNode.scrollHeight){
				// if we've loaded dynamic content (e.g. through contentpane href)
				// we might need to lengthen the dialog to adjust for the new content
				var height = this.containerNode.scrollHeight + padborder.h;
				if(height > mb.h && height < maxheight){
					dojo.marginBox(this.domNode, { h: height});						
				}					
			}
			with(this.domNode.style){
				left = x + "px";
				top = y + "px";
			}
		},

		_onKey: function(/*Event*/ evt){
			if (evt.keyCode){
				// see if the key is for the dialog
				var node = evt.target;
				while (node != null){
					if (node == this.domNode){
						return; // yes, so just let it go
					}
					node = node.parentNode;
				}
				// this key is for the disabled document window
				if (evt.keyCode != evt.KEY_TAB){ // allow tabbing into the dialog for a11y
					dojo.stopEvent(evt);
				// opera won't tab to a div
				}else if (!dojo.isOpera){
					try {
						this.tabStart.focus(); 
					} catch(e){}
				}
			}
		},

		showModalDialog: function() {
			// summary
			//	call this function in show() of subclass before calling superclass.show()

			// first time we show the dialog, there's some initialization stuff to do			
			if(!this._alreadyInitialized){
				this._setup();
				this._alreadyInitialized=true;
			}
				
			if (this.followScroll && !this._scrollConnected){
				this._scrollConnected = true;
				this._modalconnects.push(dojo.connect(window, "onscroll", this._onScroll));
			}
			this._modalconnects.push(dojo.connect(document.documentElement, "onkeypress", this._onKey));

			this.placeModalDialog();
			this.setBackgroundOpacity();
			this._sizeBackground();
			this._showBackground();
			this._fromTrap = true; 

			// set timeout to allow the browser to render dialog 
			setTimeout(dojo.hitch(this, function(){
				try{
					this.tabStart.focus();
				}catch(e){}
			}), 50);

		},

		hideModalDialog: function(){
			// summary
			//	call this function in hide() of subclass

			// if we haven't been initialized yet then we aren't showing and we can just return		
			if(!this._alreadyInitialized){
				return;
			}

			// workaround for FF focus going into outer space
			if (this.focusElement) {
				dojo.byId(this.focusElement).focus(); 
				dojo.byId(this.focusElement).blur();
			}

			this.bg.style.display = "none";
			this.bg.style.width = this.bg.style.height = "1px";
            if(this.bgIframe.iframe){
				this.bgIframe.iframe.style.display = "none";
			}

			if (this._scrollConnected){
				this._scrollConnected = false;
			}
			dojo.forEach(this._modalconnects, dojo.disconnect);
			this._modalconnects = [];
			
		},

		_onScroll: function(){
			var scroll_offset = dijit.util.getScroll().offset;
			this.bg.style.top = scroll_offset.y + "px";
			this.bg.style.left = scroll_offset.x + "px";
			this.placeModalDialog();
		},

		checkSize: function() {
			if(this.isShowing()){
				this._sizeBackground();
				this.placeModalDialog();
				this.onResized();
			}
		},
		
		onBackgroundClick: function(){
			// summary
			//		Callback on background click, if closeOnBackgroundClick==true.
			if(this.lifetime - this.timeRemaining >= this.blockDuration){ return; }
			this.hide();
		}
	});

dojo.declare(
	"dijit.layout.Dialog",
	[dijit.layout.ContentPane, dijit.base.TemplatedWidget, dijit.layout.ModalDialogBase],
	{
		// summary
		//	Pops up a modal dialog window, blocking access to the screen and also graying out the screen
		//	Dialog is extended from ContentPane so it supports all the same parameters (href, etc.)

		templatePath: dojo.moduleUrl("dijit.layout", "templates/Dialog.html"),

		// label: String
		//		Title of the dialog
		label: "",
		
		// blockDuration: Integer
		//	number of seconds for which the user cannot dismiss the dialog
		blockDuration: 0,
		
		// lifetime: Integer
		//	if set, this controls the number of seconds the dialog will be displayed before automatically disappearing
		lifetime: 0,

		// closeNode: String
		//	Id of button or other dom node to click to close this dialog
		closeNode: "",
		
		// closeButton: Boolean
		//	Whether or not to display a standard button to close this dialog
		closeButton: true,

		postCreate: function(){
			// hide the dialog so it doesnt show up, and also to defer processing of dialog contents
			// (or href attribute) until the dialog is shown)
			this.domNode.style.display="none";
			dijit.layout.Dialog.superclass.postCreate.apply(this, arguments);
		},

		show: function() {
		    // deal with the default close button
			this.closeButtonNode.style.display = this.closeButton ? "inline" : "none";
			if(this.closeButton){
				this.connect(this.closeButtonNode, "onclick", "hide");
			}
			// handle the custom close node if any
			if(this.closeNode){
				this.setCloseControl(this.closeNode);
			}
			if(this.lifetime){
				this.timeRemaining = this.lifetime;
				if(this.timerNode){
					this.timerNode.innerHTML = Math.ceil(this.timeRemaining/1000);
				}
				if(this.blockDuration && this.closeNode){
					if(this.lifetime > this.blockDuration){
						this.closeNode.style.visibility = "hidden";
					}else{
						this.closeNode.style.display = "none";
					}
				}
				if (this.timer) {
					clearInterval(this.timer);
				}
				this.timer = setInterval(dojo.lang.hitch(this, "_onTick"), 100);
			}

			this.showModalDialog();
			dijit.layout.Dialog.superclass.show.call(this);
		},

		onLoad: function(){
			// when href is specified we need to reposition
			// the dialog after the data is loaded
			this.placeModalDialog();
			dijit.layout.Dialog.superclass.onLoad.call(this);
		},
		
		hide: function(){
			this.hideModalDialog();
			dijit.layout.Dialog.superclass.hide.call(this);

			if(this.timer){
				clearInterval(this.timer);
			}
		},
		
		setTimerNode: function(node){
			// summary
			//	specify into which node to write the remaining # of seconds
			// TODO: make this a parameter too
			this.timerNode = node;
		},

		setCloseControl: function(/*String|DomNode*/ node) {
			// summary
			//	Specify which node is the close button for this dialog.
			this.closeNode = dojo.byId(node);
			this.connect(this.closeNode, "onclick", "hide");
		},

		setShowControl: function(/*String|DomNode*/ node) {
			// summary
			//	when specified node is clicked, show this dialog
			// TODO: make this a parameter too
			node = dojo.byId(node);
			this.connect(node, "onclick", "show");
		},

		_onTick: function(){
			// summary
			//	callback every second that the timer clicks
			if(this.timer){
				this.timeRemaining -= 100;
				if(this.lifetime - this.timeRemaining >= this.blockDuration){
					// TODO: this block of code is executing over and over again, rather than just once
					if(this.closeNode){
						this.closeNode.style.visibility = "visible";
					}
				}
				if(!this.timeRemaining){
					clearInterval(this.timer);
					this.hide();
				}else if(this.timerNode){
					this.timerNode.innerHTML = Math.ceil(this.timeRemaining/1000);
				}
			}
		}
	}
);
