dojo.provide("dijit._tree.dndSource");

dojo.require("dijit._tree.dndSelector");
dojo.require("dojo.dnd.Manager");

/*=====
dijit._tree.__SourceArgs = function(){
	//	summary:
	//		A dict of parameters for Tree source configuration.
	//	isSource: Boolean?
	//		can be used as a DnD source. Defaults to true.
	//	accept: Array?
	//		list of accepted types (text strings) for a target; defaults to
	//		["text"]
	//	copyOnly: Boolean?
	//		copy items, if true, use a state of Ctrl key otherwise,
	//	dragThreshold: Number
	//		the move delay in pixels before detecting a drag; 0 by default
	//  betweenThreshold: Integer
	//		distance from upper/lower edge of node to allow drop to reorder nodes
	this.isSource = isSource;
	this.accept = accept;
	this.autoSync = autoSync;
	this.copyOnly = copyOnly;
	this.dragThreshold = dragThreshold;
	this.betweenThreshold = betweenThreshold;
}
=====*/

dojo.declare("dijit._tree.dndSource", dijit._tree.dndSelector, {
	// summary:
	//		A Source object, which can be used as a DnD source, or a DnD target
	
	// object attributes (for markup)
	isSource: true,
	copyOnly: false,
	skipForm: false,
	dragThreshold: 0,
	accept: ["text"],
	betweenThreshold: 0,
	
	constructor: function(/*dijit.Tree*/ tree, /*dijit._tree.__SourceArgs*/ params){
		// summary:
		//		a constructor of the Tree DnD Source
		if(!params){ params = {}; }
		dojo.mixin(this, params);
		this.isSource = typeof params.isSource == "undefined" ? true : params.isSource;
		var type = params.accept instanceof Array ? params.accept : ["text"];
		this.accept = null;
		if(type.length){
			this.accept = {};
			for(var i = 0; i < type.length; ++i){
				this.accept[type[i]] = 1;
			}
		}

		// class-specific variables
		this.isDragging = false;
		this.mouseDown = false;
		this.targetAnchor = null;
		this.targetBox = null;
		this.dropPosition = "Over";
		this._lastX = 0;
		this._lastY = 0;

		// states
		this.sourceState  = "";
		if(this.isSource){
			dojo.addClass(this.node, "dojoDndSource");
		}
		this.targetState  = "";
		if(this.accept){
			dojo.addClass(this.node, "dojoDndTarget");
		}
		// set up events
		this.topics = [
			dojo.subscribe("/dnd/source/over", this, "onDndSourceOver"),
			dojo.subscribe("/dnd/start",  this, "onDndStart"),
			dojo.subscribe("/dnd/drop",   this, "onDndDrop"),
			dojo.subscribe("/dnd/cancel", this, "onDndCancel")
		];
	},

	startup: function(){
	},
	
	// methods
	checkAcceptance: function(source, nodes){
		// summary:
		//		Checks if the target can accept nodes from this source
		// source: dijit.tree._dndSource
		//		The source which provides items
		// nodes: DOMNode[]
		//		Array of DOM nodes corresponding to nodes being dropped, dijitTreeRow nodes if
		//		source is a dijit.Tree.
		return true;	// Boolean
	},

	copyState: function(keyPressed){
		// summary:
		//		Returns true, if we need to copy items, false to move.
		//		It is separated to be overwritten dynamically, if needed.
		// keyPressed: Boolean
		//		The "copy" control key was pressed
		return this.copyOnly || keyPressed;	// Boolean
	},
	destroy: function(){
		// summary:
		//		Prepares the object to be garbage-collected.
		this.inherited("destroy",arguments);
		dojo.forEach(this.topics, dojo.unsubscribe);
		this.targetAnchor = null;
	},

	// mouse event processors
	onMouseMove: function(e){
		// summary:
		//		Called for any onmousemove events over the Tree
		// e: Event
		//		onmousemouse event
		if(this.isDragging && this.targetState == "Disabled"){ return; }
		this.inherited("onMouseMove", arguments);
		var m = dojo.dnd.manager();
		if(this.isDragging){
			if(this.betweenThreshold > 0){
				// calculate if user is indicating to drop the dragged node before, after, or over
				// (i.e., to become a child of) the target node
				var dropPosition = "Over";
				if(this.current){
					if(!this.targetBox || this.targetAnchor != this.current){
						this.targetBox = {
							xy: dojo.coords(this.current, true),
							w: this.current.offsetWidth,
							h: this.current.offsetHeight
						};
					}
					if((e.pageY - this.targetBox.xy.y) <= this.betweenThreshold){
						dropPosition = "Before";
						// TODO: change style on node, shouldn't have hover effect since we are theoretically between nodes, not over one
					}else if((e.pageY - this.targetBox.xy.y) >= (this.targetBox.h - this.betweenThreshold)){
						dropPosition = "After";
						// TODO: change style on node, shouldn't have hover effect since we are theoretically between nodes, not over one
					}
				}
				if(this.current != this.targetAnchor || dropPosition != this.dropPosition){
					this._markTargetAnchor(dropPosition);
					var n = this._getChildByEvent(e);	// the target TreeNode
					var targetWidget = dijit.getEnclosingWidget(this.current);
					// Check if it's ok to drop the dragged node on/before/after n, the target node.
					if(n && targetWidget == targetWidget.tree.rootNode && this.dropPosition != "Over"){
						m.canDrop(false);
					}else if(n && this.checkItemAcceptance(n, m.source, dropPosition.toLowerCase())){
						m.canDrop(!this.current || m.source != this || !(this.current.id in this.selection));
					}else{
						m.canDrop(false);
					}
				}
			}
		}else{
			if(this.mouseDown && this.isSource &&
			   (Math.abs(e.pageX-this._lastX)>=this.dragThreshold || Math.abs(e.pageY-this._lastY)>=this.dragThreshold)){
				var n = this.getSelectedNodes();
				var nodes=[];
				for (var i in n){
					nodes.push(n[i]);
				}
				if(nodes.length){
					m.startDrag(this, nodes, this.copyState(dojo.dnd.getCopyKeyState(e)));
				}
			}
		}
	},

	onMouseDown: function(e){
		// summary:
		//		Event processor for onmousedown
		// e: Event
		//		onmousedown event
		this.mouseDown = true;
		this.mouseButton = e.button;
		this._lastX = e.pageX;
		this._lastY = e.pageY;
		this.inherited("onMouseDown",arguments);
	},

	onMouseUp: function(e){
		// summary:
		//		Event processor for onmouseup
		// e: Event
		//		onmouseup event
		if(this.mouseDown){
			this.mouseDown = false;
			this.inherited("onMouseUp",arguments);
		}
	},

	onMouseOver: function(e){
		// summary:
		//		Event processor for onmouseover
		// description:
		//		This is called on the onmouseover events for any node inside the tree,
		//		including TreeNode.domNode and nodes inside of TreeNode (dijitTreeContent, etc.)
		// e: Event
		//		mouse event

		// TODO:
		//		Since this method sets the "Over" CSS class for items,
		//		and also since it calls checkItemAcceptance(),
		//		it needs to test for over/after/before state just like the onMouseMove handler.

		// handle when mouse has just moved over the Tree itself (not a TreeNode, but the Tree)
		var rt = e.relatedTarget;	// the previous location
		while(rt){
			if(rt == this.node){ break; }
			try{
				rt = rt.parentNode;
			}catch(x){
				rt = null;
			}
		}
		if(!rt){
			this._changeState("Container", "Over");
			this.onOverEvent();
		}

		// code below is for handling depending on which TreeNode we are over
		var n = this._getChildByEvent(e);	// the target TreeNode
		if(this.current == n){ return; }	// we just touched a node inside of the current TreeNode.  Ignore.
		if(this.current){ this._removeItemClass(this.current, "Over"); }
		var m = dojo.dnd.manager();
		if(n){ 
			this._addItemClass(n, "Over");
			if(this.isDragging){
				if(this.checkItemAcceptance(n, m.source, "over")){
					m.canDrop(this.targetState != "Disabled" && (!this.current || m.source != this || !(n in this.selection)));
				}
			}
		}else{
			if(this.isDragging){
				m.canDrop(false);
			}
		}
		this.current = n;
	},

	checkItemAcceptance: function(target, source, position){
		// summary:
		//		Stub function to be overridden if one wants to check for the ability to drop at the node/item level
		// description:
		//		In the base case, this is called to check if target can become a child of source.
		//		When betweenThreshold is set, position="before" or "after" means that we
		//		are asking if the source node can be dropped before/after the target node.
		// target: DOMNode
		//		The dijitTreeRoot DOM node inside of the TreeNode that we are dropping on to
		//		Use dijit.getEnclosingWidget(target) to get the TreeNode.
		// source: dijit._tree.dndSource
		//		The (set of) nodes we are dropping
		// position: String
		//		"over", "before", or "after"
		return true;	
	},
	
	// topic event processors
	onDndSourceOver: function(source){
		// summary:
		//		Topic event processor for /dnd/source/over, called when detected a current source.
		// source: Object
		//		The dijit.tree._dndSource / dojo.dnd.Source which has the mouse over it
		if(this != source){
			this.mouseDown = false;
			if(this.targetAnchor){
				this._unmarkTargetAnchor();
			}
		}else if(this.isDragging){
			var m = dojo.dnd.manager();
			m.canDrop(false);
		}
	},
	onDndStart: function(source, nodes, copy){
		// summary:
		//		Topic event processor for /dnd/start, called to initiate the DnD operation
		// source: Object
		//		The dijit.tree._dndSource / dojo.dnd.Source which is providing the items
		// nodes: DomNode[]
		//		The list of transferred items, dndTreeNode nodes if dragging from a Tree
		// copy: Boolean
		//		Copy items, if true, move items otherwise

		if(this.isSource){
			this._changeState("Source", this == source ? (copy ? "Copied" : "Moved") : "");
		}
		var accepted = this.checkAcceptance(source, nodes);

		this._changeState("Target", accepted ? "" : "Disabled");

		if(accepted){
			dojo.dnd.manager().overSource(this);
		}

		this.isDragging = true;
	},

	itemCreator: function(nodes){
		return dojo.map(nodes, function(node){
			return {
				"id": node.id,
				"name": node.textContent || node.innerText || ""
			};
		});
	},

	onDndDrop: function(source, nodes, copy){
		// summary:
		//		Topic event processor for /dnd/drop, called to finish the DnD operation.
		// description:
		//		Updates data store items according to where node was dragged from and dropped
		//		to.   The tree will then respond to those data store updates and redraw itself.
		// source: Object
		//		The dijit.tree._dndSource / dojo.dnd.Source which is providing the items
		// nodes: DomNode[]
		//		The list of transferred items, dndTreeNode nodes if dragging from a Tree
		// copy: Boolean
		//		Copy items, if true, move items otherwise

		if(this.containerState == "Over"){
			var tree = this.tree,
				model = tree.model,
				target = this.current,
				requeryRoot = false;	// set to true iff top level items change

			this.isDragging = false;

			// Compute the new parent item
			var targetWidget = dijit.getEnclosingWidget(target);
			var newParentItem;
			var insertIndex;
			newParentItem = (targetWidget && targetWidget.item) || tree.item;
			if(this.dropPosition == "Before" || this.dropPosition == "After"){
				// TODO: if there is no parent item then disallow the drop.
				// Actually this should be checked during onMouseMove too, to make the drag icon red.
				newParentItem = (targetWidget.getParent() && targetWidget.getParent().item) || tree.item;
				// Compute the insert index for reordering
				insertIndex = targetWidget.getIndexInParent();
				if(this.dropPosition == "After"){
					insertIndex = targetWidget.getIndexInParent() + 1;
				}
			}else{
				newParentItem = (targetWidget && targetWidget.item) || tree.item;
			}

			// If we are dragging from another source (or at least, another source
			// that points to a different data store), then we need to make new data
			// store items for each element in nodes[].  This call get the parameters
			// to pass to store.newItem()
			var newItemsParams;
			if(source != this){
				newItemsParams = this.itemCreator(nodes, target);
			}

			dojo.forEach(nodes, function(node, idx){
				if(source == this){
					// This is a node from my own tree, and we are moving it, not copying.
					// Remove item from old parent's children attribute.
					// TODO: dijit._tree.dndSelector should implement deleteSelectedNodes()
					// and this code should go there.
					var childTreeNode = dijit.getEnclosingWidget(node),
						childItem = childTreeNode.item,
						oldParentItem = childTreeNode.getParent().item;

					if(typeof insertIndex == "number"){
						if(newParentItem == oldParentItem && childTreeNode.getIndexInParent() < insertIndex){
							insertIndex -= 1;
						}
					}
					model.pasteItem(childItem, oldParentItem, newParentItem, copy, insertIndex);
				}else{
					model.newItem(newItemsParams[idx], newParentItem);
				}
			}, this);

			// Expand the target node (if it's currently collapsed) so the user can see
			// where their node was dropped.   In particular since that node is still selected.
			this.tree._expandNode(targetWidget);
		}
		this.onDndCancel();
	},
	onDndCancel: function(){
		// summary:
		//		Topic event processor for /dnd/cancel, called to cancel the DnD operation
		if(this.targetAnchor){
			this._unmarkTargetAnchor();
			this.targetAnchor = null;
		}
		this.dropPosition = "Over";
		this.isDragging = false;
		this.mouseDown = false;
		delete this.mouseButton;
		this._changeState("Source", "");
		this._changeState("Target", "");
	},
	
	// utilities

	onOverEvent: function(){
		// summary:
		//		This method is called when mouse is moved over our container (like onmouseenter)
		this.inherited("onOverEvent",arguments);
		dojo.dnd.manager().overSource(this);
	},
	onOutEvent: function(){
		// summary:
		//		This method is called when mouse is moved out of our container (like onmouseleave)
		this.inherited("onOutEvent",arguments);	
		dojo.dnd.manager().outSource(this);
	},
	_markTargetAnchor: function(dropPosition){
		// summary:
		//		Assigns a class to the current target anchor based on "dropPosition" status
		// dropPosition: String
		//		Where the dragged nodes are being dropped: Over, After, or Before
		if(this.current == this.targetAnchor && this.dropPosition == dropPosition){ return; }
		if(this.targetAnchor){
			this._removeItemClass(this.targetAnchor, this.dropPosition);
		}
		this.targetAnchor = this.current;
		this.targetBox = null;
		this.dropPosition = dropPosition;
		if(this.targetAnchor){
			this._addItemClass(this.targetAnchor, this.dropPosition);
		}
	},
	_unmarkTargetAnchor: function(){
		// summary:
		//		Removes a class of the current target anchor based on "dropPosition" status
		if(!this.targetAnchor){ return; }
		this._removeItemClass(this.targetAnchor, this.dropPosition);
		this.targetAnchor = null;
		this.targetBox = null;
		this.dropPosition = "Over";
	},
	_markDndStatus: function(copy){
		// summary:
		//		Changes source's state based on "copy" status
		this._changeState("Source", copy ? "Copied" : "Moved");
	}
});
dojo.declare("dijit._tree.dndTarget", dijit._tree.dndSource, {
	// summary:
	//		A Target object, which can be used as a DnD target
	// TODO: dijit._tree.dndSource can also be used as a DnD target,
	// so this class doesn't seem useful.
	
	constructor: function(node, params){
		// summary:
		//		A constructor of the Target --- see the Source constructor for details
		this.isSource = false;
		dojo.removeClass(this.node, "dojoDndSource");
	}
});
