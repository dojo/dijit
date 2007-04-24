// derived from DomWidget.js

dojo.provide("dijit.base.TemplatedWidget");

dojo.require("dijit.util.wai");

dojo.declare("dijit.base.TemplatedWidget", 
	null,
	{
		// summary:
		//		mixin for widgets that are instantiated from a template
			 
		// templateNode: DomNode
		//		a node that represents the widget template. Pre-empts both templateString and templatePath.
		templateNode: null,

		// templateString String:
		//		a string that represents the widget template. Pre-empts the
		//		templatePath. In builds that have their strings "interned", the
		//		templatePath is converted to an inline templateString, thereby
		//		preventing a synchronous network call.
		templateString: null,

		// templatePath: String
		//	Path to template (HTML file) for this widget
		templatePath: null,

		// widgetsInTemplate Boolean:
		//		should we parse the template to find widgets that might be
		//		declared in markup inside it? false by default.
		// TODO: unsupported; need to copy over code from trunk
		widgetsInTemplate: false,
		
		// containerNode DomNode:
		//		holds child elements. "containerNode" is generally set via a
		//		dojoAttachPoint assignment and it designates where children of
		//		the src dom node will be placed
		containerNode: null,

		// method over-ride
		buildRendering: function(){
			// summary:
			//		Construct the UI for this widget from a template.
			// description:
			// Lookup cached version of template, and download to cache if it
			// isn't there already.  Returns either a DomNode or a string, depending on
			// whether or not the template contains ${foo} replacement parameters.

			var cached = dijit.base.getCachedTemplate(this.templatePath, this.templateString);

//PORT: from dojo.dom.  promote this?  reduce?
			var isNode = function(/* object */wh){
				//	summary:
				//		checks to see if wh is actually a node.
				if(typeof Element == "function"){
					return wh instanceof Element;	//	boolean
				}else{
					// best-guess
					return wh && !isNaN(wh.nodeType);	//	boolean
				}
			};

			var node;
			if(isNode(cached)){
				// if it's a node, all we have to do is clone it
				node = cached.cloneNode(true);
			}else{
				// construct table for property replacement
				var hash = this.strings || {};
				for(var key in dijit.base.defaultStrings){
					if(typeof hash[key] == "undefined"){
						hash[key] = dijit.base.defaultStrings[key];
					}
				}

				// Cache contains a string because we need to do property replacement
				var tstr = cached;

				// do the property replacement
				var _this = this;
				tstr = tstr.replace(/\$\{([^\}]+)\}/g, function(match, key){
				//TODO: use dojo.string.substitute
					var value = (key.substring(0, 5) == "this.") ? dojo.getObject(key.substring(5), false, _this) : hash[key];
					if(value){
						// Safer substitution, see heading "Attribute values" in  
						// http://www.w3.org/TR/REC-html40/appendix/notes.html#h-B.3.2
						return value.toString().replace(/"/g,"&quot;");
					}
				});

				node = dijit.base._createNodesFromText(tstr)[0];
			}

			// recurse through the node, looking for, and attaching to, our
			// attachment points which should be defined on the template node.
			// dojo.profile.start("attachTemplateNodes");
			dijit.base.attachTemplateNodes(node, this);
			// dojo.profile.end("attachTemplateNodes");

			if(this.srcNodeRef){
				dojo.style(node, "cssText", this.srcNodeRef.style.cssText); // will fail on Opera?
				node.className += " " + this.srcNodeRef.className;
			}

			this.domNode = node;

			// relocate source contents to templated container node
			// this.containerNode must be able to receive children, or exceptions will be thrown
			if(this.srcNodeRef && this.srcNodeRef.hasChildNodes()){
				var dest = this.containerNode||this.domNode;
				while(this.srcNodeRef.hasChildNodes()){
					dest.appendChild(this.srcNodeRef.firstChild);
				}
			}

			if(this.srcNodeRef && this.srcNodeRef.parentNode){
				this.srcNodeRef.parentNode.replaceChild(this.domNode, this.srcNodeRef);
			}
		},

		// helper classes needed by most TemplatedWidgets.  Move to a util class?
		_addClass: function(/*HTMLElement*/ node, /*String*/ classStr){
			// summary
			//	adds classStr to node iff it isn't already there
			if(!(new RegExp('(^|\\s+)'+classStr+'(\\s+|$)')).test(node.className)){
				node.className += " "+classStr;
			}
		},

		_removeClass: function(/*HTMLElement*/ node, /*String*/ classStr){
			// summary
			//	removes classStr from node if it is present

		//PERF: compare with plain string replace
			node.className = node.className.replace(new RegExp('(^|\\s+)'+classStr+'(\\s+|$)'), "$1$2");
		}
	}
);

