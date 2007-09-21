dojo.provide("dijit.Tree");

dojo.require("dojo.fx");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._Container");

dojo.declare(
	"dijit._TreeNode",
	[dijit._Widget, dijit._Templated, dijit._Container, dijit._Contained],
{
	// summary
	//		Single node within a tree

	// item: dojo.data.Item
	//		the dojo.data entry this tree represents
	item: null,	

	isTreeNode: true,

	// label: String
	//		Text of this tree node
	label: "",

	isExpandable: null, // show expando node
	
	isExpanded: false,

	// state: String
	//		dynamic loading-related stuff.
	//		When an empty folder node appears, it is "UNCHECKED" first,
	//		then after dojo.data query it becomes "LOADING" and, finally "LOADED"	
	state: "UNCHECKED",

	templatePath: dojo.moduleUrl("dijit", "_tree/Node.html"),		

	postCreate: function(){
		// set label, escaping special characters
		this.setLabelNode(this.label);

		// set expand icon for leaf 	
		this._setExpando();

		// set icon based on item
		dojo.addClass(this.iconNode, this.tree.getIconClass(this.item));

		if(this.isExpandable){
			dijit.wai.setAttr(this.labelNode, "waiState", "expanded", this.isExpanded);
		}
	},

	markProcessing: function(){
		// summary: visually denote that tree is loading data, etc.
		this.state = "LOADING";
		this._setExpando(true);	
	},

	unmarkProcessing: function(){
		// summary: clear markup from markProcessing() call
		this._setExpando(false);	
	},

	_updateLayout: function(){
		// summary: set appropriate CSS classes for this.domNode
		dojo.toggleClass(this.domNode, "dijitTreeIsLast", !this.getNextSibling());
	},

	_setExpando: function(/*Boolean*/ processing){
		// summary: set the right image for the expando node

		// apply the appropriate class to the expando node
		var styles = ["dijitTreeExpandoLoading", "dijitTreeExpandoOpened",
			"dijitTreeExpandoClosed", "dijitTreeExpandoLeaf"];
		var idx = processing ? 0 : (this.isExpandable ?	(this.isExpanded ? 1 : 2) : 3);
		dojo.forEach(styles,
			function(s){
				dojo.removeClass(this.expandoNode, s);
			}, this
		);
		dojo.addClass(this.expandoNode, styles[idx]);

		// provide a non-image based indicator for images-off mode
		this.expandoNodeText.innerHTML =
			processing ? "*" :
				(this.isExpandable ?
					(this.isExpanded ? "-" : "+") : "*");
	},	

	expand: function(){
		// summary: show my children
		if(this.isExpanded){ return; }
		// cancel in progress collapse operation
		if(this._wipeOut.status() == "playing"){
			this._wipeOut.stop();
		}

		this.isExpanded = true;
		dijit.wai.setAttr(this.labelNode, "waiState", "expanded", "true");
		dijit.wai.setAttr(this.containerNode, "waiRole", "role", "group");

		this._setExpando();

		this._wipeIn.play();
	},

	collapse: function(){					
		if(!this.isExpanded){ return; }

		// cancel in progress expand operation
		if(this._wipeIn.status() == "playing"){
			this._wipeIn.stop();
		}

		this.isExpanded = false;
		dijit.wai.setAttr(this.labelNode, "waiState", "expanded", "false");
		this._setExpando();

		this._wipeOut.play();
	},

	setLabelNode: function(label){
		this.labelNode.innerHTML="";
		this.labelNode.appendChild(document.createTextNode(label));
	},

	_setChildren: function(/* Object[] */ childrenArray){
		// summary:
		//		Sets the children of this node.
		//		Sets this.isExpandable based on whether or not there are children
		// 		Takes array of objects like: {label: ...} (_TreeNode options basically)
		//		See parameters of _TreeNode for details.

		this.destroyDescendants();

		this.state = "LOADED";
		var nodeMap= {};
		if(childrenArray && childrenArray.length > 0){
			this.isExpandable = true;
			if(!this.containerNode){ // maybe this node was unfolderized and still has container
				this.containerNode = this.tree.containerNodeTemplate.cloneNode(true);
				this.domNode.appendChild(this.containerNode);
			}

			// Create _TreeNode widget for each specified tree node
			dojo.forEach(childrenArray, function(childParams){
				var child = new dijit._TreeNode(dojo.mixin({
					tree: this.tree,
					label: this.tree.getLabel(childParams.item)
				}, childParams));
				this.addChild(child);
				nodeMap[this.tree.store.getIdentity(childParams.item)] = child;
			}, this);

			// note that updateLayout() needs to be called on each child after
			// _all_ the children exist
			dojo.forEach(this.getChildren(), function(child, idx){
				child._updateLayout();
			});
		}else{
			this.isExpandable=false;
		}

		if(this._setExpando){
			// change expando to/form dot or + icon, as appropriate
			this._setExpando(false);
		}

		// create animations for showing/hiding the children (if children exist)
		if(this.containerNode && !this._wipeIn){
			this._wipeIn = dojo.fx.wipeIn({node: this.containerNode, duration: 150});
			this._wipeOut = dojo.fx.wipeOut({node: this.containerNode, duration: 150});
		}

		return nodeMap;
	},

	_addChildren: function(/* object[] */ childrenArray){
		// summary:
		//		adds the children to this node.
		// 		Takes array of objects like: {label: ...}  (_TreeNode options basically)

		//		See parameters of _TreeNode for details.
		var nodeMap = {};
		if (childrenArray && childrenArray.length > 0){
			dojo.forEach(childrenArray, function(childParams){
				var child = new dijit._TreeNode(
					dojo.mixin({
						tree: this.tree,
						label: this.tree.getLabel(childParams.item)
					}, childParams)
				);
				this.addChild(child);
				nodeMap[this.tree.store.getIdentity(childParams.item)] = child;
			}, this);

			dojo.forEach(this.getChildren(), function(child, idx){
				child._updateLayout();
			});
		}

		return nodeMap;
	},

	deleteNode: function(/* treeNode */ node){
		node.destroy();

		dojo.forEach(this.getChildren(), function(child, idx){
			child._updateLayout();
		});
	},

	makeExpandable: function(){
		//summary
		//		if this node wasn't already showing the expando node,
		//		turn it into one and call _setExpando()
		this.isExpandable = true;
		this._setExpando(false);
	}
});

