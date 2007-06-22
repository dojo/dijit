dojo.provide("dijit._Templated");

dojo.require("dojo.string");
dojo.require("dijit.util.wai");
dojo.require("dojo.parser");

dojo.declare("dijit._Templated",
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

			var cached = dijit._Templated.getCachedTemplate(this.templatePath, this.templateString);

			var node;
			if(dojo.isString(cached)){
				// Cache contains a string because we need to do property replacement
				// do the property replacement
				var tstr = dojo.string.substitute(cached, this, function(value){
					// Safer substitution, see heading "Attribute values" in
					// http://www.w3.org/TR/REC-html40/appendix/notes.html#h-B.3.2
					return value.toString().replace(/"/g,"&quot;"); //TODO: support a more complete set of escapes?
				}, this);

				node = dijit._Templated._createNodesFromText(tstr)[0];
			}else{
				// if it's a node, all we have to do is clone it
				node = cached.cloneNode(true);
			}

			// recurse through the node, looking for, and attaching to, our
			// attachment points which should be defined on the template node.
			this._attachTemplateNodes(node);
			if(this.srcNodeRef){
				dojo.style(node, "cssText", this.srcNodeRef.style.cssText);
				if(this.srcNodeRef.className){
					node.className += " " + this.srcNodeRef.className;
				}
			}

			this.domNode = node;
			if(this.srcNodeRef && this.srcNodeRef.parentNode){
				this.srcNodeRef.parentNode.replaceChild(this.domNode, this.srcNodeRef);
			}
			if(this.widgetsInTemplate){
				var childWidgets = dojo.parser.parse(this.domNode);
				this._attachTemplateNodes(childWidgets, function(n,p){
					return n[p];
				});
			}

			// relocate source contents to templated container node
			// this.containerNode must be able to receive children, or exceptions will be thrown
			if(this.srcNodeRef && this.srcNodeRef.hasChildNodes()){
				var dest = this.containerNode||this.domNode;
				while(this.srcNodeRef.hasChildNodes()){
					dest.appendChild(this.srcNodeRef.firstChild);
				}
			}
		},

		_attachTemplateNodes: function(rootNode, getAttrFunc){
			// summary:
			//		map widget properties and functions to the handlers specified in
			//		the dom node and it's descendants. This function iterates over all
			//		nodes and looks for these properties:
			//			* dojoAttachPoint
			//			* dojoAttachEvent	
			//			* waiRole
			//			* waiState
			// rootNode: DomNode|Array[Widgets]
			//		the node to search for properties. All children will be searched.
			// getAttrFunc: function?
			//		a function which will be used to obtain property for a given
			//		DomNode/Widget

			var trim = function(str){
				return str.replace(/^\s+|\s+$/g, "");
			};

			getAttrFunc = getAttrFunc || function(n,p){ return n.getAttribute(p); }

			var nodes = dojo.isArray(rootNode) ? rootNode : (rootNode.all || rootNode.getElementsByTagName("*"));
			var x=dojo.isArray(rootNode)?0:-1;
			for(; x<nodes.length; x++){
				var baseNode = (x == -1) ? rootNode : nodes[x];
				if(this.widgetsInTemplate && getAttrFunc(baseNode,'dojoType')){
					return;
				}
				// Process dojoAttachPoint
				var tmpAttachPoint = getAttrFunc(baseNode, "dojoAttachPoint");
				if(tmpAttachPoint){
					var attachPoint = tmpAttachPoint.split(";");
					var z = 0, ap;
					while((ap=attachPoint[z++])){
						if(dojo.isArray(this[ap])){
							this[ap].push(baseNode);
						}else{
							this[ap]=baseNode;
						}
					}
				}

				// dojoAttachEvent
				var attachEvent = getAttrFunc(baseNode, "dojoAttachEvent");
				if(attachEvent){
					// NOTE: we want to support attributes that have the form
					// "domEvent: nativeEvent; ..."
					var evts = attachEvent.split(";");
					var y = 0, evt;
					while((evt=evts[y++])){
						if(!evt || !evt.length){ continue; }
						var thisFunc = null;
						var tevt = trim(evt);
						if(evt.indexOf(":") != -1){
							// oh, if only JS had tuple assignment
							var funcNameArr = tevt.split(":");
							tevt = trim(funcNameArr[0]);
							thisFunc = trim(funcNameArr[1]);
						}
						if(!thisFunc){
							thisFunc = tevt;
						}
						this.connect(baseNode, tevt, thisFunc);
					}
				}

				// waiRole, waiState
				dojo.forEach(["waiRole", "waiState"], function(name){
					var wai = dijit.util.wai[name];
					var values = getAttrFunc(baseNode, wai.name);
					if(values){
						var role = "role";
						dojo.forEach(values.split(";"), function(val){	// allow multiple states
							if(val.indexOf('-') != -1){
								// this is a state-value pair
								var statePair = val.split('-');
								role = statePair[0];
								val = statePair[1];
							}
							dijit.util.wai.setAttr(baseNode, wai.name, role, val);
						}, this);
					}
				}, this);
			}
		}
	}
);

