dojo.provide("dijit._tree.Controller");


dojo.require("dijit.base.Widget");
dojo.require("dijit.Tree");

dojo.declare(
	"dijit._tree.Controller",
	[dijit.base.Widget, dijit._tree.Listener],
{
	// Summary: _tree.Controller performs all basic operations on Tree
	// Description:
	//	Controller is the component to operate on model.
	//	Tree/_tree.Node know how to modify themselves and show to user,
	//  but operating on the tree often involves higher-level extensible logic,
	//  like: database synchronization, node loading, reacting on clicks etc.
	//  That's why it is handled by separate controller.
	//  Controller processes expand/collapse and should be used if you 
	//  modify a tree.

	// Summary: TreeCommon.listenTree will attach listeners to these events
	// Description:
	//	The logic behind the naming:
	//	1. (after|before)
	//	2. if an event refers to tree, then add "Tree"
	//	3. add action	
	listenTreeEvents: [
		"execute", "toggleOpen", "zoomIn", "zoomOut", "next", "previous",
		// TODO: check if these are necessary
		"afterSetFolder", "afterTreeCreate", "beforeTreeDestroy"],

	postMixInProperties: function(){
		// single controller can handle multiple trees. widgetId => tree widget mapping is stored here.
		this._listenedTrees = {};
		dojo.lang.forEach(this.listenTrees, this.listenTree);
	},

	onBeforeTreeDestroy: function(message) {
        this.unlistenTree(message.source);
	},

	onNext: function(message) {
		// summary: down arrow pressed; move to next visible node

		var returnWidget;

		// if this is an expanded folder, get the first child
		var nodeWidget = message.node;
		if (nodeWidget.isFolder && nodeWidget.isExpanded && nodeWidget.hasChildren()) {
			returnWidget = nodeWidget.getChildren()[0];			
		} else {
			// find a parent node with a sibling
			while (nodeWidget.isTreeNode) {
				returnWidget = nodeWidget.getNextSibling();
				if(returnWidget){
					break;
				}
				nodeWidget = nodeWidget.parent;
			}	
		}
				
		if (returnWidget && returnWidget.isTreeNode) {
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}	
	},
	
	onPrevious: function(nodeWidget) {
		// summary: up arrow pressed; move to previous visible node

		var returnWidget = nodeWidget;
		
		// if younger siblings		
		var previousSibling = nodeWidget.getPreviousSibling();
		if (previousSibling) {
			nodeWidget = previousSibling;
			// if the previous nodeWidget is expanded, dive in deep
			while (nodeWidget.isFolder && nodeWidget.isExpanded && nodeWidget.hasChildren()) {
				returnWidget = nodeWidget;
				// move to the last child
				var children = nodeWidget.getChildren();
				nodeWidget = children[children.length-1];
			}
		} else {
			// if this is the first child, return the parent
			nodeWidget = nodeWidget.parent;
		}
		
		if (nodeWidget && nodeWidget.isTreeNode) {
			returnWidget = nodeWidget;
		}
		
		if (returnWidget && returnWidget.isTreeNode) {
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}
	},
	
	onZoomIn: function(nodeWidget) {
		// summary: right arrow pressed; go to child node
		var returnWidget = nodeWidget;
		
		// if not expanded, expand, else move to 1st child
		if (nodeWidget.isFolder && !nodeWidget.isExpanded) {
			this._expand(nodeWidget);
		}else if (nodeWidget.hasChildren()) {
			nodeWidget = nodeWidget.getChildren()[0];
		}
		
		if (nodeWidget && nodeWidget.isTreeNode) {
			returnWidget = nodeWidget;
		}
		
		if (returnWidget && returnWidget.isTreeNode) {
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}
	},
	
	onZoomOut: function(node) {
		// summary: left arrow pressed; go to parent
		
		var returnWidget = node;

		// if not collapsed, collapse, else move to parent
		if (node.isFolder && node.isExpanded) {
			this._collapse(node);
		} else {
			node = node.parent;
		}
		if (node && node.isTreeNode) {
			returnWidget = node;
		}
		
		if (returnWidget && returnWidget.isTreeNode) {
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}
	},

	onAfterTreeCreate: function(message) {		
		if (tree.expandLevel) {								
			this.expandToLevel(tree, tree.expandLevel);
		}
	},

	onToggleOpen: function(node){
		// summary: user clicked the +/- icon; expand or collapse my children.
		if (node.isExpanded){
			this._collapse(node);
		} else {
			this._expand(node);
		}
	},
	
	getWidgetByNode: function(/*DomNode*/ node) {
		// summary:
		//		trace up the DOM tree starting from the given node until we
		//		find out what widget it's in.
		// returns:
		//		widget
		var widgetId;
		var newNode = node;
		while (! (widgetId = newNode.widgetId) ) {
			newNode = newNode.parentNode;
			if (newNode == null) { break; }
		}
		if (widgetId) { return dijit.byId(widgetId); }
		else { return null; }
	},

	_expand: function(node) {
		if (node.isFolder) {			
			node.expand(); // skip trees or non-folders
		}		
	},

	_collapse: function(node) {
		if (node.isFolder) {
			node.collapse();
		}
	}
});
