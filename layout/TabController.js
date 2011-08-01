define([
	"dojo/text!./templates/_TabButton.html",
	"./StackController",
	"../Menu",
	"../MenuItem",
	"dojo/i18n!../nls/common",
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.setSelectable
	"dojo/dom-attr", // domAttr.attr
	"dojo/dom-class", // domClass.toggle
	"dojo/_base/lang", // lang.hitch lang.trim
	"dojo/i18n" // i18n.getLocalization
], function(template, StackController, Menu, MenuItem, nlsCommon, declare, dom, domAttr, domClass, lang, i18n){

/*=====
	var StackController = dijit.layout.StackController;
	var Menu = dijit.Menu;
	var MenuItem = dijit.MenuItem;
=====*/

// module:
//		dijit/layout/TabController
// summary:
// 		Set of tabs (the things with titles and a close button, that you click to show a tab panel).
//		Used internally by `dijit.layout.TabContainer`.

var TabController = declare("dijit.layout.TabController", StackController, {
	// summary:
	// 		Set of tabs (the things with titles and a close button, that you click to show a tab panel).
	//		Used internally by `dijit.layout.TabContainer`.
	// description:
	//		Lets the user select the currently shown pane in a TabContainer or StackContainer.
	//		TabController also monitors the TabContainer, and whenever a pane is
	//		added or deleted updates itself accordingly.
	// tags:
	//		private

	baseClass: "dijitTabController",

	templateString: "<div role='tablist' dojoAttachEvent='onkeypress:onkeypress'></div>",

	// tabPosition: String
	//		Defines where tabs go relative to the content.
	//		"top", "bottom", "left-h", "right-h"
	tabPosition: "top",

	// buttonWidget: String
	//		The name of the tab widget to create to correspond to each page
	buttonWidget: "dijit.layout._TabButton",

	_rectifyRtlTabList: function(){
		// summary:
		//		For left/right TabContainer when page is RTL mode, rectify the width of all tabs to be equal, otherwise the tab widths are different in IE

		if(0 >= this.tabPosition.indexOf('-h')){ return; }
		if(!this.pane2button){ return; }

		var maxWidth = 0;
		for(var pane in this.pane2button){
			var ow = this.pane2button[pane].innerDiv.scrollWidth;
			maxWidth = Math.max(maxWidth, ow);
		}
		//unify the length of all the tabs
		for(pane in this.pane2button){
			this.pane2button[pane].innerDiv.style.width = maxWidth + 'px';
		}
	}
});

TabController.TabButton = declare("dijit.layout._TabButton", StackController.StackButton, {
	// summary:
	//		A tab (the thing you click to select a pane).
	// description:
	//		Contains the title of the pane, and optionally a close-button to destroy the pane.
	//		This is an internal widget and should not be instantiated directly.
	// tags:
	//		private

	// baseClass: String
	//		The CSS class applied to the domNode.
	baseClass: "dijitTab",

	// Apply dijitTabCloseButtonHover when close button is hovered
	cssStateNodes: {
		closeNode: "dijitTabCloseButton"
	},

	templateString: template,

	// Override _FormWidget.scrollOnFocus.
	// Don't scroll the whole tab container into view when the button is focused.
	scrollOnFocus: false,

	buildRendering: function(){
		this.inherited(arguments);

		dom.setSelectable(this.containerNode, false);
	},

	startup: function(){
		this.inherited(arguments);
		var n = this.domNode;

		// Required to give IE6 a kick, as it initially hides the
		// tabs until they are focused on.
		setTimeout(function(){
			n.className = n.className;
		}, 1);
	},

	_setCloseButtonAttr: function(/*Boolean*/ disp){
		// summary:
		//		Hide/show close button
		this._set("closeButton", disp);
		domClass.toggle(this.innerDiv, "dijitClosable", disp);
		this.closeNode.style.display = disp ? "" : "none";
		if(disp){
			var _nlsResources = i18n.getLocalization("dijit", "common");
			if(this.closeNode){
				domAttr.set(this.closeNode,"title", _nlsResources.itemClose);
			}
			// add context menu onto title button
			var _nlsResources = i18n.getLocalization("dijit", "common");
			this._closeMenu = new Menu({
				id: this.id+"_Menu",
				dir: this.dir,
				lang: this.lang,
				textDir: this.textDir,
				targetNodeIds: [this.domNode]
			});

			this._closeMenu.addChild(new MenuItem({
				label: _nlsResources.itemClose,
				dir: this.dir,
				lang: this.lang,
				textDir: this.textDir,
				onClick: lang.hitch(this, "onClickCloseButton")
			}));
		}else{
			if(this._closeMenu){
				this._closeMenu.destroyRecursive();
				delete this._closeMenu;
			}
		}
	},
	_setLabelAttr: function(/*String*/ content){
		// summary:
		//		Hook for set('label', ...) to work.
		// description:
		//		takes an HTML string.
		//		Inherited ToggleButton implementation will Set the label (text) of the button;
		//		Need to set the alt attribute of icon on tab buttons if no label displayed
		this.inherited(arguments);
		if(!this.showLabel && !this.params.title){
			this.iconNode.alt = lang.trim(this.containerNode.innerText || this.containerNode.textContent || '');
		}
	},

	destroy: function(){
		if(this._closeMenu){
			this._closeMenu.destroyRecursive();
			delete this._closeMenu;
		}
		this.inherited(arguments);
	}
});


return TabController;
});
