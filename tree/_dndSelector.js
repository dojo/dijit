define("dijit/tree/_dndSelector", ["dojo", "dijit", "dojo/dnd/common", "dijit/tree/_dndContainer"], function(dojo, dijit) {

dojo.declare("dijit.tree._dndSelector",
	dijit.tree._dndContainer,
	{
		// summary:
		//		This is a base class for `dijit.tree.dndSource` , and isn't meant to be used directly.
		//		It's based on `dojo.dnd.Selector`.
		// tags:
		//		protected

		/*=====
		// selection: Hash<String, DomNode>
		//		(id, DomNode) map for every TreeNode that's currently selected.
		//		The DOMNode is the TreeNode.rowNode.
		selection: {},
		=====*/

		constructor: function(tree, params){
			// summary:
			//		Initialization
			// tags:
			//		private

			this.selection={};
			this.anchor = null;

			this.events.push(
				dojo.connect(this.tree.domNode, "onmousedown", this,"onMouseDown"),
				dojo.connect(this.tree.domNode, "onmouseup", this,"onMouseUp"),
				dojo.connect(this.tree.domNode, "onmousemove", this,"onMouseMove")
			);
		},

		//	singular: Boolean
		//		Allows selection of only one element, if true.
		//		Tree hasn't been tested in singular=true mode, unclear if it works.
		singular: false,

		// methods
		getSelectedTreeNodes: function(){
			// summary:
			//		Returns a list of selected node(s).
			//		Used by dndSource on the start of a drag.
			// tags:
			//		protected
			var nodes=[], sel = this.selection;
			for(var i in sel){
				nodes.push(sel[i]);
			}
			return nodes;
		},

		selectNone: function(){
			// summary:
			//		Unselects all items
			// tags:
			//		private
			var sel = this.selection;
			for(var i in sel){
				this.removeTreeNode(sel[i]);
			}
			return this;	// self
		},

		destroy: function(){
			// summary:
			//		Prepares the object to be garbage-collected
			this.inherited(arguments);
			this.selection = this.anchor = null;
		},
		addTreeNode: function(/*dijit._TreeNode*/node, /*Boolean?*/isAnchor){
			// summary
			//		add node to current selection
			// node: Node
			//		node to add
			// isAnchor: Boolean
			//		Whether the node should become anchor.

			if(isAnchor){
				if(this.anchor == node){
					return node;
				}
				this.anchor = node;
			}

			this._addItemClass(node.rowNode, "Selected");
			this.selection[node.id] = node;
			return node;
		},
		removeTreeNode: function(/*dijit._TreeNode*/node){
			// summary
			//		remove node from current selection
			// node: Node
			//		node to remove

			this._removeItemClass(node.rowNode, "Selected");
			if(this.anchor == node){
				delete this.anchor;
			}
			delete this.selection[node.id];
			return node;
		},
		isTreeNodeSelected: function(/*dijit._TreeNode*/node){
			// summary
			//		return true if node is currently selected
			// node: Node
			//		the node to check whether it's in the current selection

			return node.id && !!this.selection[node.id];
		},
		// mouse events
		onMouseDown: function(e){
			// summary:
			//		Event processor for onmousedown
			// e: Event
			//		mouse event
			// tags:
			//		protected

			// ignore click on expando node
			if(!this.current || this.tree.isExpandoNode( e.target, this.current)){ return; }

			if(e.button == dojo.mouseButtons.RIGHT){ return; }	// ignore right-click

			dojo.stopEvent(e);

			var treeNode = this.current,
			  copy = dojo.isCopyKey(e), id = treeNode.id;

			// if shift key is not pressed, and the node is already in the selection,
			// delay deselection until onmouseup so in the case of DND, deselection
			// will be canceled by onmousemove.
			if(!this.singular && !e.shiftKey && this.selection[id]){
				this._doDeselect = true;
				return;
			}else{
				this._doDeselect = false;
			}
			
			if(this.singular){
				if(this.anchor == treeNode){
					if(dojo.isCopyKey(e)){
						this.selectNone();
					}
				}else{
					this.selectNone();
					this.addTreeNode(treeNode, true);
					}
				}else{
				if(e.shiftKey && this.anchor){
					var cr = dijit.tree._compareNodes(this.anchor.rowNode, treeNode.rowNode), 
					  begin, end, anchor = this.anchor;
					
					if(cr){ //anchor is not the same as current
						if(cr < 0){ //current is after anchor
							begin = anchor;
							end = treeNode;
						}else{ //current is before anchor
							begin = treeNode;
							end = anchor;
								}

						this.selectNone();

						//add everything betweeen begin and end inclusively
						while(begin){
							this.addTreeNode(begin, begin === anchor);
							if(begin === end){
								break;
							}
							begin = this.tree._getNextNode(begin);
						}
					} //else the anchor is the same as current, do nothing
					}else{
					if(!copy){
							this.selectNone();
					}

					this.addTreeNode(treeNode, true);
				}
			}
		},

		onMouseUp: function(e){
			// summary:
			//		Event processor for onmouseup
			// e: Event
			//		mouse event
			// tags:
			//		protected

			// _doDeselect is the flag to indicate that the user wants to either ctrl+click on
			// a already selected item (to deselect the item), or click on a not-yet selected item
			// (which should remove all current selection, and add the clicked item). This can not
			// be done in onMouseDown, because the user may start a drag after mousedown. By moving
			// the deselection logic here, the user can drags an already selected item.
			if(!this._doDeselect){ return; }
			this._doDeselect = false;
			if(dojo.isCopyKey(e)){
				this.removeTreeNode(this.current);
			}else{
			this.selectNone();
			if(this.current){
					this.addTreeNode(this.current, true);
				}
			}
		},
		onMouseMove: function(e){
			// summary
			//		event processor for onmousemove
			// e: Event
			//		mouse event
			this._doDeselect = false;
		},
		forInSelectedItems: function(/*Function*/ f, /*Object?*/ o){
			// summary:
			//		Iterates over selected items;
			//		see `dojo.dnd.Container.forInItems()` for details
			o = o || dojo.global;
			for(var id in this.selection){
				// console.log("selected item id: " + id);
				f.call(o, this.getItem(id), id, this);
			}
		}
});


return dijit.tree._dndSelector;
});
