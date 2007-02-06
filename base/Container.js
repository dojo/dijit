dojo.provide("dijit.base.Container");

dojo.require("dojo.dom");

dojo.require("dijit.util.manager");

dojo.declare("dijit.base.Contained", 
	null,
	{
		// summary
		//		Mixin for widgets that are children of a container widget

		getParent: function(){
			// summary:
			//		returns parent widget
			var parentNode = this.domNode.parentNode;
			if(!parentNode){ return null; }
			var id = parentNode.getAttribute('dojoType');
			return dijit.byId(id);
		}
	}
);

dojo.declare("dijit.base.Container", 
	null,
	{
		// summary
		//		Mixin for widgets that contain a list of children like SplitContainer

		isContainer: true,

		addChild: function(/*Widget*/ widget, /*Integer*/ insertIndex){
			// summary:
			//		Process the given child widget, inserting it's dom node as
			//		a child of our dom node

			if(typeof insertIndex == "undefined"){
				insertIndex = this.children.length;
			}
			var containerNode = this.containerNode || this.domNode;

			dojo.dom.insertAtIndex(widget.domNode, containerNode, insertIndex);
		},

		removeChild: function(/*Widget*/ widget){
			// summary: 
			//		removes the passed widget instance from this widget but does
			//		not destroy it
			dojo.dom.removeNode(widget.domNode);
		},
		
		getChildren: function(){
			// summary:
			//		returns array of children widgets
			var res = [];
			var cn = this.containerNode || this.domNode;
			for(var childNode=dojo.dom.firstElement(cn); childNode; childNode=dojo.dom.nextElement(childNode)){
				var id = childNode.getAttribute('dojoType');
				res.push(dijit.byId(id));
			}
			return res;
		},
		
		getSiblings: function(){
			// summary: gets an array of all children of our parent, including "this"
			var parent = this.getParent();
			if(!parent){ return [this]; }
			return parent.getChildren(); // Array
		},
	 
		getPreviousSibling: function(){
			// summary:
			//		returns null if this is the first child of the parent,
			//		otherwise returns the next sibling to the "left".

			var node = dojo.dom.prevElement(this.domNode);
			if(!node){ return null; }
			var id = node.getAttribute("widgetId");
			return dijit.byId(id);
		},
	 
		getNextSibling: function(){
			// summary:
			//		returns null if this is the last child of the parent,
			//		otherwise returns the next sibling to the "right".
	 
			var node = dojo.dom.nextElement(this.domNode);
			if(!node){ return null; }
			var id = node.getAttribute("widgetId");
			return dijit.byId(id);
		}
	}
);
