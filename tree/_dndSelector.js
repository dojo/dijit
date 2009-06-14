dojo.provide("dijit.tree._dndSelector");
dojo.require("dojo.dnd.common");
dojo.require("dijit.tree._dndContainer");

dojo.declare("dijit.tree._dndSelector",
	dijit.tree._dndContainer,
	{
		// summary:
		//		This is a base class for `dijit.tree.dndSource` , and isn't meant to be used directly.
		//		It's based on `dojo.dnd.Selector`.
		// tags:
		//		protected

		constructor: function(tree, params){
			// summary:
			//		Initialization
			// tags:
			//		private

			this.selection={};
			this.anchor = null;
			this.simpleSelection=false;
		
			this.events.push(
				dojo.connect(this.tree.domNode, "onmousedown", this,"onMouseDown"),
				dojo.connect(this.tree.domNode, "onmouseup", this,"onMouseUp")
			);
		},
	
		// singular: [readonly] Boolean
		//		Apparently this is indicates whether a single or multiple elements are
		//		selected, but AFAIK Tree doesn't support multiple selection, so it doesn't
		//		do anything.   (There is, however, a bunch of dead code that would only run
		//		if singular == true)
		singular: false,	// is singular property
	
		// methods

		getSelectedNodes: function(){
			// summary:
			//		Returns the set of selected nodes.
			//		Used by dndSource on the start of a drag.
			// tags:
			//		protected
			return this.selection;
		},

		selectNone: function(){
			// summary:
			//		Unselects all items
			// tags:
			//		private

			return this._removeSelection()._removeAnchor();	// self
		},

		destroy: function(){
			// summary:
			//		Prepares the object to be garbage-collected
			this.inherited(arguments);
			this.selection = this.anchor = null;
		},

		// mouse events
		onMouseDown: function(e){
			// summary:
			//		Event processor for onmousedown
			// e: Event
			//		mouse event
			// tags:
			//		protected
			
			if(!this.current){ return; }

			if(e.button == 2){ return; }	// ignore right-click

			var item = dijit.getEnclosingWidget(this.current).item;
			var id = this.tree.model.getIdentity(item);

			if (!this.current.id) {
				this.current.id=id;
			}

			if (!this.current.type) {
				this.current.type="data";
			}

			if(!this.singular && !dojo.isCopyKey(e) && !e.shiftKey && (this.current.id in this.selection)){
				this.simpleSelection = true;
				dojo.stopEvent(e);
				return;
			}
			if(this.singular){
				if(this.anchor == this.current){
					if(dojo.isCopyKey(e)){
						this.selectNone();
					}
				}else{
					this.selectNone();
					this.anchor = this.current;
					this._addItemClass(this.anchor, "Anchor");

					this.selection[this.current.id] = this.current;
				}
			}else{
				if(!this.singular && e.shiftKey){	
					if (dojo.isCopyKey(e)){
						//TODO add range to selection
					}else{
						//TODO select new range from anchor 
					}
				}else{
					if(dojo.isCopyKey(e)){
						if(this.anchor == this.current){
							delete this.selection[this.anchor.id];
							this._removeAnchor();
						}else{
							if(this.current.id in this.selection){
								this._removeItemClass(this.current, "Selected");
								delete this.selection[this.current.id];
							}else{
								if(this.anchor){
									this._removeItemClass(this.anchor, "Anchor");
									this._addItemClass(this.anchor, "Selected");
								}
								this.anchor = this.current;
								this._addItemClass(this.current, "Anchor");
								this.selection[this.current.id] = this.current;
							}
						}
					}else{
						if(!(id in this.selection)){
							this.selectNone();
							this.anchor = this.current;
							this._addItemClass(this.current, "Anchor");
							this.selection[id] = this.current;
						}
					}
				}
			}

			dojo.stopEvent(e);
		},

		onMouseUp: function(e){
			// summary:
			//		Event processor for onmouseup
			// e: Event
			//		mouse event
			// tags:
			//		protected
			if(!this.simpleSelection){ return; }
			this.simpleSelection = false;
			this.selectNone();
			if(this.current){
				this.anchor = this.current;
				this._addItemClass(this.anchor, "Anchor");
				this.selection[this.current.id] = this.current;
			}
		},
		_removeSelection: function(){
			// summary:
			//		Unselects all items
			// tags:
			//		private
			var e = dojo.dnd._empty;
			for(var i in this.selection){
				if(i in e){ continue; }
				var node = dojo.byId(i);
				if(node){ this._removeItemClass(node, "Selected"); }
			}
			this.selection = {};
			return this;	// self
		},

		_removeAnchor: function(){
			// summary:
			//		Removes the Anchor CSS class from a node.
			//		According to `dojo.dnd.Selector`, anchor means that
			//		"an item is selected, and is an anchor for a 'shift' selection".
			//		It's not relevant for Tree at this point, since we don't support multiple selection.
			// tags:
			//		private
			if(this.anchor){
				this._removeItemClass(this.anchor, "Anchor");
				this.anchor = null;
			}
			return this;	// self
		}
});
