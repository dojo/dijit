// derived from DomWidget.js

dojo.provide("dijit.base.TemplatedWidget");

dojo.require("dojo.lang.common");
dojo.require("dojo.lang.func");
dojo.require("dojo.html.style");
dojo.require("dojo.html.util");		// createNodesFromText()
dojo.require("dojo.event.browser");

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

			// Lookup cached version of template, and download to cache if it
			// isn't there already.  Returns either a DomNode or a string, depending on
			// whether or not the template contains ${foo} replacement parameters.
			var cached = dijit.base.getCachedTemplate(this.templatePath, this.templateString);

			var node;
			if ( dojo.dom.isNode(cached) ){
				// if it's a node, all we have to do is clone it
				node = cached.cloneNode(true);
			}else{
				// Cache contains a string because we need to do property replacement
				var tstr = cached;

				// construct table for property replacement
				var hash = this.strings || {};
				for(var key in dijit.base.defaultStrings) {
					if(dojo.lang.isUndefined(hash[key])) {
						hash[key] = dijit.base.defaultStrings[key];
					}
				}

				// do the property replacement
				var _this = this;
				tstr = tstr.replace(/\$\{([^\}]+)\}/g, function(match, key){
					var value = (key.substring(0, 5) == "this.") ? dojo.getObject(key.substring(5), false, _this) : hash[key];
					if(value){
						// Safer substitution, see heading "Attribute values" in  
						// http://www.w3.org/TR/REC-html40/appendix/notes.html#h-B.3.2
						value = value.toString();
						value = value.replace(/"/g,"&quot;");
						return value;
					}
				});

				node = dojo.html.createNodesFromText(tstr, true)[0];
			}

			// recurse through the node, looking for, and attaching to, our
			// attachment points which should be defined on the template node.
			// dojo.profile.start("attachTemplateNodes");
			dijit.base.attachTemplateNodes(node, this);
			// dojo.profile.end("attachTemplateNodes");

			dojo.html.copyStyle(node, this.srcNodeRef);

			this.domNode = node;

			// relocate source contents to templated container node
			// this.containerNode must be able to receive children, or exceptions will be thrown
			if (this.srcNodeRef && this.srcNodeRef.hasChildNodes()){
				var dest = this.containerNode||this.domNode;
				dojo.dom.moveChildren(this.srcNodeRef, dest);
			}

			if(this.srcNodeRef.parentNode){
				this.srcNodeRef.parentNode.replaceChild(this.domNode, this.srcNodeRef);
			}
			
		}
	}
);

dijit.base.defaultStrings = {
	// summary: a mapping of strings that are used in template variable replacement
	dojoRoot: dojo.hostenv.getBaseScriptUri(),
	dojoModuleUri: dojo.uri.moduleUri("dojo"),
	dijitModuleUri: dojo.uri.moduleUri("dijit"),	
	baseScriptUri: dojo.hostenv.getBaseScriptUri()
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
		templateString = dijit.base._sanitizeTemplateString(dojo.hostenv.getText(templatePath));
	}

	if(templateString.match(/\$\{([^\}]+)\}/g)) {
		// there are variables in the template so all we can do is cache the string
		tmplts[key] = templateString;
		return templateString;
	}else{
		// there are no variables in the template so we can cache the DOM tree
		var dom = dojo.html.createNodesFromText(templateString, true)[0];
		tmplts[key] = dom;
		return dom;
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

dijit.base.attachTemplateNodes = function(rootNode, /*Widget*/ targetObj ){
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

	function trim(str){
		return str.replace(/^\s+|\s+$/g, "");
	}

	var nodes = rootNode.all || rootNode.getElementsByTagName("*");
	var _this = targetObj;
	for(var x=-1; x<nodes.length; x++){
		var baseNode = (x == -1) ? rootNode : nodes[x];

		// Process dojoAttachPoint
		if(!targetObj.widgetsInTemplate || !baseNode.getAttribute('dojoType')){
			var tmpAttachPoint = baseNode.getAttribute("dojoAttachPoint");
			if(tmpAttachPoint){
				var attachPoint = tmpAttachPoint.split(";");
				for(var z=0; z<attachPoint.length; z++){
					if(dojo.lang.isArray(targetObj[attachPoint[z]])){
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
				if((!evts[y])||(!evts[y].length)){ continue; }
				var thisFunc = null;
				var tevt = trim(evts[y]);
				if(evts[y].indexOf(":") >= 0){
					// oh, if only JS had tuple assignment
					var funcNameArr = tevt.split(":");
					tevt = trim(funcNameArr[0]);
					thisFunc = trim(funcNameArr[1]);
				}
				if(!thisFunc){
					thisFunc = tevt;
				}

				var tf = function(){ 
					var ntf = new String(thisFunc);
					return function(evt){
						if(_this[ntf]){
							_this[ntf](dojo.event.browser.fixEvent(evt, this));
						}
					};
				}();
				dojo.event.browser.addListener(baseNode, tevt, tf, false, true);
			}
		}

		// waiRole, waiState
		dojo.lang.forEach(["waiRole", "waiState"], function(name){
			var wai = dijit.util.wai[name];
			var val = baseNode.getAttribute(wai.name);
			if(val){
				if(val.indexOf('-') == -1){ 
					dijit.util.wai.setAttr(baseNode, wai.name, "role", val);
				}else{
					// this is a state-value pair
					var statePair = val.split('-');
					dijit.util.wai.setAttr(baseNode, wai.name, statePair[0], statePair[1]);
				}
			}
		}, this);
	}
};

if(dojo.render.html.ie){
	dojo.addOnUnload(function(){
		for(var key in dijit.base._templateCache){
			var value = dijit.base._templateCache[key];
			if(dojo.dom.isNode(value)){
				dojo.dom.destroyNode(value);
			}
			dijit.base._templateCache[key] = null;
		}
	});
}