dojo.declare(
	"dijit.Tree",
	dijit._TreeNode,
{
	// store: String||dojo.data.Store
	//	The store to get data to display in the tree
	store: null,

	// query: String
	//	query to get top level node(s) of tree (ex: {type:'continent'})
	query: null,

	// childrenAttr: String
	//		one ore more attributes that holds children of a tree node
	childrenAttr: ["children"],

	templatePath: dojo.moduleUrl("dijit", "_tree/Tree.html"),		

	isExpandable: true,

	isTree: true,

	// dndController: String
	//	class name to use as as the dnd controller
	dndController: null,

	//parameters to pull off of the tree and pass on to the dndController as its params
	dndParams: ["onDndDrop","itemCreator","onDndCancel","checkAcceptance", "checkItemAcceptance"],

	//declare the above items so they can be pulled from the tree's markup
	onDndDrop:null,
	itemCreator:null,
	onDndCancel:null,
	checkAcceptance:null,	
	checkItemAcceptance:null,

	_publish: function(/*String*/ topicName, /*Object*/ message){
		// summary:
		//		Publish a message for this widget/topic
		dojo.publish(this.id, [dojo.mixin({tree: this, event: topicName}, message||{})]);
	},

	postMixInProperties: function(){
		this.tree = this;
		this.lastFocused = this.labelNode;

		this._itemNodeMap={};

		// if the store supports Notification, subscribe to the notification events
		if (this.store.getFeatures()['dojo.data.api.Notification']){
			this.connect(this.store, "onNew", "_onNewItem");
			this.connect(this.store, "onDelete", "_onDeleteItem");
			this.connect(this.store, "onSet", "_onSetItem");
		}
	},

	postCreate: function(){
		// make template for container node (we will clone this and insert it into
		// any nodes that have children)
		var div = document.createElement('div');
		div.style.display = 'none';
		div.className = "dijitTreeContainer";	
		dijit.wai.setAttr(div, "waiRole", "role", "presentation");
		this.containerNodeTemplate = div;

		this.inherited("postCreate", arguments);

		// load top level children
		this._expandNode(this);

		if (this.dndController){
			if (dojo.isString(this.dndController)){
				this.dndController= dojo.getObject(this.dndController);
			}	
			var params={};
			for (var i=0; i<this.dndParams.length;i++){
				if (this[this.dndParams[i]]){
					params[this.dndParams[i]]=this[this.dndParams[i]];
				}
			}
			this.dndController= new this.dndController(this, params);
		}
	},

	////////////// Data store related functions //////////////////////

	mayHaveChildren: function(/*dojo.data.Item*/ item){
		// summary
		//		User overridable function to tell if an item has or may have children.
		//		Controls whether or not +/- expando icon is shown.
		//		(For efficiency reasons we may not want to check if an element has
		//		children until user clicks the expando node)

		return dojo.some(this.childrenAttr, function(attr){
			return this.store.hasAttribute(item, attr);
		}, this);
	},

	getItemChildren: function(/*dojo.data.Item*/ parentItem, /*function(items)*/ onComplete){
		// summary
		// 		User overridable function that return array of child items of given parent item,
		//		or if parentItem==null then return top items in tree
		var store = this.store;
		if(parentItem == null){
			// get top level nodes
			store.fetch({ query: this.query, onComplete: onComplete});
		}else{
			// get children of specified node
			var childItems = [];
			for (var i=0; i<this.childrenAttr.length; i++){	
				childItems= childItems.concat(store.getValues(parentItem, this.childrenAttr[i]));
			}
			// count how many items need to be loaded
			var _waitCount = 0;
			dojo.forEach(childItems, function(item){ if(!store.isItemLoaded(item)){ _waitCount++; } });

		   	if(_waitCount == 0){
		   		// all items are already loaded.  proceed..
		   		onComplete(childItems);
		   	}else{
		   		// still waiting for some or all of the items to load
				function onItem(item){
	   				if(--_waitCount == 0){
						// all nodes have been loaded, send them to the tree
						onComplete(childItems);
					}
				}
				dojo.forEach(childItems, function(item){
					if(!store.isItemLoaded(item)){
			   			store.loadItem({item: item, onItem: onItem});
			   		}
			   	});
		   	}
		}
	},

	getItemParentIdentity: function(/*dojo.data.Item*/ item, /*Object*/ parentInfo){
		// summary
		//		User overridable function, to return id of parent (or null if top level).
		//		It's called with args from dojo.store.onNew
		return this.store.getIdentity(parentInfo.item);		// String
	},

	getLabel: function(/*dojo.data.Item*/ item){
		// summary: user overridable function to get the label for a tree node (given the item)
		return this.store.getLabel(item);	// String
	},

	getIconClass: function(/*dojo.data.Item*/ item){
		// summary: user overridable function to return CSS class name to display icon
	},

	getLabelClass: function(/*dojo.data.Item*/ item){
		// summary: user overridable function to return CSS class name to display label
	},

	_onLoadAllItems: function(/*_TreeNode*/ node, /*dojo.data.Item[]*/ items){
		// sumary: callback when all the children of a given node have been loaded
		var childParams=dojo.map(items, function(item){
			return {
				item: item,
				isExpandable: this.mayHaveChildren(item)
			};
		}, this);

		dojo.mixin(this._itemNodeMap,node._setChildren(childParams));

		this._expandNode(node);
	},

	/////////// Keyboard and Mouse handlers ////////////////////

	_onKeyPress: function(/*Event*/ e){
		// summary: translates keypress events into commands for the controller
		if(e.altKey){ return; }
		var treeNode = this._domElement2TreeNode(e.target);
		if(!treeNode){ return; }

		// Note: On IE e.keyCode is not 0 for printables so check e.charCode.
		// In dojo charCode is universally 0 for non-printables.
		if(e.charCode){  // handle printables (letter navigation)
			// Check for key navigation.
			var navKey = e.charCode;
			if(!e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey){
				navKey = (String.fromCharCode(navKey)).toLowerCase();
				this._onLetterKeyNav( { node: treeNode, key: navKey } );
				dojo.stopEvent(e);
			}
		}else{  // handle non-printables (arrow keys)
			var map = this._keyHandlerMap;
			if(!map){
				// setup table mapping keys to events
				map = {};
				map[dojo.keys.ENTER]="_onEnterKey";
				map[dojo.keys.LEFT_ARROW]="_onLeftArrow";
				map[dojo.keys.RIGHT_ARROW]="_onRightArrow";
				map[dojo.keys.UP_ARROW]="_onUpArrow";
				map[dojo.keys.DOWN_ARROW]="_onDownArrow";
				map[dojo.keys.HOME]="_onHomeKey";
				map[dojo.keys.END]="_onEndKey";
				this._keyHandlerMap = map;
			}
			if(this._keyHandlerMap[e.keyCode]){
				this[this._keyHandlerMap[e.keyCode]]( { node: treeNode, item: treeNode.item } );	
				dojo.stopEvent(e);
			}
		}
	},

	_onEnterKey: function(/*Object*/ message){
		this._publish("execute", { item: message.item, node: message.node} );
		this.onClick(message.item, message.node);
	},

	_onDownArrow: function(/*Object*/ message){
		// summary: down arrow pressed; get next visible node, set focus there
		var returnNode = this._navToNextNode(message.node);
		if(returnNode && returnNode.isTreeNode){
			returnNode.tree.focusNode(returnNode);
			return returnNode;
		}	
	},

	_onUpArrow: function(/*Object*/ message){
		// summary: up arrow pressed; move to previous visible node

		var nodeWidget = message.node;
		var returnWidget = nodeWidget;

		// if younger siblings		
		var previousSibling = nodeWidget.getPreviousSibling();
		if(previousSibling){
			nodeWidget = previousSibling;
			// if the previous nodeWidget is expanded, dive in deep
			while(nodeWidget.isExpandable && nodeWidget.isExpanded && nodeWidget.hasChildren()){
				returnWidget = nodeWidget;
				// move to the last child
				var children = nodeWidget.getChildren();
				nodeWidget = children[children.length-1];
			}
		}else{
			// if this is the first child, return the parent
			nodeWidget = nodeWidget.getParent();
		}

		if(nodeWidget && nodeWidget.isTreeNode){
			returnWidget = nodeWidget;
		}

		if(returnWidget && returnWidget.isTreeNode){
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}
	},

	_onRightArrow: function(/*Object*/ message){
		// summary: right arrow pressed; go to child node
		var nodeWidget = message.node;
		var returnWidget = nodeWidget;

		// if not expanded, expand, else move to 1st child
		if(nodeWidget.isExpandable && !nodeWidget.isExpanded){
			this._expandNode(nodeWidget);
		}else if(nodeWidget.hasChildren()){
			nodeWidget = nodeWidget.getChildren()[0];
		}

		if(nodeWidget && nodeWidget.isTreeNode){
			returnWidget = nodeWidget;
		}

		if(returnWidget && returnWidget.isTreeNode){
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}
	},

	_onLeftArrow: function(/*Object*/ message){
		// summary: left arrow pressed; go to parent

		var node = message.node;
		var returnWidget = node;

		// if not collapsed, collapse, else move to parent
		if(node.isExpandable && node.isExpanded){
			this._collapseNode(node);
		}else{
			node = node.getParent();
		}
		if(node && node.isTreeNode){
			returnWidget = node;
		}

		if(returnWidget && returnWidget.isTreeNode){
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}
	},

	_onHomeKey: function(/*Object*/ message){
		// summary: home pressed; get first visible node, set focus there
		var returnNode = this._navToFirstNode(message.tree);
		if(returnNode){
			returnNode.tree.focusNode(returnNode);
			return returnNode;
		}
	},

	_onEndKey: function(/*Object*/ message){
		// summary: end pressed; go to last visible node

		var returnWidget = message.node.tree;

		var lastChild = returnWidget;
		while(lastChild.isExpanded){
			var c = lastChild.getChildren();
			lastChild = c[c.length - 1];
			if(lastChild.isTreeNode){
				returnWidget = lastChild;
			}
		}

		if(returnWidget && returnWidget.isTreeNode){
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}
	},

	_onLetterKeyNav: function(message){
		// summary: letter key pressed; search for node starting with first char = key
		var node = startNode = message.node;
		var tree = message.tree;
		var key = message.key;
		do{
			node = this._navToNextNode(node);
			//check for last node, jump to first node if necessary
			if(!node){
				node = this._navToFirstNode(tree);
			}
		}while(node !== startNode && (node.label.charAt(0).toLowerCase() != key));
		if(node && node.isTreeNode){
			// no need to set focus if back where we started
			if(node !== startNode){
				node.tree.focusNode(node);
			}
			return node;
		}
	},

	_onClick: function(/*Event*/ e){
		// summary: translates click events into commands for the controller to process
		var domElement = e.target;

		// find node
		var nodeWidget = this._domElement2TreeNode(domElement);	
		if(!nodeWidget || !nodeWidget.isTreeNode){
			return;
		}

		if(domElement == nodeWidget.expandoNode ||
			 domElement == nodeWidget.expandoNodeText){
			// expando node was clicked
			if(nodeWidget.isExpandable){
				this._onExpandoClick({node:nodeWidget});
			}
		}else{
			this._publish("execute", { item: nodeWidget.item, node: nodeWidget} );
			this.onClick(nodeWidget.item, nodeWidget);
		}
		dojo.stopEvent(e);
	},

	_onExpandoClick: function(/*Object*/ message){
		// summary: user clicked the +/- icon; expand or collapse my children.
		var node = message.node;
		if(node.isExpanded){
			this._collapseNode(node);
		}else{
			this._expandNode(node);
		}
	},

	onClick: function(/* dojo.data */ item){
		// summary: user overridable function for executing a tree item
	},

	_navToNextNode: function(node){
		// summary: get next visible node
		var returnNode;
		// if this is an expanded node, get the first child
		if(node.isExpandable && node.isExpanded && node.hasChildren()){
			returnNode = node.getChildren()[0];			
		}else{
			// find a parent node with a sibling
			while(node.isTreeNode){
				returnNode = node.getNextSibling();
				if(returnNode){
					break;
				}
				node = node.getParent();
			}	
		}
		return returnNode;
	},

	_navToFirstNode: function(/*Object*/ tree){
		// summary: get first visible node
		var returnNode;
		if(tree){
			returnNode = tree.getChildren()[0];
			if(returnNode && returnNode.isTreeNode){
				return returnNode;
			}
		}
	},

	_domElement2TreeNode: function(/*DomNode*/ domElement){
		var ret;
		do{
			ret=dijit.byNode(domElement);
		}while(!ret && (domElement = domElement.parentNode));
		return ret;
	},

	_collapseNode: function(/*_TreeNode*/ node){
		// summary: called when the user has requested to collapse the node

		if(node.isExpandable){
			if(node.state == "LOADING"){
				// ignore clicks while we are in the process of loading data
				return;
			}
			// are we collapsing a descendant that has the tab index?
			if(dojo.query("[tabindex=0]", node.domNode).length > 0){
				this.focusNode(node);
			}
			node.collapse();
		}
	},

	_expandNode: function(/*_TreeNode*/ node){
		// summary: called when the user has requested to expand the node

		// clicking the expando node might have erased focus from the current item; restore it
		var t = node.tree;
		if(t.lastFocused){ t.focusNode(t.lastFocused); }

		if(!node.isExpandable){
			return;
		}

		var store = this.store;
		var getValue = this.store.getValue;

		switch(node.state){
			case "LOADING":
				// ignore clicks while we are in the process of loading data
				return;

			case "UNCHECKED":
				// need to load all the children, and then expand

				node.markProcessing();
				var _this = this;
				function onComplete(childItems){
					node.unmarkProcessing();
					_this._onLoadAllItems(node, childItems);
				}
				this.getItemChildren(node.item, onComplete);
				break;

			default:
				// data is already loaded; just proceed
				if(node.expand){	// top level Tree doesn't have expand() method
					node.expand();
				}
				break;
		}
	},

	////////////////// Miscellaneous functions ////////////////

	blurNode: function(){
		// summary
		//	Removes focus from the currently focused node (which must be visible).
		//	Usually not called directly (just call focusNode() on another node instead)
		var node = this.lastFocused;
		if(!node){ return; }
		var labelNode = node.labelNode;
		dojo.removeClass(labelNode, "dijitTreeLabelFocused");
		labelNode.setAttribute("tabIndex", "-1");
		this.lastFocused = null;
	},

	focusNode: function(/* _tree.Node */ node){
		// summary
		//	Focus on the specified node (which must be visible)

		this.blurNode();

		// set tabIndex so that the tab key can find this node
		var labelNode = node.labelNode;
		labelNode.setAttribute("tabIndex", "0");

		this.lastFocused = node;
		dojo.addClass(labelNode, "dijitTreeLabelFocused");

		// set focus so that the label wil be voiced using screen readers
		labelNode.focus();
	},

	_onBlur: function(){
		// summary:
		// 		We've moved away from the whole tree.  The currently "focused" node
		//		(see focusNode above) should remain as the lastFocused node so we can
		//		tab back into the tree.  Just change CSS to get rid of the dotted border
		//		until that time
		if(this.lastFocused){
			var labelNode = this.lastFocused.labelNode;
			dojo.removeClass(labelNode, "dijitTreeLabelFocused");	
		}
	},

	_onFocus: function(){
		// summary:
		//		If we were previously on the tree, there's a currently "focused" node
		//		already.  Just need to set the CSS back so it looks focused.
		if(this.lastFocused){
			var labelNode = this.lastFocused.labelNode;
			dojo.addClass(labelNode, "dijitTreeLabelFocused");			
		}
	},

	//////////////// Events from data store //////////////////////////


	_onNewItem: function(/*Object*/ item, parentInfo){
		//summary: callback when new item has been added to the store.

		var loadNewItem;	// should new item be displayed in tree?

		if (parentInfo){
			var parent = this._itemNodeMap[this.getItemParentIdentity(item, parentInfo)];
			
			// If new item's parent item not in tree view yet, can safely ignore.
			// Also, if a query of specified parent wouldn't return this item, then ignore.
			if(!parent ||
				dojo.indexOf(this.childrenAttr, parentInfo.attribute) == -1){
				return;
			}
		}

		var childParams = {item:item};
		if (parent){
			if (!parent.isExpandable){
				parent.makeExpandable();
			}
			if (parent.state=="LOADED" || parent.isExpanded){
				var childrenMap=parent._addChildren([childParams]);
			}
		}else{
			// top level node
			var childrenMap=this._addChildren([childParams]);		
		}

		if (childrenMap){
			dojo.mixin(this._itemNodeMap, childrenMap);
			//this._itemNodeMap[this.store.getIdentity(item)]=child;
		}
	},

	_onDeleteItem: function(/*Object*/ item){
		//summary: delete event from the store
		//since the object has just been deleted, we need to
		//use the name directly
		var identity = this.store.getIdentity(item);
		var node = this._itemNodeMap[identity];

		if (node){
			var parent = node.getParent();
			parent.deleteNode(node);
			this._itemNodeMap[identity]=null;
		}
	},

	_onSetItem: function(/*Object*/ item){
		//summary: set data event  on an item in the store
		var identity = this.store.getIdentity(item),
		node = this._itemNodeMap[identity];

		if (node){
			node.setLabelNode(this.getLabel(item));
		}
	}
});