// key is either templatePath or templateString; object is either string or DOM tree
dijit._Templated._templateCache = {};

dijit._Templated.getCachedTemplate = function(templatePath, templateString){
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
	var tmplts = dijit._Templated._templateCache;
	var key = templateString || templatePath;
	var cached = tmplts[key];
	if(cached){
		return cached;
	}

	// If necessary, load template string from template path
	if(!templateString){
		templateString = dijit._Templated._sanitizeTemplateString(dojo._getText(templatePath));
	}

	templateString = templateString.replace(/^\s+|\s+$/g, "");

	if(templateString.match(/\$\{([^\}]+)\}/g)){
		// there are variables in the template so all we can do is cache the string
		return (tmplts[key] = templateString); //String
	}else{
		// there are no variables in the template so we can cache the DOM tree
		return (tmplts[key] = dijit._Templated._createNodesFromText(templateString)[0]); //Node
	}
};

dijit._Templated._sanitizeTemplateString = function(/*String*/tString){
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


if(dojo.isIE){
	dojo.addOnUnload(function(){
		var cache = dijit._Templated._templateCache;
		for(var key in cache){
			var value = cache[key];
			if(!isNaN(value.nodeType)){ // isNode equivalent
// PORT.  Fix leak			dojo.dom.destroyNode(value);
			}
			cache[key] = null;
		}
	});
}

(function(){
	var tagMap = {
		cell: {re: /^<t[dh][\s\r\n>]/i, pre: "<table><tbody><tr>", post: "</tr></tbody></table>"},
		row: {re: /^<tr[\s\r\n>]/i, pre: "<table><tbody>", post: "</tbody></table>"},
		section: {re: /^<(thead|tbody|tfoot)[\s\r\n>]/i, pre: "<table>", post: "</table>"}
	};

	var tn;
	var _parent;

	dijit._Templated._createNodesFromText = function(/*String*/text){
		//	summary
		//	Attempts to create a set of nodes based on the structure of the passed text.

		if(!tn){
			_parent = tn = dojo.doc.createElement("div");
			tn.style.visibility="hidden";
		}
		var tableType = "none";
		var rtext = text.replace(/^\s+/);
		for(var type in tagMap){
			var map = tagMap[type];
			if(map.re.test(rtext)){ //FIXME: replace with one arg?  is this a no-op?
				tableType = type;
				text = map.pre + text + map.post;
				break;
			}
		}

		tn.innerHTML = text;
		dojo.body().appendChild(tn);
		if(tn.normalize){
			tn.normalize();
		}

		var tag = { cell: "tr", row: "tbody", section: "table" }[tableType];
		if(typeof tag != "undefined"){
			_parent = tn.getElementsByTagName(tag)[0];
		}

		var nodes = [];
		/*
		for(var x=0; x<_parent.childNodes.length; x++){
			nodes.push(_parent.childNodes[x].cloneNode(true));
		}
		*/
		while(_parent.firstChild){
			nodes.push(_parent.removeChild(_parent.firstChild));
		}
		//PORT	dojo.html.destroyNode(tn); FIXME: need code to prevent leaks and such
		_parent = dojo.body().removeChild(tn);
		return nodes;	//	Array
	}
})();

// These arguments can be specified for widgets which are used in templates.
// Since any widget can be specified as sub widgets in template, mix it
// into the base widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit._Widget,{
	dojoAttachEvent: "",
	dojoAttachPoint: "",
	waiRole: "",
	waiState:""
})