dijit.base.defaultStrings = {
	// summary: a mapping of strings that are used in template variable replacement
	dojoRoot: dojo.baseUrl,
	dojoModuleUri: dojo.moduleUrl("dojo"),
	dijitModuleUri: dojo.moduleUrl("dijit"),	
	baseScriptUri: dojo.baseUrl
};

// key is either templatePath or templateString; object is either string or DOM tree
dijit.base._templateCache = {};

dijit.base.getCachedTemplate = function(templatePath, templateString){
	// summary:
	//		static method to get a template based on the templatePath or
	//		templateString key
	// templatePath: String
	//		the URL to get the template from. dojo.uri.Uri is often passed as well.
	// templateString: String?
	//		a string to use in lieu of fetching the template from a URL
	// Returns:
	//	Either string (if there are ${} variables that need to be replaced) or just
	//	a DOM tree (if the node can be cloned directly)

	// is it already cached?
	var tmplts = dijit.base._templateCache;
	var key = templateString || templatePath;
	var cached = tmplts[key];
	if(cached){
		return cached;
	}

	// If necessary, load template string from template path
	if(!templateString){
		templateString = dijit.base._sanitizeTemplateString(dojo._getText(templatePath));
	}

	if(templateString.match(/\$\{([^\}]+)\}/g)){
		// there are variables in the template so all we can do is cache the string
		return (tmplts[key] = templateString); //String
	}else{
		// there are no variables in the template so we can cache the DOM tree
		return (tmplts[key] = dijit.base._createNodesFromText(templateString)[0]); //Node
	}
};

dijit.base._sanitizeTemplateString = function(/*String*/tString){
	//summary: Strips <?xml ...?> declarations so that external SVG and XML
	//documents can be added to a document without worry. Also, if the string
	//is an HTML document, only the part inside the body tag is returned.
	if(tString){
		tString = tString.replace(/^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im, "");
		var matches = tString.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
		if(matches){
			tString = matches[1];
		}
	}else{
		tString = "";
	}
	return tString; //String
};

