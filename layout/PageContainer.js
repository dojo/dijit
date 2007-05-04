dojo.provide("dijit.layout.PageContainer");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.base.Container");
dojo.require("dijit.base.Showable");

dojo.declare(
	"dijit.layout.PageContainer",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Container, dijit.base.Showable],
	// summary
	//	A container that has multiple children, but shows only
	//	one child at a time (like looking at the pages in a book one by one).
	//
	//	Publishes topics <widgetId>-addChild, <widgetId>-removeChild, and <widgetId>-selectChild
	//
	//	Can be base class for container, Wizard, Show, etc.
{
	// doLayout: Boolean
	//  if true, change the size of my currently displayed child to match my size
	doLayout: true,

	templateString: "<div dojoAttachPoint='containerNode'></div>",

	// selectedChild: String
	//   id of the currently shown page
	selectedChild: "",

	layout: function(){
		var children = this.getChildren();
		if(children.length){
			// Setup each page panel
			dojo.forEach(children, this._setupChild, this);

			// Figure out which child to initially display
			var initialChild;
			if(this.selectedChild){
				this.selectChild(this.selectedChild);
			}else{
				for(var i=0; i<children.length; i++){
					if(children[i].selected){
						this.selectChild(children[i]);
						break;
					}
				}
				if(!this.selectedChildWidget){
					this.selectChild(children[0]);
				}
			}
		}
	},

	addChild: function(/*Widget*/ child, /*Integer*/ insertIndex){
		dijit.base.Container.prototype.addChild.apply(this, arguments);
		this._setupChild(child);

		// in case the tab labels have overflowed from one line to two lines
		this.onResized();

		// if this is the first child, then select it
		if(!this.selectedChildWidget){
			this.selectChild(child);
		}
	},

	_setupChild: function(/*Widget*/ page){
		// Summary: Add the given child to this page container
		page.hide();
		
		// since we are setting the width/height of the child elements, they need
		// to be position:relative, or IE has problems (See bug #2033)
		page.domNode.style.position="relative";

		// publish the addChild event for panes added via addChild(), and the original panes too
		dojo.publish(this.widgetId+"-addChild", [page]);
	},

	removeChild: function(/*Widget*/ page){
		
		dijit.base.Container.prototype.removeChild.apply(this, arguments);

		// If we are being destroyed than don't run the code below (to select another page), because we are deleting
		// every page one by one
		if(this._beingDestroyed){ return; }

		// this will notify any tablists to remove a button; do this first because it may affect sizing
		dojo.publish(this.widgetId+"-removeChild", [page]);

		// in case the tab labels now take up one line instead of two lines
		this.onResized();

		if(this.selectedChildWidget === page){
			this.selectedChildWidget = undefined;
			var children = this.getChildren();
			if(children.length){
				this.selectChild(children[0], true);
			}
		}
	},

	selectChild: function(/*Widget*/ page, /*Widget*/ callingWidget){
		// summary
		//	Show the given widget (which must be one of my children)
		
		if(!page){ return; }
		
		// allow indexing by widget id
		if(page && ((typeof page == "string")||(page instanceof String))){
			page = dijit.byId(page);
		}
		this.correspondingPageButton = callingWidget;

		// Deselect old page and select new one
		if(this.selectedChildWidget){
			this._hideChild(this.selectedChildWidget);
		}
		this.selectedChildWidget = page;
		this.selectedChild = page.widgetId;
		this._showChild(page);
		var children = this.getChildren();
		page.isFirstChild = (page == children[0]);
		page.isLastChild = (page == children[children.length-1]);
		dojo.publish(this.widgetId+"-selectChild", [page]);
	},

	forward: function(){
		// Summary: advance to next page
		var index = dojo.indexOf(this.getChildren(), this.selectedChildWidget);
		this.selectChild(this.getChildren()[index+1]);
	},

	back: function(){
		// Summary: go back to previous page
		var index = dojo.indexOf(this.getChildren(), this.selectedChildWidget);
		this.selectChild(this.getChildren()[index-1]);
	},

	onResized: function(){
		// Summary: called when any page is shown, to make it fit the container correctly
		if(this.doLayout && this.selectedChildWidget){
						
			// REVISIT: we need getPixelValue to be public
//			var px = dojo._getPixelizer();
			var _toPixelValue = function(element, value){
				// parseInt or parseFloat? (style values can be floats)
				return parseFloat(value) || 0; 
			}
			var px = _toPixelValue;

			with(this.selectedChildWidget.domNode.style){
				top = px(this.containerNode, dojo.getComputedStyle(this.containerNode, "padding-top"));
				left = px(this.containerNode, dojo.getComputedStyle(this.containerNode, "padding-left"));
			}
			var content = dojo.contentBox(this.containerNode);
			if(this.selectedChildWidget.resize){
				this.selectedChildWidget.resize(content);
			}
		}
	},

	_showChild: function(/*Widget*/ page){
		// size the current page (in case this is the first time it's being shown, or I have been resized)
		if(this.doLayout){
			var content = dojo.contentBox(this.containerNode);
			if(page.resize){ // check it is Sizable
				page.resize(content);
			}
		}

		page.selected=true;
		if(page.show){
			page.show();
		}
	},

	_hideChild: function(/*Widget*/ page){
		page.selected=false;
		if(page.hide){
			page.hide();
		}
	},

	closeChild: function(/*Widget*/ page){
		// summary
		//	callback when user clicks the [X] to remove a page
		//	if onClose() returns true then remove and destroy the childd
		var remove = page.onClose(this, page);
		if(remove){
			this.removeChild(page);
			// makes sure we can clean up executeScripts in ContentPane onUnLoad
			page.destroy();
		}
	},

	destroy: function(){
		this._beingDestroyed = true;
		dijit.layout.PageContainer.superclass.destroy.apply(this, arguments);
	}
});


