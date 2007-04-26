dojo.provide("dijit.base.Container");

dojo.require("dijit.util.manager");

dojo.declare("dijit.base.Contained",
	null,
	{
		// summary
		//		Mixin for widgets that are children of a container widget

		getParent: function(){
			// summary:
			//		returns parent widget
			for(var p=this.domNode.parentNode; p; p=p.parentNode){
				var widgetId = p.widgetId;
				if(widgetId){
					return dijit.byId(widgetId);
				}
			}
		},

		getSiblings: function(){
			// summary: gets an array of all children of our parent, including "this"
			var container = this.getParent();
			if(!container){ return [this]; }
			return container.getChildren(); // Array
		},

		_getSibling: function(which){
			var node = this.domNode;
			do{
				node = node[which+"Sibling"];
			}while(node && node.nodeType != 1);
			if(!node){ return null; } // null
			var id = node.widgetId;
			return dijit.byId(id);
		},
	 
		getPreviousSibling: function(){
			// summary:
			//		returns null if this is the first child of the parent,
			//		otherwise returns the next element sibling to the "left".

			return _getSibling("previous");
		},
	 
		getNextSibling: function(){
			// summary:
			//		returns null if this is the last child of the parent,
			//		otherwise returns the next element sibling to the "right".
	 
			return _getSibling("next");
		}
	}
);

dojo.declare("dijit.base.Container", 
	null,
	{
		// summary
		//		Mixin for widgets that contain a list of children like SplitContainer

		isContainer: true,

		addChild: function(/*Widget*/ widget, /*int?*/ insertIndex){
			// summary:
			//		Process the given child widget, inserting it's dom node as
			//		a child of our dom node

			var containerNode = this.containerNode || this.domNode;
			if(containerNode === widget){
				return false;  // throw instead?
			}

			if(typeof insertIndex == "undefined"){
				dojo.place(widget.domNode, containerNode);
			}else{
				dojo.place(widget.domNode, containerNode, insertIndex);
			}
//FIXME: does this function have to return a boolean?  only for recursive check?  Should that throw instead?
			return true; // boolean
		},

		removeChild: function(/*Widget*/ widget){
			// summary: 
			//		removes the passed widget instance from this widget but does
			//		not destroy it
//PORT leak?
			var node = widget.domNode;
			node.parentNode.removeChild(node);
		},
		
		_nextElement: function(node){
			do{
				node = node.nextSibling;
			}while(node && node.nodeType != 1);
			return node;
		},

		_firstElement: function(node){
			node = node.firstChild;
			if(node && node.nodeType != 1){
				node = nextElement(node);
			}
			return node;
		},

		getChildren: function(){
			// summary:
			//		returns array of children widgets

			var res = [];
			var cn = this.containerNode || this.domNode;
			var childNode = this._firstElement(cn);
			while(childNode){
				res.push(dijit.byId(childNode.widgetId));
				childNode = this._nextElement(childNode);
			}
			return res;
		},

		hasChildren: function(){
			// summary:
			//		returns true if widget has children
			var cn = this.containerNode || this.domNode;
			return !!this._firstElement(cn);
		}
	}
);
