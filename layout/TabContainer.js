dojo.provide("dijit.layout.TabContainer");

dojo.require("dijit.layout.PageContainer");
dojo.require("dijit.base.Layout");

dojo.declare(
	"dijit.layout.TabContainer",
	[dijit.layout.PageContainer, dijit.base.Sizable],
{	
	
	
	// summary
	//	A TabContainer is a container that has multiple panes, but shows only
	//	one pane at a time.  There are a set of tabs corresponding to each pane,
	//	where each tab has the title (aka title) of the pane, and optionally a close button.
	//
	//	Publishes topics <widgetId>-addChild, <widgetId>-removeChild, and <widgetId>-selectChild
	//	(where <widgetId> is the id of the TabContainer itself.

	// tabPosition: String
	//   Defines where tabs go relative to tab content.
	//   "top", "bottom", "left-h", "right-h"
	tabPosition: "top",
	
	templateString: null,	// override setting in PageContainer
	templatePath: dojo.moduleUrl("dijit.layout", "templates/TabContainer.html"),

	postCreate: function() {	
		dijit.layout.TabContainer.superclass.postCreate.apply(this, arguments);
		// create the tab list that will have a tab (a.k.a. tab button) for each tab panel
		this.tablist = new dijit.layout.TabController(
			{
				id: this.id + "_tablist",
				tabPosition: this.tabPosition,
				doLayout: this.doLayout,
				containerId: this.id
			}, this.tablistNode);		
	},
	
	_setupChild: function(tab){
		dojo.addClass(tab.domNode, "dijitTabPane");
		dijit.layout.TabContainer.superclass._setupChild.apply(this, arguments);
	},

	startup: function(){
		// wire up the tablist and its tabs
		this.tablist.startup();
		dijit.layout.TabContainer.superclass.startup.apply(this, arguments);
	},

	layout: function(){
		// Summary: Configure the content pane to take up all the space except for where the tabs are
		if(!this.doLayout){ return; }

		// position and size the titles and the container node
		var titleAlign=this.tabPosition.replace(/-h/,"");
		var children = [
			{domNode: this.tablist.domNode, layoutAlign: titleAlign},
			{domNode: this.containerNode, layoutAlign: "client"}
		];
		dijit.base.Layout.layoutChildren(this.domNode, this._contentBox, children);

		// Compute size to make each of my children.
		// children[1] is the margin-box size of this.containerNode, set by layoutChildren() call above
		this._containerContentBox = dijit.base.Layout.marginBox2contentBox(this.containerNode, children[1]);

		if(this.selectedChildWidget){
			this._showChild(this.selectedChildWidget);
		}
	},

	onkeypress: function(e){
		// summary
		//	Keystroke handling for keystrokes on the tab panel itself (that were bubbled up to me)
		//	Ctrl-up: focus is returned from the pane to the tab button
		//	Alt-del: close tab
		if(e.keyCode == e.KEY_UP_ARROW && e.ctrlKey){
			// set focus to current tab
			var button = this.correspondingTabButton || this.selectedTabWidget.tabButton;
			button.focus();
			dojo.stopEvent(e);
		}else if(e.keyCode == e.KEY_DELETE && e.altKey){
			if (this.selectedChildWidget.closable){
				this.closeChild(this.selectedChildWidget);
				dojo.stopEvent(e);
			}
		}
	},

	destroy: function(){
		this.tablist.destroy();
		dijit.layout.TabContainer.superclass.destroy.apply(this, arguments);
	}
});

//TODO: make private?
dojo.declare(
    "dijit.layout.TabController",
    dijit.layout.PageController,
	{
		// summary
		// 	Set of tabs (the things with titles and a close button, that you click to show a tab panel).
		//	Lets the user select the currently shown pane in a TabContainer or PageContainer.
		//	TabController also monitors the TabContainer, and whenever a pane is
		//	added or deleted updates itself accordingly.

		templateString: "<div wairole='tablist' dojoAttachEvent='onkeypress:onkeypress'></div>",

		// tabPosition: String
		//   Defines where tabs go relative to the content.
		//   "top", "bottom", "left-h", "right-h"
		tabPosition: "top",

		doLayout: true,

		// buttonWidget: String
		//	the name of the tab widget to create to correspond to each page
		buttonWidget: "dijit.layout.TabButton",

		postMixInProperties: function(){
			this["class"] = "dijitTabLabels-" + this.tabPosition + (this.doLayout ? "" : " dijitTabNoLayout");
			dijit.layout.TabController.superclass.postMixInProperties.apply(this, arguments);
		}
	}
);

//TODO: make private?
dojo.declare(
	"dijit.layout.TabButton", dijit.layout.PageButton,
{
	// summary
	//	A tab (the thing you click to select a pane).
	//	Contains the title of the pane, and optionally a close-button to destroy the pane.
	//	This is an internal widget and should not be instantiated directly.

	selectedClass: "dijitTabActive",
	hoverClass : "dijitTabHover",
	closeHoverClass : "closeImageHover",

	templateString: "<div class='dijitTab' dojoAttachEvent='onclick:onClick; onmouseover:onMouseOver; onmouseout:onMouseOut;'>"
						+"<div class='dijitTabInnerDiv' dojoAttachPoint='innerDiv'>"
							+"<span dojoAttachPoint='titleNode' tabIndex='-1' waiRole='tab'>${label}</span>"
							+"<span dojoAttachPoint='closeButtonNode' class='closeImage' style='${closeButtonStyle}'"
							+"    dojoAttachEvent='onmouseover:onCloseButtonMouseOver; onmouseout:onCloseButtonMouseOut; onclick:onCloseButtonClick'></span>"
						+"</div>"
					+"</div>",

	postMixInProperties: function(){
		this.closeButtonStyle = this.closeButton ? "" : "display: none";
		dijit.layout.TabButton.superclass.postMixInProperties.apply(this, arguments);
	},

	postCreate: function(){
		dijit.layout.TabButton.superclass.postCreate.apply(this, arguments);
		dijit._disableSelection(this.titleNode);
	},
	
	onCloseButtonClick: function(/*Event*/ evt){
		// since the close button is located inside the select button, make sure that the select
		// button doesn't inadvertently get an onClick event
		evt.stopPropagation();
		dijit.layout.TabButton.superclass.onCloseButtonClick.apply(this, arguments);
	}
});
