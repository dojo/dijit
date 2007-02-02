dojo.provide("dijit.util.parser");

dojo.require("dojo.lang.type");
dojo.require("dijit.util.manager");
dojo.require("dojo.dom");

// TODO:
// - call something after all the other widgets have been created

dijit.util.parser = new function(){

	function val2type(/*Object*/ value){
		// summary:
		//	Returns name of type of given value.
		//	Like dojo.lang.getType() but more types.

		if(dojo.lang.isString(value)){ return "string"; }
		if(dojo.lang.isNumber(value)){ return "number"; }
		if(dojo.lang.isBoolean(value)){ return "boolean"; }
		if(dojo.lang.isFunction(value)){ return "function"; }
		if(dojo.lang.isArray(value)){ return "array"; } // typeof [] == "object"
		if (value instanceof Date) { return "date"; } // assume timestamp
		if (value instanceof dojo.uri.Uri){ return "uri"; }
		return "object";
	};

	function str2obj(/*String*/ value, /*String*/ type){
		// summary
		//	Convert given string value to given type
		switch(type){
			case "string":
			default:
				return value;
			case "number":
				return new Number(value);
			case "boolean":
				return (value.toLowerCase()=="false") ? false : true;
			case "function":
				if(value.search(/[^\w\.]+/i) == -1){
					return dojo.evalObjPath(value, false);
				}else{
					try{
						// TODO: "this" here won't work
						return dojo.lang.nameAnonFunc(new Function(value), this);
					}catch(e){ return null; }
				}
			case "array":
				return value.split(";");
			case "date":
				return new Date(Number(value));// assume timestamp
			case "uri":
				return dojo.uri.dojoUri(value);
		}
	};

	var widgetClasses = {
		// map from fully qualified name (like "dijit.Button") to structure like
		// { cls: dijit.Button, params: {caption: "string", disabled: "boolean"} }
	};
	
	function getWidgetClassInfo(/*String*/ className){
		// className:
		//	fully qualified name (like "dijit.Button")
		// returns:
		//	structure like
		//	{ constructor: dijit.Button, params: {caption: "string", disabled: "boolean"} }

		if(!widgetClasses[className]){
			// get pointer to widget class
			var cls = dojo.getObject(className);
			var proto = cls.prototype;
	
			// get table of parameter names & types
			var params={};
			for(var name in proto){
				if(name.charAt(0)=="_") { continue; } 	// skip internal properties
				var defVal = proto[name];
				params[name]=val2type(defVal);
			}
			
			widgetClasses[className] = { cls: cls, params: params };
		}
		return widgetClasses[className];
	};

	this.find = function(/*DomNode*/ rootNode){
		// Summary
		//		Search specified node (or root node) recursively for widgets, returning list like
		//		{ node: pointer to dom node, cls: dijit.Button, parameters: {caption: "hello"} }
		//		Searches for dojoType="qualified.class.name"

		rootNode = rootNode || dojo.body();
	
		// Find nodes that are dojo widgets.
		var nodes = [];
		var allNodes = rootNode.all || rootNode.getElementsByTagName("*");
		var i=0, node;
		while (node = allNodes[i++]) {
			var type = node.getAttribute('dojoType');
			if(type){
				var clsInfo = getWidgetClassInfo(type);
				var params = {};
				for(var attrName in clsInfo.params){
					var attrValue = node.getAttribute(attrName);
					if(attrValue){
						var attrType = clsInfo.params[attrName];
						params[attrName] = str2obj(attrValue, attrType);
					}
				}
				nodes.push({node: node, cls: clsInfo.cls, params: params});
			}
		}
		return nodes;
	};
	
	this.instantiate = function(nodes){
		// summary:
		//	Takes array of {node: node_id/ptr to node, params: associative array of widget params}.
		//	Creates said widgets
		dojo.lang.forEach(nodes, function(ptr){
			new ptr.cls(ptr.params, dojo.byId(ptr.node));
		});
	};

	this.parse = function(/*DomNode?*/ rootNode){
		// Summary
		//		Search specified node (or root node) recursively for widgets, and instantiate them
		//		Searches for dojoType="qualified.class.name"
		var list = this.find(rootNode);
		this.instantiate(list);
	};
}();

dojo.addOnLoad(function(){ dijit.util.parser.parse(); });


