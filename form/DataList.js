define([
  "dojo",
  "..",
  "../_WidgetBase",
  "dojo/data/util/simpleFetch",
  "dojo/data/util/filter"], function(dojo, dijit) {
	//  module:
	//    dijit/form/DataList
	//  summary:
	//		TODOC
	// 


dojo.declare("dijit.form.DataList", null, {
	// summary:
	//		Inefficient but small data store specialized for inlined data via OPTION tags
	//
	// description:
	//		Provides a store for inlined data like:
	//
	//	|	<datalist>
	//	|		<option value="AL">Alabama</option>
	//	|		...
	//
	//		Actually. just implements the subset of dojo.data.Read/Notification
	//		needed for ComboBox and FilteringSelect to work.
	//
	//		Note that an item is just a pointer to the <option> DomNode.

	postscript: function(/*Object?*/params, /*DomNode|String*/srcNodeRef){
		// store pointer to original DOM tree
		this.domNode = dojo.byId(srcNodeRef);

		dojo._mixin(this, params);
		if(this.id){
			dijit.registry.add(this); // add to registry so it can be easily found by id
		}
		this.domNode.style.display = "none";
	},

	destroy: function(){
		dijit.registry.remove(this.id);
	},

	getValue: function(	/*item*/ item,
				/*attribute-name-string*/ attribute,
				/*value?*/ defaultValue){
		return (attribute == "value") ? item.value : (item.innerText || item.textContent || '');
	},

	isItemLoaded: function(/*anything*/ something){
		return true;
	},

	getFeatures: function(){
		return {"dojo.data.api.Read": true, "dojo.data.api.Identity": true};
	},

	_fetchItems: function(	/*Object*/ args,
				/*Function*/ findCallback,
				/*Function*/ errorCallback){
		// summary:
		//		See dojo.data.util.simpleFetch.fetch()
		if(!args.query){ args.query = {}; }
		if(!args.query.name){ args.query.name = ""; }
		if(!args.queryOptions){ args.queryOptions = {}; }
		var matcher = dojo.data.util.filter.patternToRegExp(args.query.name, args.queryOptions.ignoreCase),
			items = dojo.query("option", this.domNode).filter(function(option){
				return (dojo.trim(option.innerText || option.textContent || '')).match(matcher);
			} );
		if(args.sort){
			items.sort(dojo.data.util.sorter.createSortFunction(args.sort, this));
		}
		findCallback(items, args);
	},

	close: function(/*dojo.data.api.Request || args || null*/ request){
		return;
	},

	getLabel: function(/*item*/ item){
		return dojo.trim(item.innerHTML);
	},

	getIdentity: function(/*item*/ item){
		return dojo.attr(item, "value");
	},

	fetchItemByIdentity: function(/*Object*/ args){
		// summary:
		//		Given the identity of an item, this method returns the item that has
		//		that identity through the onItem callback.
		//		Refer to dojo.data.api.Identity.fetchItemByIdentity() for more details.
		//
		// description:
		//		Given arguments like:
		//
		//	|		{identity: "CA", onItem: function(item){...}
		//
		//		Call `onItem()` with the DOM node `<option value="CA">California</option>`
		var item = dojo.query("option[value='" + args.identity + "']", this.domNode)[0];
		args.onItem(item);
	},

	fetchSelectedItem: function(){
		// summary:
		//		Get the option marked as selected, like `<option selected>`.
		//		Not part of dojo.data API.
		return dojo.query("> option[selected]", this.domNode)[0] || dojo.query("> option", this.domNode)[0];
	}
});
//Mix in the simple fetch implementation to this class.
dojo.extend(dijit.form.DataList,dojo.data.util.simpleFetch);


return dijit.form.DataList;
});