dijit.base.attachTemplateNodes = function(rootNode, /*Widget*/ targetObj){
	// summary:
	//		map widget properties and functions to the handlers specified in
	//		the dom node and it's descendants. This function iterates over all
	//		nodes and looks for these properties:
	//			* dojoAttachPoint
	//			* dojoAttachEvent	
	//			* waiRole
	//			* waiState
	// rootNode: DomNode
	//		the node to search for properties. All children will be searched.

	var trim = function(str){
		return str.replace(/^\s+|\s+$/g, "");
	};

	var nodes = rootNode.all || rootNode.getElementsByTagName("*");
	for(var x=-1; x<nodes.length; x++){
		var baseNode = (x == -1) ? rootNode : nodes[x];

		// Process dojoAttachPoint
		if(!targetObj.widgetsInTemplate || !baseNode.getAttribute('dojoType')){
			var tmpAttachPoint = baseNode.getAttribute("dojoAttachPoint");
			if(tmpAttachPoint){
				var attachPoint = tmpAttachPoint.split(";");
				for(var z=0; z<attachPoint.length; z++){
					if(dojo.isArray(targetObj[attachPoint[z]])){
						targetObj[attachPoint[z]].push(baseNode);
					}else{
						targetObj[attachPoint[z]]=baseNode;
					}
				}
			}
		}

		// dojoAttachEvent
		var attachEvent = baseNode.getAttribute("dojoAttachEvent");
		if(attachEvent){
			// NOTE: we want to support attributes that have the form
			// "domEvent: nativeEvent; ..."
			var evts = attachEvent.split(";");
			for(var y=0; y<evts.length; y++){
				if(!evts[y] || !evts[y].length){ continue; }
				var thisFunc = null;
				var tevt = trim(evts[y]);
				if(evts[y].indexOf(":") != -1){
					// oh, if only JS had tuple assignment
					var funcNameArr = tevt.split(":");
					tevt = trim(funcNameArr[0]);
					thisFunc = trim(funcNameArr[1]);
				}
				if(!thisFunc){
					thisFunc = tevt;
				}

				dojo.connect(baseNode, tevt, targetObj, thisFunc); 
			}
		}

		// waiRole, waiState
		dojo.forEach(["waiRole", "waiState"], function(name){
			var wai = dijit.util.wai[name];
			var val = baseNode.getAttribute(wai.name);
			if(val){
				var role = "role";
				if(val.indexOf('-') != -1){ 
					// this is a state-value pair
					var statePair = val.split('-');
					role = statePair[0];
					val = statePair[1];
				}
				dijit.util.wai.setAttr(baseNode, wai.name, role, val);
			}
		}, this);
	}
};

if(dojo.isIE){
	dojo.addOnUnload(function(){
		for(var key in dijit.base._templateCache){
			var value = dijit.base._templateCache[key];
			if(value instanceof Element){ //PORT: good enough replacement for isNode?
// PORT				dojo.dom.destroyNode(value);
			}
			dijit.base._templateCache[key] = null;
		}
	});
}

dijit.base._createNodesFromText = function(/*String*/text){
	//	summary
	//	Attempts to create a set of nodes based on the structure of the passed text.

	text = text.replace(/^\s+|\s+$/g, "");

	var tn = dojo.doc.createElement("div");
	// dojo.style(tn, "display", "none");
	dojo.style(tn, "visibility", "hidden");
	dojo.body().appendChild(tn);
	var tableType = "none";
	var tagMap = {
		cell: {re: /^<t[dh][\s\r\n>]/i, pre: "<table><tbody><tr>", post: "</tr></tbody></table>"},
		row: {re: /^<tr[\s\r\n>]/i, pre: "<table><tbody>", post: "</tbody></table>"},
		section: {re: /^<(thead|tbody|tfoot)[\s\r\n>]/i, pre: "<table>", post: "</table>"}
	};
	for(var type in tagMap){
		var map = tagMap[type];
		if(map.re.test(text.replace(/^\s+/))){ //FIXME: replace with one arg?  is this a no-op?
			tableType = type;
			text = map.pre + text + map.post;
			break;
		}
	}

	tn.innerHTML = text;
	if(tn.normalize){
		tn.normalize();
	}

	var tag = {cell: "tr", row: "tbody", section: "table"}[tableType];
	var parent = tn;
	if(typeof tag != "undefined"){
		parent = tn.getElementsByTagName(tag)[0];
	}

	/* this doesn't make much sense, I'm assuming it just meant trim() so wrap was replaced with trim
	if(wrap){
		var ret = [];
		// start hack
		var fc = tn.firstChild;
		ret[0] = ((fc.nodeValue == " ")||(fc.nodeValue == "\t")) ? fc.nextSibling : fc;
		// end hack
		// dojo.style(tn, "display", "none");
		dojo.body().removeChild(tn);
		return ret;
	}
	*/
	var nodes = [];
	for(var x=0; x<parent.childNodes.length; x++){
		nodes.push(parent.childNodes[x].cloneNode(true));
	}
	dojo.style(tn, "display", "none"); // FIXME: why do we do this?
//PORT	dojo.html.destroyNode(tn); FIXME: need code to prevent leaks and such
	dojo.body().removeChild(tn);
	return nodes;	//	Array
}
