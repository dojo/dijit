dojo.provide("dijit.Tree");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.base.Container");

dojo.declare(
	"dijit._TreeBase",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Container, dijit.base.Contained],
{
	// summary:
	//	Base class for Tree and _TreeNode

	/*
	 * dynamic loading-related stuff. 
	 * When an empty folder node appears, it is "UNCHECKED" first,
	 * then after dojo.data query it becomes LOADING and, finally LOADED
	 *
	 * tree may be dynamically loaded also
	 */
	loadStates: {
		UNCHECKED: "UNCHECKED",	// may or may not be children
    	LOADING: "LOADING",		// children being loaded
    	LOADED: "LOADED"		// children loaded
	},
	
	state: "UNCHECKED",  // after creation will change to loadStates: "loaded/loading/unchecked"

	expandLevel: 0, // expand to level automatically

	locked: false,

	lock: function() {
		// summary: lock this node (and it's descendants) while a delete is taking place?
		this.locked=true;
	},
	unlock: function() {
		if (!this.locked) {
			//dojo.debug((new Error()).stack);
			dojo.raise(this.widgetType+" unlock: not locked");
		}
		this.locked=false;
	},
		
	isLocked: function() {
		// summary: can this node be modified?
		// returns: false if this node or any of it's ancestors are locked
		var node = this;
		while (true) {
			if (node.lockLevel) {
				return true;
			}
			if (!node.getParent() || node.isTree) {
				break;
			}	
			node = node.getParent();	
		}
		return false;
	},

	setChildren: function(/* Object[] */ childrenArray) {
		// summary:
		//		Sets the children of this node.
		//		Sets this.isFolder based on whether or not there are children
		// 		Takes array of objects like: {label: ..., type: ... }
		//		See parameters of _TreeNode for details.

		this.destroyDescendants();

		this.state = this.loadStates.LOADED;

		if(!childrenArray || childrenArray.length == 0){
			if(this.isTreeNode && this.isFolder){
				this._setLeaf();
			}
			return;
		}

		if (this.isTreeNode && !this.isFolder) {
			this._setFolder();
		}
		if (!this.containerNode) { // maybe this node was unfolderized and still has container
			this.containerNode = this.tree.containerNodeTemplate.cloneNode(true);
			this.domNode.appendChild(this.containerNode);
		}

		// Create _TreeNode widget for each specified tree node
		dojo.lang.forEach(childrenArray, function(childParams){
			var child = new dijit._TreeNode(childParams);
			this.addChild(child);
		});

		// note that updateLayout() needs to be called on each child after
		// all the children exist
		dojo.forEach(this.getChildren(), function(child, idx){
			child._updateLayout();

			var message = {
				child: child,
				index: idx,
				parent: this,
			};
			dojo.event.topic.publish(this.tree.eventNames.afterAddChild, message);
		});
	}
});

