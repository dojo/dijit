dojo.provide("dijit.Tree");

dojo.require("dojo.fx");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._Container");
dojo.require("dijit._tree.Controller");

dojo.declare(
	"dijit._TreeBase",
	[dijit._Widget, dijit._Templated, dijit._Container, dijit._Contained],
{
	// summary:
	//	Base class for Tree and _TreeNode

	// state: String
	//		dynamic loading-related stuff.
	//		When an empty folder node appears, it is "UNCHECKED" first,
	//		then after dojo.data query it becomes "LOADING" and, finally "LOADED"	
	state: "UNCHECKED",
	locked: false,

	lock: function(){
		// summary: lock this node (and it's descendants) while a delete is taking place?
		this.locked=true;
	},
	unlock: function(){
		if(!this.locked){
			//dojo.debug((new Error()).stack);
			throw new Error(this.declaredClass+" unlock: not locked");
		}
		this.locked=false;
	},

	isLocked: function(){
		// summary: can this node be modified?
		// returns: false if this node or any of it's ancestors are locked
		var node = this;
		while(true){
			if(node.lockLevel){
				return true;
			}
			if(!node.getParent() || node.isTree){
				break;
			}	
			node = node.getParent();	
		}
		return false;
	},

	setChildren: function(/* Object[] */ childrenArray){
		// summary:
		//		Sets the children of this node.
		//		Sets this.isFolder based on whether or not there are children
		// 		Takes array of objects like: {label: ..., type: ... }
		//		See parameters of _TreeNode for details.

		this.destroyDescendants();

		this.state = "LOADED";

		if(childrenArray && childrenArray.length > 0){
			this.isFolder = true;
			if(!this.containerNode){ // maybe this node was unfolderized and still has container
				this.containerNode = this.tree.containerNodeTemplate.cloneNode(true);
				this.domNode.appendChild(this.containerNode);
			}

			// Create _TreeNode widget for each specified tree node
			dojo.forEach(childrenArray, function(childParams){
				var child = new dijit._TreeNode(dojo.mixin({
					tree: this.tree,
					label: this.tree.store.getLabel(childParams.item)
				}, childParams));
				this.addChild(child);
			}, this);

			// note that updateLayout() needs to be called on each child after
			// _all_ the children exist
			dojo.forEach(this.getChildren(), function(child, idx){
				child._updateLayout();

				var message = {
					child: child,
					index: idx,
					parent: this
				};
			});
		}else{
			this.isFolder=false;
		}
		
		if (this.isTree){
			// put first child in tab index if one exists.
			var fc = this.getChildren()[0];
			var tabnode = (fc) ? fc.labelNode : this.domNode; 
			tabnode.setAttribute("tabIndex", "0");
		}
	}
});

