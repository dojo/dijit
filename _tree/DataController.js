dojo.provide("dijit._tree.DataController");

dojo.require("dijit._tree.Controller");

dijit.declare(
	"dijit._tree.DataController",
	dijit._tree.Controller,
{
	// store: dojo.data.Store
	//		Reference to store object
	store: null,

	// query: String
	//	query to get top level node(s) of tree
	query: "",

	labelAttr: "label",
	typeAttr: "type",

	onAfterTreeCreate: function(message) {
		// when a tree is created, we query against the store to get the top level nodes
		// in the tree
		var tree = message.tree;
		
		var getValue = this.store.getValue;
		function onComplete(/*dojo.data.Item[]*/ items){
			// TODO: confirm that I don't have to call loadItem() for each item
			var childParams=dojo.map(items,
				function(item){
					return {
						item: item,
						label: getValue(item, this.labelAttr),
						type: getValue(item, this.typeAttr)
						};
				});
			this.tree.setChildren(childParams);
		}
		store.fetch({ query: this.query, onComplete: onComplete });

		dijit._tree.Controller.prototype.onAfterTreeCreate.apply(this, arguments);
	},

	_expand: function(message){
		var store = this.store;
		var node = message.node;	// the _TreeNode being expanded
		var getValue = this.store.getValue;

		if(node.state == "LOADING"){
			return;
		}
		if(node.state == "UNCHECKED"){
			// need to load all the children, and then expand
			var parentItem = node.item;
			var childItems = store.getValues(parentItem, "children");

			// count how many items need to be loaded
			var _waitCount = 0;
			dojo.forEach(childItems, function(item){ if(!store.isLoaded(item)){ _waitCount++; } });

	       	if(_waitCount == 0){
	       		// all items are already loaded.  proceed..
	       		this._onLoadAllItems(node);
	       	}else{
	       		// still waiting for some or all of the items to load
	       		node.markProcessing();

				function onItem(item){
	   				if(--_waitCount == 0){
						// all nodes have been loaded, send them to the tree
						node.unmarkProcessing();
						this._onLoadAllItems(node);
					}
				}
				dojo.forEach(childItems, function(item){
					if(!store.isLoaded(item)){
		       			store.loadItem({item: item, onItem: onItem});
		       		}
		       	});
	       	}
		}
	},

	_onLoadAllItems: function(/*_TreeNode*/ node){
		// sumary: callback when all the children of a given node have been loaded
		// TODO: should this be used when the top level nodes are loaded too?
		var childParams=dojo.map(items, function(item){
			return { item: item, label: getValue(item, this.labelAttr), type: getValue(item, this,typeAttr) };
		}, this);
		node.setChildren(childParams);
		dijit._tree.Controller.prototype._expand.apply(this, arguments);
	},

	_collapse: function(message){
		if(node.state == "LOADING"){
			return;
		}
		dijit._tree.Controller.prototype._expand.apply(this, arguments);
	}

});