dojo.declare(
	"dijit.Tree",
	dijit._TreeBase,
{
	// summary
	//	Tree view does all the drawing, visual node management etc.
	//	Throws events about clicks on it, so someone may catch them and process

	// store: String||dojo.data.Store
	//	The store to get data to display in the tree
	store: null,

	templatePath: dojo.uri.moduleUri("dijit", "_tree/Tree.html"),		

	isExpanded: true, // consider this "root node" to be always expanded

	isTree: true,

	// TODO: create Controller automatically
	
	postMixInProperties: function(){
		this.tree = this;

		// generate topic names for all events on widget
		this.eventNames = {};
		for(var name in this._baseEventNames){
			this.eventNames[name] = this.widgetId+"/"+this._baseEventNames[name];
		}

		for(var i=0; i<this.actionsDisabled.length; i++){
			this.actionsDisabled[i] = this.actionsDisabled[i].toUpperCase();
		}
		// TODO: start the controller, passing in the store
	},
	
	postCreate: function(){
		this.containerNode = this.domNode;

		// Find images to use for expando icon
		// Will set this.expandoOpenImg = "expando_open.gif" etc.
		dojo.lang.forEach(["expandoOpen", "expandoClosed", "expandoLeaf", "expandoProcessing"],
			function(item){
				var bi = dojo.html.getComputedStyle(this[item], "background-image");
				var href = bi.charAt(4)=='"' ? bi.slice(5,-2) : bi.slice(4,-1);	// url(foo) --> foo, url("foo") --> foo
				this[item+"Img"]=href;
			});

		this._makeContainerNodeTemplate();

		dojo.event.topic.publish(this.eventNames.afterTreeCreate, { source: this } );
	},
	
	_baseEventNames:{
		// tree created.. Perform tree-wide actions if needed
		afterTreeCreate: "afterTreeCreate",
		beforeTreeDestroy: "beforeTreeDestroy",
		/* can't name it "beforeDestroy", because such name causes memleaks in IE */
		beforeNodeDestroy: "beforeNodeDestroy",
		afterChangeTree: "afterChangeTree",

		afterSetFolder: "afterSetFolder",
		afterUnsetFolder: "afterUnsetFolder",		
		afterAddChild: "afterAddChild",
		afterExpand: "afterExpand",
		beforeExpand: "beforeExpand",
		afterSetTitle: "afterSetTitle",		
		afterCollapse: "afterCollapse",	
		beforeCollapse: "beforeCollapse",
		afterNavigate: "afterNavigate",

		// Keyboard and mouse actions	
		execute: "execute",		// for clicking the label, or hitting the enter key when focused on the label
		toggleOpen: "toggleOpen",// for clicking the expando key (toggles hide/collapse)
		previous: "previous",	// go to previous visible node
		next: "next",			// go to next visible node
		zoomIn: "zoomIn",		// go to child nodes
		zoomOut: "zoomOut",		// go to parent node
	},

	destroy: function(){
		// publish destruction event so that any listeners should stop listening
		dojo.event.topic.publish(this.tree.eventNames.beforeTreeDestroy, { source: this } );

		return dojo.widget.HtmlWidget.prototype.destroy.apply(this, arguments);
	},
	
	toString: function(){
		return "["+this.widgetType+" ID:"+this.id	+"]"
	},
	
	_makeContainerNodeTemplate: function(){
		var div = document.createElement('div');
		div.style.display = 'none';			
		dojo.html.setClass(div, "TreeContainer");
		dojo.widget.wai.setAttr(div, "waiRole", "role", "presentation");
		this.containerNodeTemplate = div;
	},

	onClick: function(/*Event*/ e){
		// summary: translates click events into commands for the controller to process
		var domElement = e.target;

		// find node
        var node = this.domElement2TreeNode(domElement);		
		if (!node || !node.isTreeNode) {
			return;
		}

		if (domElement == node.expandoNode) {
			dojo.event.topic.publish(
				domElement == node.expandoNode ? this.eventNames.toggleOpen : this.eventNames.execute,
				 { node: actionWidget, event: e} );	
			e.preventDefault();
			e.stopPropogation();
		}
	},
	
	onKey: function(/*Event*/ e) { 
		// summary: translates key events into commands for the controller to process
		if (!e.keyCode || e.altKey) { return; }
		var nodeWidget = this.domElement2TreeNode(e.target);
		if (!nodeWidget) { return; }

		var actionWidget = null;

		var keyTopicMap = {};
		keyTopicMap[dojo.keys.ENTER]=this.eventNames.execute;
		keyTopicMap[dojo.keys.LEFT_ARROW]=this.eventNames.zoomOut;
		keyTopicMap[dojo.keys.RIGHT_ARROW]=this.eventNames.zoomIn;
		keyTopicMap[dojo.keys.UP_ARROW]=this.eventNames.previous;
		keyTopicMap[dojo.keys.DOWN_ARROW]=this.eventNames.next;

		if(keyTopicMap[e.keyCode]){
			dojo.event.topic.publish(keyTopicMap[e.keyCode], { node: actionWidget, event: e} );	
			e.stopPropogation();
			e.preventDefault();
		}
	},
	
	blurNode: function() {	
		// summary
		//	Removes focus from the currently focused node (which must be visible).
		//	Usually not called directly (just call focusNode() on another node instead)
		var node = this.lastFocused;
		if(!node){ return; }
		var labelNode = node.labelNode;
		dojo.html.removeClass(labelNode, "TreeLabelFocused");
		labelNode.setAttribute("tabIndex", "-1");
		this.lastFocused = null;
	},
	
	// TODO:
	//	make sure that if a node is deleted tabIndex goes to another node, and also that
	//	if you programatically create a tree with no data, when the first row is added
	//	tabIndex will go to that node
	
	focusNode: function(/* _tree.Node */ node) {
		// summary
		//	Focus on the specified node (which must be visible)

		this.blurNode();

		// set tabIndex so that the tab key can find this node
		var labelNode = node.labelNode;
		labelNode.setAttribute("tabIndex", "0");
		node.tree.lastFocused = node;
	
		dojo.addClass(labelNode, "TreeLabelFocused");

		// set focus so that the label wil be voiced using screen readers
		labelNode.focus();
	}
});