dojo.declare(
	"dijit.Tree",
	dijit._TreeBase,
{
	// summary
	//	Tree view does all the drawing, visual node management etc.
	//	Throws events about clicks on it, so someone may catch them and process
	//	Events:
	//		afterTreeCreate,
	//		beforeTreeDestroy,
	//		execute				: for clicking the label, or hitting the enter key when focused on the label,
	//		toggleOpen			: for clicking the expando key (toggles hide/collapse),
	//		previous			: go to previous visible node,
	//		next				: go to next visible node,
	//		zoomIn				: go to child nodes,
	//		zoomOut				: go to parent node

	// store: String||dojo.data.Store
	//	The store to get data to display in the tree
	store: null,

	// query: String
	//	query to get top level node(s) of tree (ex: {type:'continent'})
	query: null,

	// childrenAttr: String
	//		name of attribute that holds children of a tree node
	childrenAttr: "children",

	templatePath: dojo.moduleUrl("dijit", "_tree/Tree.html"),		

	isExpanded: true, // consider this "root node" to be always expanded

	isTree: true,

	_publish: function(/*String*/ topicName, /*Object*/ message){
		// summary:
		//		Publish a message for this widget/topic
		dojo.publish(this.id, [dojo.mixin({tree: this, event: topicName}, message||{})]);
	},

	postMixInProperties: function(){
		this.tree = this;

		// setup table mapping keys to events
		var keyTopicMap = {};
		keyTopicMap[dojo.keys.ENTER]="execute";
		keyTopicMap[dojo.keys.LEFT_ARROW]="zoomOut";
		keyTopicMap[dojo.keys.RIGHT_ARROW]="zoomIn";
		keyTopicMap[dojo.keys.UP_ARROW]="previous";
		keyTopicMap[dojo.keys.DOWN_ARROW]="next";
		keyTopicMap[dojo.keys.HOME]="first";
		keyTopicMap[dojo.keys.END]="last";
		this._keyTopicMap = keyTopicMap;
	},

	postCreate: function(){
		this.containerNode = this.domNode;

		// make template for container node (we will clone this and insert it into
		// any nodes that have children)
		var div = document.createElement('div');
		div.style.display = 'none';
		div.className="TreeContainer";	
		dijit.util.wai.setAttr(div, "waiRole", "role", "presentation");
		this.containerNodeTemplate = div;


		// start the controller, passing in the store
		this._controller = new dijit._tree.DataController(
			{	
				store: this.store,
				treeId: this.id,
				query: this.query,
				childrenAttr: this.childrenAttr
			}
		);

		this._publish("afterTreeCreate");
	},

	destroy: function(){
		// publish destruction event so that any listeners should stop listening
		this._publish("beforeTreeDestroy");

		return dijit._Widget.prototype.destroy.apply(this, arguments);
	},

	toString: function(){
		return "["+this.declaredClass+" ID:"+this.id	+"]"
	},

	_domElement2TreeNode: function(/*DomNode*/ domElement){
		var ret;
		do{
			ret=dijit.util.manager.byNode(domElement);
		}while(!ret && (domElement=domElement.parentNode));
		return ret;
	},

	_onClick: function(/*Event*/ e){
		// summary: translates click events into commands for the controller to process
		var domElement = e.target;

		// find node
        var nodeWidget = this._domElement2TreeNode(domElement);	
		if(!nodeWidget || !nodeWidget.isTreeNode){
			return;
		}

		this._publish(
			(domElement == nodeWidget.expandoNode ||
			 domElement == nodeWidget.expandoNodeText) ? "toggleOpen" : "execute",
			 { node: nodeWidget} );	

		dojo.stopEvent(e);
	},

	_onKeyPress: function(/*Event*/ e){
		// summary: translates key events into commands for the controller to process
		if(!e.keyCode || e.altKey){ return; }
		var nodeWidget = this._domElement2TreeNode(e.target);
		if(!nodeWidget){ return; }

		if(this._keyTopicMap[e.keyCode]){
			this._publish(this._keyTopicMap[e.keyCode], { node: nodeWidget} );	
			dojo.stopEvent(e);
		}
	},

	blurNode: function(){
		// summary
		//	Removes focus from the currently focused node (which must be visible).
		//	Usually not called directly (just call focusNode() on another node instead)
		var node = this.lastFocused;
		if(!node){ return; }
		var labelNode = node.labelNode;
		dojo.removeClass(labelNode, "TreeLabelFocused");
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

	templatePath: dojo.moduleUrl("dijit", "_tree/Node.html"),		

	// type: String
	//		User defined identifier to differentiate nodes, and to control icon used
	//		Example: folder, garbage, inbox, draftsFolder
	//		TODO: set CSS string base on this type
	nodeType: "",

	// item: dojo.data.Item
	//		the dojo.data entry this tree represents
	item: null,	

	isTreeNode: true,

	// label: String
	//		Text of this tree node
	label: "",

	isFolder: null, // set by widget depending on children/args

	isExpanded: false,

	postCreate: function(){
		// set label, escaping special characters
		this.labelNode.innerHTML="";
		this.labelNode.appendChild(document.createTextNode(this.label));
		
		// set expand icon for leaf 	
		this._setExpando();
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

		dojo.removeClass(this.domNode, "TreeIsRoot");
		if(this.getParent()["isTree"]){
			dojo.addClass(this.domNode, 'TreeIsRoot');
		}

		dojo.removeClass(this.domNode, "TreeIsLast");
		if(!this.getNextSibling()){
			dojo.addClass(this.domNode, 'TreeIsLast');	
		}
	},

	_setExpando: function(/*Boolean*/ processing) {
		// summary: set the right image for the expando node

		// apply the appropriate class to the expando node
		var styles = ["TreeExpandoLoading", "TreeExpandoOpened",
			"TreeExpandoClosed", "TreeExpandoLeaf"];
		var idx = processing ? 0 : (this.isFolder ?	(this.isExpanded ? 1 : 2) : 3);
		dojo.forEach(styles,
			function(s){
				dojo.removeClass(this.expandoNode, s);
			}, this
		);
		dojo.addClass(this.expandoNode, styles[idx]);

		// provide a non-image based indicator for images-off mode
		this.expandoNodeText.innerHTML =
			processing ? "*" :
				(this.isFolder ?
					(this.isExpanded ? "&#9660;" : "&#9658;") : "-");
	},	

	setChildren: function(items){
		dijit.Tree.superclass.setChildren.apply(this, arguments);

		// create animations for showing/hiding the children
		this._slideIn = dojo.fx.slideIn({node: this.containerNode, duration: 250});
		dojo.connect(this.slideIn, "onEnd", dojo.hitch(this, "_afterExpand"));
		this._slideOut = dojo.fx.slideOut({node: this.containerNode, duration: 250});
		dojo.connect(this.slideOut, "onEnd", dojo.hitch(this, "_afterCollapse"));
	},

	expand: function(){
        // summary: show my children
		if(this.isExpanded){ return; }

		// cancel in progress collapse operation
		if(this._slideOut.status() == "playing"){
			this._slideOut.stop();
		}

		this.isExpanded = true;
		dijit.util.wai.setAttr(this.labelNode, "waiState", "expanded", "true");
		dijit.util.wai.setAttr(this.containerNode, "waiRole", "role", "group");

		this._setExpando();

		// TODO: use animation that's constant speed of movement, not constant time regardless of height
		this._slideIn.play();
	},

	_afterExpand: function(){
        this.onShow();
 		this._publish("afterExpand", {node: this});		
	},

	collapse: function(){					
		if(!this.isExpanded){ return; }

		// cancel in progress expand operation
		if(this._slideIn.status() == "playing"){
			this._slideIn.stop();
		}

		this.isExpanded = false;
		dijit.util.wai.setAttr(this.labelNode, "waiState", "expanded", "false");
		this._setExpando();

		this._slideOut.play();
	},

	_afterCollapse: function(){
		this.onHide();
		this._publish("afterCollapse", {node: this});
	},

	toString: function(){
		return '['+this.declaredClass+', '+this.label+']';
	}
});
