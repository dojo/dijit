dojo.provide("dijit.util.parser");

dojo.require("dijit.util.manager");
dojo.require("dojo.date.serial");

dijit.util.parser = new function(){

	function val2type(/*Object*/ value){
		// summary:
		//	Returns name of type of given value.
		//	Like dojo.lang but more types.

		if(dojo.isString(value)){ return "string"; }
		if(typeof value == "number"){ return "number"; }
		if(typeof value == "boolean"){ return "boolean"; }
		if(dojo.isFunction(value)){ return "function"; }
		if(dojo.isArray(value)){ return "array"; } // typeof [] == "object"
		if(value instanceof Date) { return "date"; } // assume timestamp
		if(value instanceof dojo._Url){ return "url"; }
		return "object";
	}

	function str2obj(/*String*/ value, /*String*/ type){
		// summary
		//	Convert given string value to given type
		switch(type){
			case "string":
				return value;
			case "number":
				if(value && value.length > 0){
					return Number(value);
				}
				return null;
			case "boolean":
				return typeof value == "boolean" ? value : !(value.toLowerCase()=="false");
			case "function":
				if(dojo.isFunction(value)){
					return value;
				}
				try{
					if(value.search(/[^\w\.]+/i) != -1){
						// TODO: "this" here won't work
						value = dijit.util.parser._nameAnonFunc(new Function(value), this);
					}
					return dojo.getObject(value, false);
				}catch(e){ return new Function(); }
			case "array":
				return value.split(";");
			case "date":
				var date = null;
				if(value && value.length > 0){
					try{
						date = dojo.date.serial.fromRfc3339(value);
					}catch(e){/*squelch*/}
					if(!(date instanceof Date)){
						try{
							date = new Date(Number(value));// assume timestamp
						}catch(e){/*squelch*/}
					}
				}
				return date;
			case "url":
//PORT FIXME: is value absolute or relative?  Need to join with "/"?
				return dojo.baseUrl + value;
			default:
				try{ eval("var tmp = "+value); return tmp; }
				catch(e){ return value; }
		}
	}

	var widgetClasses = {
		// map from fully qualified name (like "dijit.Button") to structure like
		// { cls: dijit.Button, params: {caption: "string", disabled: "boolean"} }
	};
	
	function getWidgetClassInfo(/*String*/ className){
		// className:
		//	fully qualified name (like "dijit.Button")
		// returns:
		//	structure like
		//	{ cls: dijit.Button, params: {caption: "string", disabled: "boolean"} }

		if(!widgetClasses[className]){
			// get pointer to widget class
			var cls = dojo.getObject(className);
			var proto = cls.prototype;
	
			// get table of parameter names & types
			var params={};
			for(var name in proto){
				if(name.charAt(0)=="_"){ continue; } 	// skip internal properties
				var defVal = proto[name];
				params[name]=val2type(defVal);
			}

			widgetClasses[className] = { cls: cls, params: params };
		}
		return widgetClasses[className];
	}
	
	this.instantiate = function(nodes){
		// summary:
		//	Takes array of nodes, and turns them into widgets
		//	Calls their layout method to allow them to connect with any children		
		var thelist = [];
		dojo.forEach(nodes, function(node){
			if(!node){ return; }
			var type = node.getAttribute('dojoType');
			var clsInfo = getWidgetClassInfo(type);
			var params = {};
			for(var attrName in clsInfo.params){
				var attrValue = node.getAttribute(attrName);
				if(attrValue != null){
					var attrType = clsInfo.params[attrName];
					params[attrName] = str2obj(attrValue, attrType);
				}
			}
			try{
				thelist.push(new clsInfo.cls(params, node));
			}catch(e){
				// add some information to help debugging, typically the class.  This is a really common place to get stuck.
				console.log("dijit.util.parser: Failed to instantiate widget of type: " + type + " reason: " + e);
				throw e;
			}
		});

		// first sort the widgets so that we can do a top-down wiring phase
		thelist.sort(function(a,b){
			// prefer containers to leaf node nodes; keep in document order otherwise
			return b.getParent && !a.getParent;
		});

		// now call layout method on each widget so thay can wire up their children
		dojo.forEach(thelist, function(node){
			if(node && node.layout){ node.layout(); }
		});

	};

	this.parse = function(/*DomNode?*/ rootNode){
		// Summary
		//		Search specified node (or root node) recursively for widgets, and instantiate them
		//		Searches for dojoType="qualified.class.name"
		var list = dojo.query('[dojoType]', rootNode);
		this.instantiate(list);
	};
}();

dojo.addOnLoad(function(){ dijit.util.parser.parse(); });

//PORT belongs in dojo core?
dijit.util.parser._anonCtr = 0;
dijit.util.parser._anon = {}; // why is this property required?
dijit.util.parser._nameAnonFunc = function(/*Function*/anonFuncPtr, /*Object*/thisObj, /*Boolean*/searchForNames){
	// summary:
	//		Creates a reference to anonFuncPtr in thisObj with a completely
	//		unique name. The new name is returned as a String.  If
	//		searchForNames is true, an effort will be made to locate an
	//		existing reference to anonFuncPtr in thisObj, and if one is found,
	//		the existing name will be returned instead. The default is for
	//		searchForNames to be false.
	var isIE = dojo.isIE;
	var jpn = "$joinpoint";
	var nso = (thisObj|| dijit.util.parser._anon);
	if(isIE){
		var cn = anonFuncPtr["__dojoNameCache"];
		if(cn && nso[cn] === anonFuncPtr){
			return anonFuncPtr["__dojoNameCache"];
		}else if(cn){
			// hack to see if we've been event-system mangled
			var tindex = cn.indexOf(jpn);
			if(tindex != -1){
				return cn.substring(0, tindex);
			}
		}
	}
	if( (searchForNames) ||
		((dojo.global["djConfig"])&&(djConfig["slowAnonFuncLookups"] == true)) ){
		for(var x in nso){
			if(nso[x] === anonFuncPtr){
				if(isIE){
					anonFuncPtr["__dojoNameCache"] = x;
					// hack to see if we've been event-system mangled
					var tindex = x.indexOf(jpn);
					if(tindex != -1){
						x = x.substring(0, tindex);
					}
				}
				return x;
			}
		}
	}
	var ret = "__"+dijit.util.parser._anonCtr++;
	while(typeof nso[ret] != "undefined"){
		ret = "__"+dijit.util.parser._anonCtr++;
	}
	nso[ret] = anonFuncPtr;
	return ret; // String
}
