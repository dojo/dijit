dojo.provide("dijit.layout.Dialog");

dojo.require("dojo.dnd.move");

dojo.require("dijit.util.place");
dojo.require("dijit.util.sniff");
dojo.require("dijit.util.popup");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.base.TemplatedWidget");

dojo.declare(
	"dijit.layout.Dialog",
	[dijit.layout.ContentPane, dijit.base.TemplatedWidget],
	{
		// summary:
		//		Pops up a modal dialog window, blocking access to the screen
		//		and also graying out the screen Dialog is extended from
		//		ContentPane so it supports all the same parameters (href, etc.)

		templatePath: dojo.moduleUrl("dijit.layout", "templates/Dialog.html"),

		// title: String
		//		Title of the dialog
		title: "",
		
		// closeNode: String
		//	Id of button or other dom node to click to close this dialog
		closeNode: "",

		_duration: 400,

		startup: function(){
			var closeNode = dojo.byId(this.closeNode);
			this.connect(closeNode, "onclick", "hide");
		},

		onLoad: function(){
			// when href is specified we need to reposition
			// the dialog after the data is loaded
			this._center();
			dijit.layout.Dialog.superclass.onLoad.call(this);
		},
		
		_trapTabs: function(/*Event*/ e){
			// summary: callback on focus
			if(e.target == this.tabStartOuter){
				if(this._fromTrap){
					this.tabStart.focus();
					this._fromTrap = false;
				}else{
					this._fromTrap = true;
					this.tabEnd.focus();
				}
			}else if(e.target == this.tabStart){
				if(this._fromTrap){
					this._fromTrap = false;
				}else{
					this._fromTrap = true;
					this.tabEnd.focus();
				}
			}else if(e.target == this.tabEndOuter){
				if(this._fromTrap){
					this.tabEnd.focus();
					this._fromTrap = false;
				}else{
					this._fromTrap = true;
					this.tabStart.focus();
				}
			}else if(e.target == this.tabEnd){
				if(this._fromTrap){
					this._fromTrap = false;
				}else{
					this._fromTrap = true;
					this.tabStart.focus();
				}
			}
		},

		_clearTrap: function(/*Event*/ e){
			// summary: callback on blur
			setTimeout(dojo.hitch(this, function(){
				this._fromTrap = false;
			}), 100);
		},

		_visibleBgOpacity: 0.4,

		_setup: function(){
			// summary:
			//		stuff we need to do before showing the Dialog for the first
			//		time (but we defer it until right beforehand, for
			//		performance reasons)

			var b = dojo.body();
			b.appendChild(this.domNode);

			// make background (which sits behind the dialog but above the normal text)
			this.bg = document.createElement("div");
			this.bg.className = "dijitDialogUnderlay";
			b.appendChild(this.bg);

			this.bgIframe = new dijit.util.BackgroundIframe(this.bg);

			this._modalconnects = [];

			this._moveable = new dojo.dnd.Moveable(this.domNode, this.titleBar);

			var node = this.domNode;
			this._fadeIn = dojo.fadeIn({
				node: node,
				duration: this._duration
			}).combine([
				dojo.animateProperty({
					node: this.bg,
					duration: this._duration,
					onBegin: dojo.hitch(this, "_showBackground"),
					properties: {
						opacity: { start: 0, end: this._visibleBgOpacity }
					}
				})
			]);

			this._fadeOut = dojo.fadeOut({
				node: node,
				duration: this._duration,
				onEnd: function(){
					node.style.display="none";
				}
			}).combine([
				dojo.fadeOut({
					node: this.bg,
					duration: this._duration
				})
			]);
		},

		uninitialize: function(){
			if(this.bgIframe){
				this.bgIframe.remove();
			}
			if(this.bg && this.bg.parentNode){
				this.bg.parentNode.removeChild(this.bg);
			}
		},

		_sizeBackground: function(){
			// summary
			//		Sets the background to the size of the viewport (rather than the size
			//		of the document) since we need to cover the whole browser window, even
			//		if the document is only a few lines long.

			var viewport = dijit.util.getViewport();
			var h = viewport.h;
			var w = viewport.w;
			with(this.bg.style){
				width = w + "px";
				height = h + "px";
			}
			var scroll_offset = dijit.util.getScroll().offset;
			this.bg.style.top = scroll_offset.y + "px";
			this.bg.style.left = scroll_offset.x + "px";

			// process twice since the scroll bar may have been removed
			// by the previous resizing
			viewport = dijit.util.getViewport();
			if(viewport.w != w){ this.bg.style.width = viewport.w + "px"; }
			if(viewport.h != h){ this.bg.style.height = viewport.h + "px"; }
		},

		_showBackground: function(){
			console.debug("_showBackground");
			this.bg.style.display = "block";
			if(this.bgIframe.iframe){
				this.bgIframe.iframe.style.display = "block";
			}
		},

		_center: function(){
			// summary: position modal dialog in center of screen

			var scroll_offset = dijit.util.getScroll().offset;
			var viewport_size = dijit.util.getViewport();
			
			// find the size of the dialog (dialog needs to be showing to get the size)
			var mb = dojo.marginBox(this.domNode);
			var padborder = dojo._getPadBorderExtents(this.domNode);
			
			var x = scroll_offset.x + (viewport_size.w - mb.w)/2;
			var y = scroll_offset.y + (viewport_size.h - mb.h)/2;
			var maxheight = viewport_size.h - padborder.h;

			with(this.domNode.style){
				left = x + "px";
				top = y + "px";
			}
		},

		_onKey: function(/*Event*/ evt){
			if(evt.keyCode){
				// see if the key is for the dialog
				var node = evt.target;
				while (node != null){
					if(node == this.domNode){
						return; // yes, so just let it go
					}
					node = node.parentNode;
				}
				// this key is for the disabled document window
				if (evt.keyCode != evt.KEY_TAB){ // allow tabbing into the dialog for a11y
					dojo.stopEvent(evt);
				// opera won't tab to a div
				}else if (!dojo.isOpera){
					try{
						this.tabStart.focus();
					}catch(e){}
				}
			}
		},

		show: function(){
			// summary: display the dialog

			// first time we show the dialog, there's some initialization stuff to do			
			if(!this._alreadyInitialized){
				this._setup();
				this._alreadyInitialized=true;
			}
				
			this._modalconnects.push(dojo.connect(window, "onscroll", this, "_onScroll"));
			this._modalconnects.push(dojo.connect(document.documentElement, "onkeypress", this, "_onKey"));

			dojo.style(this.domNode, "opacity", 0);
			this.domNode.style.display="block";

			this._center();
			this._sizeBackground();
			this._fromTrap = true;

			this._fadeIn.play();

			// set timeout to allow the browser to render dialog
			setTimeout(dojo.hitch(this, function(){
				try{
					this.tabStart.focus();
				}catch(e){}
			}), 50);

		},

		hide: function(){
			// summary
			//		Hide the dialog

			// if we haven't been initialized yet then we aren't showing and we can just return		
			if(!this._alreadyInitialized){
				return;
			}

			this._fadeOut.play();

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
			// TODO: move dialog the same amount as the scroll, but don't recenter (like CSS position: fixed)
			this._center();
			this.bg.style.top = scroll_offset.y + "px";
			this.bg.style.left = scroll_offset.x + "px";
		},

		layout: function() {
			if(this.domNode.style.visibility == "visible"){
				this._sizeBackground();
				this._center();
			}
		}
	}
);
