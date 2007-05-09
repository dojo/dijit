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
	//	where each tab has the title (aka label) of the pane, and optionally a close button.
	//
	//	Publishes topics <widgetId>-addChild, <widgetId>-removeChild, and <widgetId>-selectChild
	//	(where <widgetId> is the id of the TabContainer itself.

	// labelPosition: String
	//   Defines where tab labels go relative to tab content.
	//   "top", "bottom", "left-h", "right-h"
	labelPosition: "top",
	
	// closeButton: String
	//   If closebutton=="tab", then every tab gets a close button.
	//   DEPRECATED:  Should just say closable=true on each
	//   pane you want to be closable.
	closeButton: "none",

	templateString: null,	// override setting in PageContainer
	templatePath: dojo.moduleUrl("dijit.layout", "templates/TabContainer.html"),

	postCreate: function() {	
		dijit.layout.TabContainer.superclass.postCreate.apply(this, arguments);
		// create the tab list that will have a tab (a.k.a. tab button) for each tab panel
		this.tablist = new dijit.layout.TabController(
			{
				id: this.id + "_tablist",
				labelPosition: this.labelPosition,
				doLayout: this.doLayout,
				containerId: this.id
			}, this.tablistNode);		
	},
	
	layout: function(){
		dijit.layout.TabContainer.superclass.layout.apply(this, arguments);
		// wire up the tablist and its tabs
		this.tablist.layout();
		// size the container pane to take up the space not used by the tabs themselves
		this.onResized();	
	},

	_setupChild: function(tab){
		if(this.closeButton=="tab" || this.closeButton=="pane"){
			// TODO: remove in 0.5
			tab.closable=true;
		}
		dojo.addClass(tab.domNode, "dojoTabPane");
		dijit.layout.TabContainer.superclass._setupChild.apply(this, arguments);
	},

	onResized: function(){
		// Summary: Configure the content pane to take up all the space except for where the tabs are
		if(!this.doLayout){ return; }

		// position the labels and the container node
		var labelAlign=this.labelPosition.replace(/-h/,"");
		var children = [
			{domNode: this.tablist.domNode, layoutAlign: labelAlign},
			{domNode: this.containerNode, layoutAlign: "client"}
		];
		dijit.base.Layout.layoutChildren(this.domNode, children);

		if(this.selectedChildWidget){
			var containerSize = dojo.contentBox(this.containerNode);
			if(this.selectedChildWidget.resize){
				this.selectedChildWidget.resize(containerSize);
			}
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
		// 	Set of tabs (the things with labels and a close button, that you click to show a tab panel).
		//	Lets the user select the currently shown pane in a TabContainer or PageContainer.
		//	TabController also monitors the TabContainer, and whenever a pane is
		//	added or deleted updates itself accordingly.

		templateString: "<div wairole='tablist' dojoAttachEvent='onkeypress:onkeypress'></div>",

		// labelPosition: String
		//   Defines where tab labels go relative to tab content.
		//   "top", "bottom", "left-h", "right-h"
		labelPosition: "top",

		doLayout: true,

		// class: String
		//	Class name to apply to the top dom node
		"class": "",

		// buttonWidget: String
		//	the name of the tab widget to create to correspond to each page
		buttonWidget: "dijit.layout.TabButton",

		postMixInProperties: function(){
			if(!this["class"]){
				this["class"] = "dojoTabLabels-" + this.labelPosition + (this.doLayout ? "" : " dojoTabNoLayout");
			}
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
	//	Contains the title (aka label) of the pane, and optionally a close-button to destroy the pane.
	//	This is an internal widget and should not be instantiated directly.

	templateString: "<div class='dojoTab' dojoAttachEvent='onclick:onClick'>"
						+"<div dojoAttachPoint='innerDiv'>"
							+"<span dojoAttachPoint='titleNode' tabIndex='-1' waiRole='tab'>${this.label}</span>"
							+"<span dojoAttachPoint='closeButtonNode' class='close closeImage' style='${this.closeButtonStyle}'"
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


//TODO: make private?
//TODO: how does a11y get activated?
dojo.declare(
	"dijit.a11y.TabButton",
	dijit.layout.TabButton,
	{
		// summary
		//	Tab for display in high-contrast mode (where background images don't show up).
		//	This is an internal widget and shouldn't be instantiated directly.

		imgPath: dojo.moduleUrl("dijit", "themes/tundra/tab_close.gif"),
		
		templateString: "<div class='dojoTab' dojoAttachEvent='onclick:onClick;onkeypress:onkeypress'>"
							+"<div dojoAttachPoint='innerDiv'>"
								+"<span dojoAttachPoint='titleNode' tabIndex='-1' waiRole='tab'>${this.label}</span>"
								+"<img class='close' src='${this.imgPath}' alt='[x]' style='${this.closeButtonStyle}'"
								+"    dojoAttachEvent='onclick:onCloseButtonClick'>"
							+"</div>"
						+"</div>"
	}
);

