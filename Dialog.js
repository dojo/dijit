dojo.provide("dijit.Dialog");

dojo.require("dojo.dnd.move");
dojo.require("dojo.fx");

dojo.require("dijit.util.place");
dojo.require("dijit.util.sniff");
dojo.require("dijit.util.popup");			// for BackgroundIFrame
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit._Templated");

dojo.declare(
	"dijit.DialogUnderlay",
	[dijit._Widget, dijit._Templated],
	{
		// summary: the thing that grays out the screen behind the dialog
		
		// Template has two divs; outer div is used for fade-in/fade-out, and also to hold background iframe.
		// Inner div has opacity specified in CSS file.
		templateString: "<div class=dijitDialogUnderlayWrapper id='${id}_underlay'><div class=dijitDialogUnderlay dojoAttachPoint='node'></div></div>",
		
		postCreate: function(){
			var b = dojo.body();
			b.appendChild(this.domNode);
			this.bgIframe = new dijit.util.BackgroundIframe(this.domNode);
		},

		layout: function(){
			// summary
			//		Sets the background to the size of the viewport (rather than the size
			//		of the document) since we need to cover the whole browser window, even
			//		if the document is only a few lines long.

			var viewport = dijit.util.getViewport();
			var is = this.node.style,
				os = this.domNode.style;

			os.top = viewport.t + "px";
			os.left = viewport.l + "px";
			is.width = viewport.w + "px";
			is.height = viewport.h + "px";
			
			// process twice since the scroll bar may have been removed
			// by the previous resizing
			var viewport2 = dijit.util.getViewport();
			if(viewport.w != viewport2.w){ is.width = viewport2.w + "px"; }
			if(viewport.h != viewport2.h){ is.height = viewport2.h + "px"; }
		},

		show: function(){
			this.domNode.style.display = "block";
			this.layout();
			if(this.bgIframe.iframe){
				this.bgIframe.iframe.style.display = "block";
			}
		},

		hide: function(){
			this.domNode.style.display = "none";
			this.domNode.style.width = this.domNode.style.height = "1px";
			if(this.bgIframe.iframe){
				this.bgIframe.iframe.style.display = "none";
			}
		},

		uninitialize: function(){
			if(this.bgIframe){
				this.bgIframe.destroy();
			}
		}
	}
);
	