dojo.declare(
	"dijit.layout.PageController",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Container ],
	{
		// summary
		//	Set of buttons to select a page in a page list.
		//	Monitors the specified PageContainer, and whenever a page is
		//	added, deleted, or selected, updates itself accordingly.

		templateString: "<span wairole='tablist' dojoAttachEvent='onkeypress'></span>",

		// containerId: String
		//	the id of the page container that I point to
		containerId: "",

		// buttonWidget: String
		//	the name of the button widget to create to correspond to each page
		buttonWidget: "dijit.layout.PageButton",

		// class: String
		//	Class name to apply to the top dom node
		"class": "dojoPageController",
		
		postCreate: function(){
			dojo.addClass(this.domNode, this["class"]);  // "class" is a reserved word in JS
			dijit.util.wai.setAttr(this.domNode, "waiRole", "role", "tablist");

			this.pane2button = {};		// mapping from panes to buttons
		},

		layout: function(){
			// at this stage we can wire up to sub-widgets that we control
			// If children have already been added to the page container then create buttons for them
			var container = dijit.byId(this.containerId);
			if(container){
				dojo.forEach(container.getChildren(), this.onAddChild, this);
			}

			dojo.subscribe(this.containerId+"-addChild", this, "onAddChild");
			dojo.subscribe(this.containerId+"-removeChild", this, "onRemoveChild");
			dojo.subscribe(this.containerId+"-selectChild", this, "onSelectChild");
		},

		destroy: function(){
			dojo.unsubscribe(this.containerId+"-addChild", this, "onAddChild");
			dojo.unsubscribe(this.containerId+"-removeChild", this, "onRemoveChild");
			dojo.unsubscribe(this.containerId+"-selectChild", this, "onSelectChild");
			dijit.layout.PageController.superclass.destroy.apply(this, arguments);
		},

		onAddChild: function(/*Widget*/ page){
			// summary
			//   Called whenever a page is added to the container.
			//   Create button corresponding to the page.
			
			// add a node that will be promoted to the button widget
			var refNode = document.createElement("span");
			this.domNode.appendChild(refNode);
			// create an instance of the button widget
			var cls = dojo.getObject(this.buttonWidget);
			var button = new cls({label: page.label, closeButton: page.closable}, refNode);
			this.addChild(button);
			this.pane2button[page]=button;
			page.controlButton = button;	// this value might be overwritten if two tabs point to same container

			var _this = this;
			dojo.connect(button, "onClick", function(){ _this.onButtonClick(page); });
			dojo.connect(button, "onCloseButtonClick", function(){ _this.onCloseButtonClick(page); });
		},

		onRemoveChild: function(/*Widget*/ page){
			// summary
			//   Called whenever a page is removed from the container.
			//   Remove the button corresponding to the page.
			if(this._currentChild == page){ this._currentChild = null; }
			var button = this.pane2button[page];
			if(button){
				button.destroy();
			}
			this.pane2button[page] = null;
		},

		onSelectChild: function(/*Widget*/ page){
			// Summary
			//	Called when a page has been selected in the PageContainer, either by me or by another PageController
			if(!page){ return; }
			
			if(this._currentChild){
				var oldButton=this.pane2button[this._currentChild];
				oldButton.clearSelected();
			}
			
			var newButton=this.pane2button[page];
			newButton.setSelected();
			this._currentChild=page;
		},

		onButtonClick: function(/*Widget*/ page){
			// summary
			//   Called whenever one of my child buttons is pressed in an attempt to select a page
			var container = dijit.byId(this.containerId);	// TODO: do this via topics?
			container.selectChild(page, false, this);
		},

		onCloseButtonClick: function(/*Widget*/ page){
			// summary
			//   Called whenever one of my child buttons [X] is pressed in an attempt to close a page
			var container = dijit.byId(this.containerId);
			container.closeChild(page);
		},

		onkeypress: function(/*Event*/ evt){
			// summary:
			//   Handle keystrokes on the page list, for advancing to next/previous button

			if( (evt.keyCode == evt.KEY_RIGHT_ARROW)||
				(evt.keyCode == evt.KEY_LEFT_ARROW) ){
				var current = 0;
				var next = null;	// the next button to focus on
				var children = this.getChildren();
				// find currently focused button in children array
				var current = dojo.indexOf(children, this.pane2button[this._currentChild]);
				
				// pick next button to focus on
				if(evt.keyCode == evt.KEY_RIGHT_ARROW){
					next = children[ (current+1) % children.length ]; 
				}else{ // is LEFT_ARROW
					next = children[ (current+ (children.length-1)) % children.length ];
				}
				
				dojo.stopEvent(evt);
				next.onClick();
			}
		}
	}
);

