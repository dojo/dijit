dojo.provide("dijit.layout.TabContainer");

dojo.require("dijit.layout.StackContainer");
dojo.require("dijit._Templated");
dojo.require("dijit.layout.TabController");
dojo.require("dijit.layout.ScrollingTabController");

dojo.declare("dijit.layout.TabContainer",
	[dijit.layout.StackContainer, dijit._Templated],
	{
	// summary:
	//		A Container with tabs to select each child (only one of which is displayed at a time).
	// description:
	//		A TabContainer is a container that has multiple panes, but shows only
	//		one pane at a time.  There are a set of tabs corresponding to each pane,
	//		where each tab has the title (aka title) of the pane, and optionally a close button.
	//
	//		Publishes topics [widgetId]-addChild, [widgetId]-removeChild, and [widgetId]-selectChild
	//		(where [widgetId] is the id of the TabContainer itself.

	// tabPosition: String
	//		Defines where tabs go relative to tab content.
	//		"top", "bottom", "left-h", "right-h"
	tabPosition: "top",

	baseClass: "dijitTabContainer",

	// tabStrip: Boolean
	//		Defines whether the tablist gets an extra class for layouting, putting a border/shading
	//		around the set of tabs.
	tabStrip: false,

	// nested: Boolean
	//		If true, use styling for a TabContainer nested inside another TabContainer.
	//		For tundra etc., makes tabs look like links, and hides the outer
	//		border since the outer TabContainer already has a border.
	nested: false,

	// useMenu: [const] Boolean
	//		True if a menu should be used to select tabs when they are too
	//		wide to fit the TabContainer, false otherwise.
	useMenu: true,

	// useSlider: [const] Boolean
	//		True if a slider should be used to select tabs when they are too
	//		wide to fit the TabContainer, false otherwise.
	useSlider: true,

	templateString: null,	// override setting in StackContainer
	templatePath: dojo.moduleUrl("dijit.layout", "templates/TabContainer.html"),

	// _controllerWidget: String
	//		An optional parameter to overrider the default TabContainer controller used.
	_controllerWidget: null,

	postMixInProperties: function(){
		// set class name according to tab position, ex: dijiTabContainerTop
		this.baseClass += this.tabPosition.charAt(0).toUpperCase() + this.tabPosition.substr(1).replace(/-.*/, "");
		this.srcNodeRef && dojo.style(this.srcNodeRef, "visibility", "hidden");
		
		// scrolling controller only works for horizontal non-nested tabs
		if(!this._controllerWidget){
			this._controllerWidget = (this.tabPosition == "top" || this.tabPosition == "bottom") && !this.nested ?
						"dijit.layout.ScrollingTabController" : "dijit.layout.TabController";
		}

		this.inherited(arguments);
	},

	postCreate: function(){
		this.inherited(arguments);

		var cls = this.baseClass + "-tabs" + (this.doLayout ? "" : " dijitTabNoLayout");

		// create the tab list that will have a tab (a.k.a. tab button) for each tab panel
		var TabController = dojo.getObject(this._controllerWidget);
		this.tablist = new TabController({
			id: this.id + "_tablist",
			tabPosition: this.tabPosition,
			doLayout: this.doLayout,
			containerId: this.id,
			"class": cls,
			nested: this.nested,
			useMenu: this.useMenu,
			useSlider: this.useSlider,
			tabStripClass: this.tabStrip ? this.baseClass + (this.tabStrip ? "":"No") + "Strip": null
		}, this.tablistNode);

		if(!this.doLayout){ dojo.addClass(this.domNode, "dijitTabContainerNoLayout"); }

		if(this.nested){
			/* workaround IE's lack of support for "a > b" selectors by
			 * tagging each node in the template.
			 */
			dojo.addClass(this.domNode, "dijitTabContainerNested");
			dojo.addClass(this.tablist.containerNode, "dijitTabContainerTabListNested");
			dojo.addClass(this.tablistSpacer, "dijitTabContainerSpacerNested");
			dojo.addClass(this.domNode, "dijitTabPaneWrapperNested");
		}else{
			dojo.addClass(this.domNode, "tabStrip-" + (this.tabStrip ? "enabled" : "disabled"));
		}
	},

	_setupChild: function(/* Widget */tab){
		// Overrides StackContainer._setupChild().
		dojo.addClass(tab.domNode, "dijitTabPane");
		this.inherited(arguments);
	},

	startup: function(){
		if(this._started){ return; }

		// wire up the tablist and its tabs
		this.tablist.startup();
		this.inherited(arguments);
	},

	layout: function(){
		// Overrides StackContainer.layout().
		// Configure the content pane to take up all the space except for where the tabs are
		if(!this._contentBox || typeof(this._contentBox.l) == "undefined"){return;}

		if (this.doLayout) {
			// position and size the titles and the container node
			var titleAlign = this.tabPosition.replace(/-h/, "");
			this.tablist.layoutAlign = titleAlign;
			var children = [this.tablist, {
				domNode: this.tablistSpacer,
				layoutAlign: titleAlign
			}, {
				domNode: this.containerNode,
				layoutAlign: "client"
			}];
			dijit.layout.layoutChildren(this.domNode, this._contentBox, children);
			
			// Compute size to make each of my children.
			// children[2] is the margin-box size of this.containerNode, set by layoutChildren() call above
			this._containerContentBox = dijit.layout.marginBox2contentBox(this.containerNode, children[2]);
			
			if (this.selectedChildWidget) {
				if (this.selectedChildWidget.resize) {
					this.selectedChildWidget.resize(this._containerContentBox);
				}
			}
		}else{
			// just layout the tab controller, so it can position left/right buttons etc.
			if(this.tablist.resize){
				this.tablist.resize({w: dojo.contentBox(this.domNode).w});
			}
		}
	},

	destroy: function(){
		if(this.tablist){
			this.tablist.destroy();
		}
		this.inherited(arguments);
	}
});