dojo.declare(
	"dijit.Dialog",
	[dijit.layout.ContentPane, dijit._Templated],
	{
		// summary:
		//		Pops up a modal dialog window, blocking access to the screen
		//		and also graying out the screen Dialog is extended from
		//		ContentPane so it supports all the same parameters (href, etc.)

		templatePath: dojo.moduleUrl("dijit", "templates/Dialog.html"),

		// title: String
		//		Title of the dialog
		title: "",

		// closeNode: String
		//	Id of button or other dom node to click to close this dialog
		closeNode: "",

		_duration: 400,
		
		_lastFocusItem:null,
				
		postCreate: function(){
			dijit.Dialog.superclass.postCreate.apply(this, arguments);
			this.domNode.style.display="none";
		},

		startup: function(){
			if(this.closeNode){
				var closeNode = dojo.byId(this.closeNode);
				this.connect(closeNode, "onclick", "hide");
			}
		},

		onLoad: function(){
			// when href is specified we need to reposition
			// the dialog after the data is loaded
			this._position();
			dijit.Dialog.superclass.onLoad.call(this);
		},

		_setup: function(){
			// summary:
			//		stuff we need to do before showing the Dialog for the first
			//		time (but we defer it until right beforehand, for
			//		performance reasons)

			this._modalconnects = [];

			if(this.titleBar){
				this._moveable = new dojo.dnd.Moveable(this.domNode, { handle: this.titleBar });
			}

			this._underlay = new dijit.DialogUnderlay();

			var node = this.domNode;
			this._fadeIn = dojo.fx.combine(
				[dojo.fadeIn({
					node: node,
					duration: this._duration
				 }),
				 dojo.fadeIn({
					node: this._underlay.domNode,
					duration: this._duration,
					onBegin: dojo.hitch(this._underlay, "show")
				 })
				]
			);

			this._fadeOut = dojo.fx.combine(
				[dojo.fadeOut({
					node: node,
					duration: this._duration,
					onEnd: function(){
						node.style.display="none";
					}
				 }),
				 dojo.fadeOut({
					node: this._underlay.domNode,
					duration: this._duration,
					onEnd: dojo.hitch(this._underlay, "hide")
				 })
				]
			);
		},

		uninitialize: function(){
			if(this._underlay){
				this._underlay.destroy();
			}
		},

		_position: function(){
			// summary: position modal dialog in center of screen

			var viewport = dijit.util.getViewport();
			var mb = dojo.marginBox(this.domNode);

			var style = this.domNode.style;
			style.left = (viewport.l + (viewport.w - mb.w)/2) + "px";
			style.top = (viewport.t + (viewport.h - mb.h)/2) + "px";
		},
		
		_findLastFocus: function(/*Event*/ evt){
			// summary:  called from onblur of dialog container to determine the last focusable item 
			this._lastFocused = evt.target;
		},
		
		_cycleFocus: function(/*Event*/ evt){
			// summary: when tabEnd receives focus, advance focus around to titleBar
			
			// on first focus to tabEnd, store the last focused item in dialog
			if(!this._lastFocusItem){
				this._lastFocusItem = this._lastFocused;
			}
			this.titleBar.focus();
		},

		_onKey: function(/*Event*/ evt){
			if(evt.keyCode){
				var node = evt.target;
				// see if we are shift-tabbing from titleBar
				if(node == this.titleBar && evt.shiftKey && evt.keyCode == dojo.keys.TAB){
					if (this._lastFocusItem){
						this._lastFocusItem.focus(); // send focus to last item in dialog if known
					}
					dojo.stopEvent(evt);
				}else{
					// see if the key is for the dialog
					while (node){
						if(node == this.domNode){
							if (evt.keyCode == dojo.keys.ESCAPE){
								this.hide(); 
							}else{
								return; // just let it go
							}
						}
						node = node.parentNode;
					}
					// this key is for the disabled document window
					if (evt.keyCode != dojo.keys.TAB){ // allow tabbing into the dialog for a11y
						dojo.stopEvent(evt);
					// opera won't tab to a div
					}else if (!dojo.isOpera){
						try{
							this.titleBar.focus();
						}catch(e){/*squelch*/}
					}
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

			if(this._fadeOut.status() == "playing"){
				this._fadeOut.stop();
			}

			this._modalconnects.push(dojo.connect(window, "onscroll", this, "layout"));
			this._modalconnects.push(dojo.connect(document.documentElement, "onkeypress", this, "_onKey"));
			
			// IE doesn't bubble onblur events - use ondeactivate instead
			var ev = typeof(document.ondeactivate) == "object" ? "ondeactivate" : "onblur";
			this._modalconnects.push(dojo.connect(this.containerNode, ev, this, "_findLastFocus"));
			
			
			dojo.style(this.domNode, "opacity", 0);
			this.domNode.style.display="block";

			this._loadCheck(); // lazy load trigger

			this._position();

			this._fadeIn.play();
			
			this._savedFocus = dijit.util.focus.save(this);
			
			// set timeout to allow the browser to render dialog
			setTimeout(dojo.hitch(this, function(){
				try{
					this.titleBar.focus();
				}catch(e){/*squelch*/}
			}), 50);
		},

		hide: function(){
			// summary
			//		Hide the dialog

			// if we haven't been initialized yet then we aren't showing and we can just return		
			if(!this._alreadyInitialized){
				return;
			}

			if(this._fadeIn.status() == "playing"){
				this._fadeIn.stop();
			}
			this._fadeOut.play();

			if (this._scrollConnected){
				this._scrollConnected = false;
			}
			dojo.forEach(this._modalconnects, dojo.disconnect);
			this._modalconnects = [];
			
			dijit.util.focus.restore(this._savedFocus);
		},

		layout: function() {
			if(this.domNode.style.display == "block"){
				this._underlay.layout();
				this._position();
			}
		}
	}
);
	
dojo.declare(
	"dijit.layout.TooltipDialog",
	[dijit.layout.ContentPane, dijit._Templated],
	{
		// summary:
		//		Pops up a dialog that appears like a Tooltip

		// closeNode: String
		//	Id of button or other dom node to click to close this dialog
		closeNode: "",
		
		// title: String
		// Description of tooltip dialog (required for a11Y)
		title: "",
		
		_lastFocusItem: null,

		templatePath: dojo.moduleUrl("dijit.layout", "templates/TooltipDialog.html"),

		postCreate: function(){
			dijit.layout.TooltipDialog.superclass.postCreate.apply(this, arguments);
			this.domNode.style.display="none";
		},

		startup: function(){
			if(this.closeNode){
				var closeNode = dojo.byId(this.closeNode);
				this.connect(closeNode, "onclick", "hide");
			}
			this.containerNode.title=this.title;
			this._modalconnects = [];
		},

		show: function(/*DomNode|String*/ anchor){
			// summary: display the dialog underneath specified button/link
			this._savedFocus = dijit.util.focus.save(this);
			var pos = dijit.util.popup.open({popup: this, around: dojo.byId(anchor), orient: {'BL': 'TL', 'TL': 'BL'}});
			this.domNode.className="dijitTooltipDialog dijitTooltip" + (pos.corner=='TL' ? "Below" : "Above");
			
			this._modalconnects.push(dojo.connect(this.containerNode, "onkeypress", this, "_onKey"));
			// IE doesn't bubble onblur events - use ondeactivate instead
			var ev = typeof(document.ondeactivate) == "object" ? "ondeactivate" : "onblur";
			this._modalconnects.push(dojo.connect(this.containerNode, ev, this, "_findLastFocus"));
						
			this.containerNode.focus();
		},
		
		hide: function(){
			// summary: hide the dialog
			dojo.forEach(this._modalconnects, dojo.disconnect);
			this._modalconnects = [];
			
			dijit.util.popup.close();
			dijit.util.focus.restore(this._savedFocus);
		},
		
		_onKey: function(/*Event*/ evt){
		var count=0;
			//summary: keep keyboard focus in dialog; close dialog on escape key
			if (evt.keyCode == dojo.keys.ESCAPE){
				this.hide();
			}else if (evt.target == this.containerNode && evt.shiftKey && evt.keyCode == dojo.keys.TAB){
				if (this._lastFocusItem){
					this._lastFocusItem.focus();
				}
				dojo.stopEvent(evt);
			}
		},
		
		_findLastFocus: function(/*Event*/ evt){
			// summary:  called from onblur of dialog container to determine the last focusable item 
			this._lastFocused = evt.target;
		},

		_cycleFocus: function(/*Event*/ evt){
			// summary: when tabEnd receives focus, advance focus around to containerNode
			
			// on first focus to tabEnd, store the last focused item in dialog
			if(!this._lastFocusItem){
				this._lastFocusItem = this._lastFocused;
			}
			this.containerNode.focus();
		}
	}	
);

