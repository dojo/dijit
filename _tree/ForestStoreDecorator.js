dojo.provide("dijit._tree.ForestStoreDecorator");

dojo.declare("dijit._tree.ForestStoreDecorator", null, {
	// summary
	//		Wraps another store, making given set of items appear under an artificial root item.
	//
	// description
	//		This store wraps another store S, making all the items matching the specified query
	//		appear as children of a "root item" in this store. 
	//		If no query is specified then all the items returned by fetch() on the underlying
	//		store become children of the root item.
	//		It allows dijit.Tree to assume a single root item, even if the store
	//		doesn't have one.
	//
	// TODO:
	//		There's some room for reduction here.  A lot of methods just do a pass through,
	//		and the other methods all do a pass through when the item !== this.root.  Should
	//		be able to consolidate that code.
	//
	//		There are also a number of methods that are never used by Tree, and could arguably
	//		be removed.


	// Parameters to constructor

	// rootId: String
	//	ID of root item
	rootId: "",

	// rootLabel: String
	//	Label of root item
	rootLabel: "",

	// childrenAttr: String
	//		name of attribute of root node that holds children
	childrenAttr: "children",

	// store: dojo.data.Store
	//		The underlying store
	store: null,

	// query: String
	//	Specifies the set of children of the root item.
	// example:
	//		{type:'continent'}
	query: null,

	// End of parameters to constructor

	constructor: function(params){
		dojo.mixin(this, params);

		// Make dummy root node unique to this store instance
		this.root = {
			store: this,
			root: true,
			id: params.rootId,
			label: params.rootLabel,
			children: []
		};

		// Make updates to top level elements appear as updates to this.root
		this.connects = [
			dojo.connect(this.store, "onSet", this, "onUnderlyingSet"),
			dojo.connect(this.store, "onNew", this, "onUnderlyingNew"),
			dojo.connect(this.store, "onDelete", this, "onUnderlyingDelete")
		];
	},

	destroy: function(){
		dojo.forEach(this.connects, dojo.disconnect);
	},

	// =======================================================================
	// Identity interface

	getFeatures: function(){
		return this.store.getFeatures();
	},

	getIdentity: function(/* item */ item){
		return (item === this.root) ? item.id : this.store.getIdentity(item);
	},

	getIdentityAttributes: function(/* item */ item){
		return this.store.getIdentityAttributes(item);
	},

	fetchItemByIdentity: function(/* object */ args){
		if( args.identity == this.root.id ){
			// First run the query to load the root children, then return root node
			var _this = this;
			this.store.fetch({
				query: this.query,
				onComplete: function(items){
					_this.root.children = items;
					args.onItem(_this.root);
				},
				onError: function(err){
					throw new Error(_this.id + ": error on fetch of children of root node: " + err);
				}
			});
		}else{
			this.store.fetchItemByIdentity(args);
		}
	},

	// =======================================================================
	// Notification interface

	_requeryTop: function(){
		// reruns the query for the children of the root node,
		// sending out an onSet notification if those children have changed
		var _this = this,
			oldChildren = this.root.children;
		this.store.fetch({
			query: this.query,
			onComplete: function(newChildren){
				_this.root.children = newChildren;

				// If the list of children or the order of children has changed...	
				if(oldChildren.length != newChildren.length ||
					dojo.some(oldChildren, function(item, idx){ return newChildren[idx] != item;})){
					_this.onSet(_this.root, _this.childrenAttr, oldChildren, newChildren);
				}
			}
		});
	},

	onUnderlyingSet: function(/* item */ item, 
					/* attribute-name-string */ attribute, 
					/* object | array */ oldValue,
					/* object | array */ newValue){
		// summary: handles set notification from underlying store.	
		this.onSet(item, attribute, oldValue, newValue);

		//		In theory, any change to any item could mean that
		//		the list (or order) of top level nodes changed.  Do
		//		the safe (but inefficient) thing here, and let user
		//		override to provide more efficient behavior
		this._requeryTop();
	},

	onSet: function(item, attribute, oldValue, newValue){
		// summary: attach point
	},

	onUnderlyingNew: function(/* item */ newItem, /*object?*/ parentInfo){
		// summary: handler for when new nodes appear in the store.

		//		In theory, any new item could be a top level item.
		//		Do the safe but inefficient thing by requerying the top
		//		level items.   User can override this function to do something
		//		more efficient.
		this._requeryTop();

		this.onNew(newItem, parentInfo);
	},
	onNew: function(){
		// summary: attach point for client
	},

	onUnderlyingDelete: function(/* item */ deletedItem){
		// summary: handler for delete notifications from underlying store
		
		// check if this was a child of root, and if so send notification that root's children
		// have changed
		var idx = dojo.indexOf(this.root.children, deletedItem);
		if(idx != -1){
			var oldChildren = [].concat(this.root.children);	// concat() makes a copy() before splice changes it.
			this.root.children.splice(idx, 1);
			this.onSet(this.root, this.childrenAttr, oldChildren, this.root.children);
		}

		this.onDelete(deletedItem);
	},
	onDelete: function(/* item */ deletedItem){
		// summary: attach point for client
	},
	
	// =======================================================================
	// Read interface
	getValue: function(	/* item */ item, 
						/* attribute-name-string */ attribute, 
						/* value? */ defaultValue){
		return	(item === this.root) ?
				( attribute == this.childrenAttr ? this.root.children : defaultValue ) :
				this.store.getValue(item, attribute, defaultValue);
	},

	getValues: function(/* item */ item,
						/* attribute-name-string */ attribute){
		return	(item === this.root) ?
				( attribute == this.childrenAttr ? this.root.children : [] ) :
				this.store.getValues(item, attribute);
	},

	getAttributes: function(/* item */ item){
		return	(item === this.root) ?
				[ this.childrenAttr ] :
				this.store.getAttributes(item);
	},

	hasAttribute: function(	/* item */ item,
							/* attribute-name-string */ attribute){
		return	(item === this.root) ?
				(attribute == this.childrenAttr) :
				this.store.hasAttribute(item, attribute);
	},

	containsValue: function(/* item */ item,
							/* attribute-name-string */ attribute, 
							/* anything */ value){
		return	(item === this.root) ?
				(attribute == this.childrenAttr && dojo.indexOf(this.root.children, value) != -1) :
				this.store.containsValue(item, attribute, value);
	},

	isItem: function(/* anything */ something){
		return something === this.root || this.store.isItem(something);
	},

	isItemLoaded: function(/* anything */ something) {
		return something === this.root || this.store.isItemLoaded(something);
	},

	loadItem: function(/* object */ args){
		if(args.item === this.root){
			args.scope ? args.onItem.call(scope, this.root) : args.onItem(this.root);
		}else{
			this.store.loadItem(args);
		}
	},

	fetch: function(/* Object */ args){
		return this.store.fetch(args);
	},

	close: function(/*dojo.data.api.Request || keywordArgs || null */ request){
		this.store.close(request);
	},

	getLabel: function(/* item */ item){
		return	(item === this.root) ?
				this.root.label :
				this.store.getLabel(item);

	},

	getLabelAttributes: function(/* item */ item){
		return this.store.getLabelAttributes(item);
	},

	// =======================================================================
	// Request interface
	abort: function(){
		this.store.abort();
	},

	// =======================================================================
	// Write interface
	newItem: function(/* Object? */ args, /*Object?*/ parentInfo){
		if(parentInfo && parentInfo.parent===this.root){
			this.onNewRootItem(args);
			return this.store.newItem(args);
		}else{
			return this.store.newItem(args, parentInfo);
		}
	},

	onNewRootItem: function(args){
		// summary:
		//		User can override this method to modify a new element that's being
		//		added to the root of the tree, for example to add a flag like root=true
	},

	deleteItem: function(/* item */ item){
		//	summary:
		//		Deletes an item from the store.
		//		Note that the root element cannot be deleted.
		return this.store.deleteItem(item);
	},

	setValue: function(	/* item */ item, 
						/* string */ attribute,
						/* almost anything */ value){
		throw new Error('Unimplemented API: dojo.data.api.Write.setValue');
	},

	setValues: function(/* item */ item,
						/* string */ attribute, 
						/* array */ values){
		var store = this.store;
		if(item === this.root){
			// If we are adding or removing children of root, call user defined
			// method to modify the items as appropriate
			var map = {};
			dojo.forEach(this.root.children, function(item){
				var id = dojo.toJson(store.getIdentity(item));
				map[id] = true;
			}, this);
			dojo.forEach(values, function(item){
				var id = dojo.toJson(store.getIdentity(item));
				if(map[id]){
					delete map[id];
				}else{
					this.onAddToRoot(item);
				}
			}, this);
			for(var r in map){
			    this.onLeaveRoot(item);
			} 
			this.root.children = values;
		}else{
			store.setValues(item, attribute, values);
		}
	},

	onAddToRoot: function(/* item */ item){
		// summary
		//		Called when item added to root of tree; user must override
		//		to modify the item so that it matches the query for top level items
		// example
		//	|	store.setValue(item, "root", true);
		console.log(this, ": item ", item, " added to root");
	},

	onLeaveRoot: function(/* item */ item){
		// summary
		//		Called when item removed from root of tree; user must override
		//		to modify the item so it doesn't match the query for top level items
		// example
		// 	|	store.unsetAttribute(item, "root");
		console.log(this, ": item ", item, " removed from root");
	},

	unsetAttribute: function(	/* item */ item, 
								/* string */ attribute){
		throw new Error('Unimplemented API: dojo.data.api.Write.clear');
	},

	save: function(/* object */ args){
		return this.store.save(args);
	},

	revert: function(){
		return this.store.revert();
	},

	isDirty: function(/* item? */ item){
		// don't know the answer for the root node so just throw exception
		throw new Error('Unimplemented API: dojo.data.api.Write.isDirty');
	}
});