dojo.declare(
	"dijit.layout.PageButton",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Contained],
{
	// summary
	//	Internal widget used by PageList.
	//	The button-like or tab-like object you click to select or delete a page

	templateString: "<span class='item'>" +
						"<span dojoAttachEvent='onClick' dojoAttachPoint='titleNode' class='selectButton'>${this.label}</span>" +
						"<span dojoAttachEvent='onClick:onCloseButtonClick' class='closeButton'>[X]</span>" +
					"</span>",

	// label: String
	//  Name to print on the button
	label: "foo",
	
	// closeButton: Boolean
	//	true iff we should also print a close icon to destroy corresponding page
	closeButton: false,

	onClick: function(){
		// summary
		//  Basically this is the attach point PageController listens to, to select the page
		this.focus();
	},

	onCloseButtonMouseOver: function(){
		// summary
		//	The close button changes color a bit when you mouse over	
		dojo.addClass(this.closeButtonNode, "closeHover");
	},

	onCloseButtonMouseOut: function(){
		// summary
		// 	Revert close button to normal color on mouse out
		dojo.removeClass(this.closeButtonNode, "closeHover");
	},

	onCloseButtonClick: function(/*Event*/ evt){
		// summary
		//	Handle clicking the close button for this tab
	},
	
	setSelected: function(){
		// summary
		//	This is run whenever the page corresponding to this button has been selected
		dojo.addClass(this.domNode, "current");
		this.titleNode.setAttribute("tabIndex","0");
	},
	
	clearSelected: function(){
		// summary
		//	This function is run whenever the page corresponding to this button has been deselected (and another page has been shown)
		dojo.removeClass(this.domNode, "current");
		this.titleNode.setAttribute("tabIndex","-1");
	},

	focus: function(){
		// summary
		//	This will focus on the this button (for accessibility you need to do this when the button is selected)
		if(this.titleNode.focus){	// mozilla 1.7 doesn't have focus() func
			this.titleNode.focus();
		}
	}
});

// These arguments can be specified for the children of a PageContainer.
// Since any widget can be specified as a PageContainer child, mix them
// into the base widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit.base.Widget, {
	// label: String
	//		Label or title of this widget.  Used by TabContainer to the name the tab, etc.
	label: "",
	
	// selected: Boolean
	//		Is this child currently selected?
	selected: false,
	
	// closable: Boolean
	//		True if user can close (destroy) this child, such as (for example) clicking the X on the tab.
	closable: false,	// true if user can close this tab pane
	
	onClose: function(){
		// summary: Callback if someone tries to close the child, child will be closed if func returns true
		return true;
	}
});