dojo.declare(
	"dijit._TreeNode",
	dijit._TreeBase,
{
	// summary
	//		Single node within a tree

	// actions: Objects
	//		List of basic actions one can perform on nodes and, some(addchild) on trees
	//		TODO: remove?  we have item pointer
	actions: ["move", "detach", "edit", "addchild", "select"],

    // type: String
    //		User defined identifier to differentiate nodes, and to control icon used
    //		Example: folder, garbage, inbox, draftsFolder
    //		TODO: set CSS string base on this type
	nodeType: "",
	
	// item: dojo.data.Item
	//		the dojo.data entry this tree represents
	item: null,	
			
	isTreeNode: true,

	// title: String
	//		HTML for the text of this tree node
	title: "",

	isFolder: null, // set by widget depending on children/args

	isExpanded: false,
	
	postMixInProperties: function(){
	},

	postCreate: function() {
		this.labelNode.innerHTML = this.title;				
		if (this.children.length || this.isFolder) {
			this.setFolder();		// calls _setExpando()	
		} else {
			// set expand icon for leaf 	
			this._setExpando();
		}

		dojo.event.topic.publish(this.tree.eventNames.afterChangeTree, {oldTree:null, newTree:this.tree, node:this} );
	},
	
	markProcessing: function() {
		// summary: visually denote that tree is loading data, etc.
		this._setExpando(true);	
	},

	unmarkProcessing: function() {
		// summary: clear markup from markProcessing() call
		this._setExpando(false);	
	},

	_setFolder: function() {
		// summary:
		//		Mark this node as a folder.
		//		This means that the node *may* have children, but we won't
		//		know for sure until we query the data source for children.

		this.isFolder = true;
		dijit.util.wai.setAttr(this.labelNode, "waiState", "expanded", (this.isExpanded ? "true" : "false") );
		this._setExpando();
		dojo.event.topic.publish(this.tree.eventNames.afterSetFolder, { source: this });
	},

	_setLeaf: function() {
		// summary: Mark a node as a leaf, implying that there are no children
		this.isFolder = false;
		this._setExpando();		
		dojo.event.topic.publish(this.tree.eventNames.afterUnsetFolder, { source: this });
	},
	
	_updateLayout: function() {
		// summary: set appropriate CSS classes for this.domNode

		dojo.removeClass(this.domNode, "TreeIsRoot");
		if (this.getParent()["isTree"]) {
			// use setClass, not addClass for speed
			dojo.setClass(this.domNode, dojo.getClass(this.domNode) + ' '+'TreeIsRoot')
		}

		dojo.removeClass(this.domNode, "TreeIsLast");
		if (this.isLastChild()) {
			dojo.setClass(this.domNode, dojo.getClass(this.domNode) + ' '+'TreeIsLast')			
		}
	},
		
	_setExpando: function(/*Boolean*/ processing) {
		// summary: set the right image for the expando node
		var src = this.tree [ 
			processing ? "expandoProcssingSrc" :
				(this.isFolder ?
					(this.isExpanded ? "expandoOpenedSrc" : "expandoClosedSrc") : "expandoLeafSrc" ) ];
		this.expandoNode.src = src;
	},	

	destroy: function() {
		// publish destruction event so that controller may unregister/unlisten
		dojo.event.topic.publish(this.tree.eventNames.beforeNodeDestroy, { source: this } );		
		return dojo.widget.HtmlWidget.prototype.destroy.apply(this, arguments);
	},
	
	expand: function(){
        // summary: show my children
		if (this.isExpanded) return;

		dijit.util.wai.setAttr(this.labelNode, "waiState", "expanded", "true");
		dijit.util.wai.setAttr(this.containerNode, "waiRole", "role", "group");
		
		this._setExpando();

		/**
		 * no matter if I have children or not. need to show/hide container anyway.
		 * use case: empty folder is expanded => then child is added, container already shown all fine
		 */
		// TODO
		this.tree.toggleObj.show(
			this.containerNode, this.tree.toggleDuration, this.explodeSrc, dojo.lang.hitch(this, "_afterExpand")
		);
        
	},

	_afterExpand: function() {
        this.onShow();
 		dojo.event.topic.publish(this.tree.eventNames.afterExpand, {source: this} );		
	},

	collapse: function(){					
		if (!this.isExpanded) return;
		
		this.isExpanded = false;
		dijit.util.wai.setAttr(this.labelNode, "waiState", "expanded", "false");

		// TODO
		this.tree.toggleObj.hide(
			this.containerNode, this.tree.toggleDuration, this.explodeSrc, dojo.lang.hitch(this, "_afterCollapse")
		);
	},
    
	_afterCollapse: function() {
		this._setExpando();
		this.onHide();
		dojo.event.topic.publish(this.tree.eventNames.afterCollapse, {source: this} );
	},

	toString: function() {
		return '['+this.widgetType+', '+this.title+']';
	}
});