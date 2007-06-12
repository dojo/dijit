dojo.provide("dijit.layout.PageContainer");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.base.Layout");
dojo.require("dijit.form.Button");

dojo.declare(
	"dijit.layout.PageContainer",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Layout],
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

	startup: function(){
		var children = this.getChildren();

		// Setup each page panel
		dojo.forEach(children, this._setupChild, this);

		// Figure out which child to initially display
		var idx = dojo.indexOf(children, function(child){ return child.selected; });
		if(idx == -1){ idx=0; }
		this.selectedChildWidget = children[idx];
		this.selectedChildWidget.show();
		
		// Now publish information about myself so any PageControllers can initialize..
		dojo.publish(this.id+"-startup", [{children: children, selected: this.selectedChildWidget}]);

		dijit.base.Layout.prototype.startup.apply(this, arguments);
	},

	addChild: function(/*Widget*/ child, /*Integer*/ insertIndex){
		dijit.base.Container.prototype.addChild.apply(this, arguments);
		this._setupChild(child);

		// in case the tab titles have overflowed from one line to two lines
		this.layout();

		// if this is the first child, then select it
		if(!this.selectedChildWidget){
			this.selectChild(child);
		}
		dojo.publish(this.id+"-addChild", [child]);
	},

	_setupChild: function(/*Widget*/ page){
		// Summary: prepare the given child
		page.hide();
		
		// since we are setting the width/height of the child elements, they need
		// to be position:relative, or IE has problems (See bug #2033)
		page.domNode.style.position="relative";
	},

	removeChild: function(/*Widget*/ page){
		
		dijit.base.Container.prototype.removeChild.apply(this, arguments);

		// If we are being destroyed than don't run the code below (to select another page), because we are deleting
		// every page one by one
		if(this._beingDestroyed){ return; }

		// this will notify any tablists to remove a button; do this first because it may affect sizing
		dojo.publish(this.id+"-removeChild", [page]);

		// in case the tab titles now take up one line instead of two lines
		this.layout();

		if(this.selectedChildWidget === page){
			this.selectedChildWidget = undefined;
			var children = this.getChildren();
			if(children.length){
				this.selectChild(children[0]);
			}
		}
	},

	selectChild: function(/*Widget*/ page){
		// summary
		//	Show the given widget (which must be one of my children)
		
		if(!page){ return; }
		
		// allow indexing by widget id
		if(page && ((typeof page == "string")||(page instanceof String))){
			page = dijit.byId(page);
		}

		// Deselect old page and select new one
		if(this.selectedChildWidget){
			this._hideChild(this.selectedChildWidget);
		}
		this.selectedChildWidget = page;
		this.selectedChild = page.id;
		this._showChild(page);
		dojo.publish(this.id+"-selectChild", [page]);
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

	layout: function(){
		// Summary: called when any page is shown, to make it fit the container correctly
		if(this.doLayout && this.selectedChildWidget && this.selectedChildWidget.resize){
			this.selectedChildWidget.resize(this._contentBox);
		}
	},

	_showChild: function(/*Widget*/ page){
		// size the current page (in case this is the first time it's being shown, or I have been resized)
		if(this.doLayout && page.resize){
			page.resize(this._containerContentBox || this._contentBox);
		}

		page.selected=true;
		if(page.show){
			page.show();
		}
		var children = this.getChildren();
		page.isFirstChild = (page == children[0]);
		page.isLastChild = (page == children[children.length-1]);
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

		templateString: "<span wairole='tablist' dojoAttachEvent='onkeypress' class='dijitPageController'></span>",

		// containerId: String
		//	the id of the page container that I point to
		containerId: "",

		// buttonWidget: String
		//	the name of the button widget to create to correspond to each page
		buttonWidget: "dijit.layout._PageButton",

		postCreate: function(){
			dijit.util.wai.setAttr(this.domNode, "waiRole", "role", "tablist");

			this.pane2button = {};		// mapping from panes to buttons
			this._subscriptions=[
				dojo.subscribe(this.containerId+"-startup", this, "onStartup"),
				dojo.subscribe(this.containerId+"-addChild", this, "onAddChild"),
				dojo.subscribe(this.containerId+"-removeChild", this, "onRemoveChild"),
				dojo.subscribe(this.containerId+"-selectChild", this, "onSelectChild")
			];
		},

		onStartup: function(/*Object*/ info){
			// summary: called after PageContainer has finished initializing
			dojo.forEach(info.children, this.onAddChild, this);
			this.onSelectChild(info.selected);
		},

		destroy: function(){
			dojo.forEach(this._subscriptions, dojo.unsubscribe);
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
			var button = new cls({caption: page.title, closeButton: page.closable}, refNode);
			this.addChild(button);
			this.pane2button[page]=button;
			page.controlButton = button;	// this value might be overwritten if two tabs point to same container

			var _this = this;
			dojo.connect(button, "onClick", function(){ _this.onButtonClick(page); });
			dojo.connect(button, "onClickCloseButton", function(){ _this.onCloseButtonClick(page); });
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
			container.selectChild(page);
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

			if( (evt.keyCode == dojo.keys.RIGHT_ARROW)||
				(evt.keyCode == dojo.keys.LEFT_ARROW) ){
				var current = 0;
				var next = null;	// the next button to focus on
				var children = this.getChildren();
				// find currently focused button in children array
				var current = dojo.indexOf(children, this.pane2button[this._currentChild]);
				
				// pick next button to focus on
				if(evt.keyCode == dojo.keys.RIGHT_ARROW){
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
	"dijit.layout._PageButton",
	[dijit.form.ToggleButton],
{
	// summary
	//	Internal widget used by PageList.
	//	The button-like or tab-like object you click to select or delete a page

	onClick: function(/*Event*/ evt) {
		// Don't do anything; let PageController catch the event and tell me what to do
	},

	onClickCloseButton: function(/*Event*/ evt){
		// summary
		//	PageContainer connects to this function; if your widget contains a close button
		//	then clicking it should call this function.
		evt.stopPropagation();
	}
});

// These arguments can be specified for the children of a PageContainer.
// Since any widget can be specified as a PageContainer child, mix them
// into the base widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit.base.Widget, {
	// title: String
	//		Title of this widget.  Used by TabContainer to the name the tab, etc.
	title: "",
	
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



