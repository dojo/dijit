define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/connect", // connect.connect connect.disconnect
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add domClass.remove domClass.replace
	"dojo/_base/lang" // lang.getObject lang.mixin
], function(array, connect, declare, domClass, lang){

	// module:
	//		dijit/tree/_dndContainer
	// summary:
	//		This is a base class for `dijit.tree._dndSelector`, and isn't meant to be used directly.
	//		It's modeled after `dojo.dnd.Container`.

	return declare("dijit.tree._dndContainer", null, {

		// summary:
		//		This is a base class for `dijit.tree._dndSelector`, and isn't meant to be used directly.
		//		It's modeled after `dojo.dnd.Container`.
		// tags:
		//		protected

		/*=====
		// current: DomNode
		//		The currently hovered TreeNode.rowNode (which is the DOM node
		//		associated w/a given node in the tree, excluding it's descendants)
		current: null,
		=====*/

		constructor: function(tree, params){
			// summary:
			//		A constructor of the Container
			// tree: Node
			//		Node or node's id to build the container on
			// params: dijit.tree.__SourceArgs
			//		A dict of parameters, which gets mixed into the object
			// tags:
			//		private
			this.tree = tree;
			this.node = tree.domNode;	// TODO: rename; it's not a TreeNode but the whole Tree
			lang.mixin(this, params);

			// class-specific variables
			this.map = {};
			this.current = null;	// current TreeNode's DOM node

			// states
			this.containerState = "";
			domClass.add(this.node, "dojoDndContainer");

			// set up events
			this.events = [
				// container level events
				connect.connect(this.node, "onmouseenter", this, "onOverEvent"),
				connect.connect(this.node, "onmouseleave",	this, "onOutEvent"),

				// switching between TreeNodes
				connect.connect(this.tree, "_onNodeMouseEnter", this, "onMouseOver"),
				connect.connect(this.tree, "_onNodeMouseLeave", this, "onMouseOut"),

				// cancel text selection and text dragging
				connect.connect(this.node, "ondragstart", dojo, "stopEvent"),
				connect.connect(this.node, "onselectstart", dojo, "stopEvent")
			];
		},

		getItem: function(/*String*/ key){
			// summary:
			//		Returns the dojo.dnd.Item (representing a dragged node) by it's key (id).
			//		Called by dojo.dnd.Source.checkAcceptance().
			// tags:
			//		protected

			var widget = this.selection[key];
			return {
				data: widget,
				type: ["treeNode"]
			}; // dojo.dnd.Item
		},

		destroy: function(){
			// summary:
			//		Prepares this object to be garbage-collected

			array.forEach(this.events, connect.disconnect);
			// this.clearItems();
			this.node = this.parent = null;
		},

		// mouse events
		onMouseOver: function(widget /*===== , evt =====*/){
			// summary:
			//		Called when mouse is moved over a TreeNode
			// widget: TreeNode
			// evt: Event
			// tags:
			//		protected
			this.current = widget;
		},

		onMouseOut: function(/*===== widget, evt =====*/){
			// summary:
			//		Called when mouse is moved away from a TreeNode
			// widget: TreeNode
			// evt: Event
			// tags:
			//		protected
			this.current = null;
		},

		_changeState: function(type, newState){
			// summary:
			//		Changes a named state to new state value
			// type: String
			//		A name of the state to change
			// newState: String
			//		new state
			var prefix = "dojoDnd" + type;
			var state = type.toLowerCase() + "State";
			//domClass.replace(this.node, prefix + newState, prefix + this[state]);
			domClass.replace(this.node, prefix + newState, prefix + this[state]);
			this[state] = newState;
		},

		_addItemClass: function(node, type){
			// summary:
			//		Adds a class with prefix "dojoDndItem"
			// node: Node
			//		A node
			// type: String
			//		A variable suffix for a class name
			domClass.add(node, "dojoDndItem" + type);
		},

		_removeItemClass: function(node, type){
			// summary:
			//		Removes a class with prefix "dojoDndItem"
			// node: Node
			//		A node
			// type: String
			//		A variable suffix for a class name
			domClass.remove(node, "dojoDndItem" + type);
		},

		onOverEvent: function(){
			// summary:
			//		This function is called once, when mouse is over our container
			// tags:
			//		protected
			this._changeState("Container", "Over");
		},

		onOutEvent: function(){
			// summary:
			//		This function is called once, when mouse is out of our container
			// tags:
			//		protected
			this._changeState("Container", "");
		}
	});
});
