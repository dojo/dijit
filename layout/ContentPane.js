dojo.provide("dijit.layout.ContentPane");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.Showable");
dojo.require("dijit.base.Layout");

dojo.declare(
	"dijit.layout.ContentPane",
	[dijit.base.Widget, dijit.base.Layout, dijit.base.Showable],
		// summary:
		//		A widget that can be used as a standalone widget 
		//		or as a baseclass for other widgets
		//		Handles replacement of document fragment using either external uri or javascript/java 
		//		generated markup or DomNode content, instantiating widgets within content and runs scripts.
		//		Dont confuse it with an iframe, it only needs document fragments.
		//		It's useful as a child of LayoutContainer, SplitContainer, or TabContainer.
		//		But note that those classes can contain any widget as a child.
{
		// loading options
		// adjustPaths: Boolean
		//		adjust relative paths in markup to fit this page
		adjustPaths: false,

		// href: String
		//		The href of the content that displays now
		//		Set this at construction if you want to load externally,
		//		changing href after creation doesnt have any effect, see setUrl
		href: "",

		// extractContent Boolean: Extract visible content from inside of <body> .... </body>
		extractContent: true,

		// parseContent Boolean: Construct all widgets that is in content
		parseContent:	true,

		// cacheContent Boolean: Cache content retreived externally
		cacheContent:	true,

		// preload: Boolean
		//		Force load of data even if pane is hidden.
		// Note:
		//		In order to delay download you need to initially hide the node it constructs from
		preload: false,

		// refreshOnShow: Boolean
		//		Refresh (re-download) content when pane goes from hidden to shown
		refreshOnShow: false,

		// handler: String||Function
		//		Generate pane content from a java function
		//		The name of the java proxy function
		handler: "",

		// loadingMessage: String
		//		Message that shows while downloading
		loadingMessage: "Loading...", //TODO: i18n

		// isLoaded: Boolean
		//		Tells loading status
		isLoaded: false,

		// class: String
		//		Class name to apply to ContentPane dom nodes
		"class": "dojoContentPane",

		postCreate: function(){
			// per widgetImpl variables
			this._styleNodes = [];
			this._onLoadStack = [];
			this._onUnloadStack = [];
			this._callOnUnload = false;

			// for programatically created ContentPane (with <span> tag), need to muck w/CSS
			// or it's as though overflow:visible is set
			dojo.addClass(this.domNode, this["class"]);

			if(this.handler!==""){
				this.setHandler(this.handler);
			}
			if(this.isShowing() || this.preload){
				this._prepareForShow(); 
			}
		},
	
		onShow: function(){
			// if refreshOnShow is true, reload the contents every time; otherwise, load only the first time
			if(this.refreshOnShow){
				this.refresh();
			}else{
				this._prepareForShow();
			}
		},
	
		refresh: function(){
			// summary:
			//		Force a refresh (re-download) of content, be sure to turn off cache
			this.isLoaded=false;
			this._prepareForShow();
		},
	
		_prepareForShow: function(){
			// summary:
			//		Called whenever the ContentPane is displayed.  The first time it's called,
			//		it will download the data from specified URL or handler (if the data isn't
			//		inlined), and will instantiate subwidgets.
			if( this.isLoaded ){
				return;
			}
			if(dojo.isFunction(this.handler)){
				this._runHandler();
			}else if(this.href != ""){
				this._downloadExternalContent(this.href, this.cacheContent && !this.refreshOnShow);
			}
		},
		
		setUrl: function(/*String||dojo.uri.Uri*/ url){
			// summary:
			//		Reset the (external defined) content of this pane and replace with new url

			//	Note:
			//		It delays the download until widget is shown if preload is false
			this.href = url;
			this.isLoaded = false;
			if(this.preload || this.isShowing()){
				this._prepareForShow();
			}
		},

		abort: function(){
			// summary
			//		Aborts a inflight download of content
		},
	
		_downloadExternalContent: function(url, useCache){
			this.abort();
			this._handleDefaults(this.loadingMessage, "onDownloadStart");
			var self = this;
			var getArgs = { 
				url: url,
				handleAs: "text"
			}; 
			var getHandler = dojo.xhrGet(getArgs); 
			getHandler.addCallback(function(data){
				self.onDownloadEnd.call(self, url, data);
			}); 
			getHandler.addErrback(function(e){
				self._handleDefaults.call(self, e, "onDownloadError");
				self.onLoad();
			});
		},
	
		onLoad: function(e){
			// summary:
			//		Event hook, is called after everything is loaded and widgetified 
			this._runStack("_onLoadStack");
			this.isLoaded=true;
		},
	
		onUnload: function(e){
			// summary:
			//		Event hook, is called before old content is cleared
			this._runStack("_onUnloadStack");
		},
	
		_runStack: function(stName){
			var st = this[stName]; var err = "";
			var scope = window;
			for(var i = 0;i < st.length; i++){
				try{
					st[i].call(scope);
				}catch(e){ 
					err += "\n"+st[i]+" failed: "+e.description;
				}
			}
			this[stName] = [];
	
			if(err.length){
				var name = (stName== "_onLoadStack") ? "addOnLoad" : "addOnUnLoad";
				this._handleDefaults(name+" failure\n "+err, "onExecError", "debug"); //TODO: i18n
			}
		},
	
		addOnLoad: function(obj, func){
			// summary
			//		Stores function refs and calls them one by one in the order they came in
			//		when load event occurs.
			//	obj: Function||Object?
			//		holder object
			//	func: Function
			//		function that will be called 
			this._pushOnStack(this._onLoadStack, obj, func);
		},
	
		addOnUnload: function(obj, func){
			// summary
			//		Stores function refs and calls them one by one in the order they came in
			//		when unload event occurs.
			//	obj: Function||Object
			//		holder object
			//	func: Function
			//		function that will be called 
			this._pushOnStack(this._onUnloadStack, obj, func);
		},
	
		_pushOnStack: function(stack, obj, func){
			if(typeof func == 'undefined'){
				stack.push(obj);
			}else{
				stack.push(function(){ obj[func](); });
			}
		},

		_destroy: function(){
			// if we have multiple controllers destroying us, bail after the first
			if(this._beingDestroyed){
				return;
			}
			// make sure we call onUnload
			this.onUnload();
			this._beingDestroyed = true;
			dijit.layout.ContentPane.superclass._destroy.call(this);
		},
 
		onExecError: function(/*Object*/e){
			// summary:
			//		called when content script eval error or Java error occurs, preventDefault-able
			//		default is to debug not alert as in 0.3.1
		},
	
		onContentError: function(/*Object*/e){
			// summary: 
			//		called on DOM faults, require fault etc in content, preventDefault-able
			//		default is to display errormessage inside pane
		},
	
		onDownloadError: function(/*Object*/e){
			// summary: 
			//		called when download error occurs, preventDefault-able
			//		default is to display errormessage inside pane
		},
	
		onDownloadStart: function(/*Object*/e){
			// summary:
			//		called before download starts, preventDefault-able
			//		default is to display loadingMessage inside pane
			//		by changing e.text in your event handler you can change loading message
		},
	
		// 
		onDownloadEnd: function(url, data){
			// summary:
			//		called when download is finished
			//
			//	url String: url that downloaded data
			//	data String: the markup that was downloaded
			data = this.splitAndFixPaths(data, url);
			this.setContent(data);
		},
	
		// useful if user wants to prevent default behaviour ie: _setContent("Error...")
		_handleDefaults: function(e, handler, messType){
			if(!handler){ handler = "onContentError"; }

			if(dojo.isString(e)){ e = {text: e}; }

			if(!e.text){ e.text = e.toString(); }

			e.toString = function(){ return this.text; };

			if(typeof e.returnValue != "boolean"){
				e.returnValue = true; 
			}
			if(typeof e.preventDefault != "function"){
				e.preventDefault = function(){ this.returnValue = false; };
			}
			// call our handler
			this[handler](e);
			if(e.returnValue){
				switch(messType){
					case true: // fallthrough, old compat
					case "alert":
						alert(e.toString()); break;
					case "debug":
						console.debug(e.toString()); break;
					default:
					// makes sure scripts can clean up after themselves, before we setContent
					if(this._callOnUnload){ this.onUnload(); } 
					// makes sure we dont try to call onUnLoad again on this event,
					// ie onUnLoad before 'Loading...' but not before clearing 'Loading...'
					this._callOnUnload = false;

					// we might end up in a endless recursion here if domNode cant append content
					if(arguments.callee._loopStop){
						console.debug(e.toString());
					}else{
						arguments.callee._loopStop = true;
						this._setContent(e.toString());
					}
				}
			}
			arguments.callee._loopStop = false;
		},
	
		// pathfixes, require calls, css stuff and neccesary content clean
		// pathfixes, require calls, css stuff and neccesary content clean
		// pathfixes, require calls, css stuff and neccesary content clean
		splitAndFixPaths: function(s, url){
			// summary:
			// 		adjusts all relative paths in (hopefully) all cases, images, remote scripts, links etc.
			// 		splits up content in different pieces, scripts, title, style, link and whats left becomes .xml
			//	s String:	The markup in string
			//	url (String||dojo.uri.Uri?) url that pulled in markup

			var titles = [], scripts = [],tmp = [];// init vars
			var match = [], requires = [], attr = [], styles = [];
			var str = '', path = '', fix = '', tagFix = '', tag = '', origPath = '';
	
			if(!url){ url = "./"; } // point to this page if not set

			if(s){ // make sure we dont run regexes on empty content

				/************** <title> ***********/
				// khtml is picky about dom faults, you can't attach a <style> or <title> node as child of body
				// must go into head, so we need to cut out those tags
				var regex = /<title[^>]*>([\s\S]*?)<\/title>/i;
				while(match = regex.exec(s)){
					titles.push(match[1]);
					s = s.substring(0, match.index) + s.substr(match.index + match[0].length);
				};

				/************** adjust paths *****************/
				if(this.adjustPaths){
					// attributepaths one tag can have multiple paths example:
					// <input src="..." style="url(..)"/> or <a style="url(..)" href="..">
					// strip out the tag and run fix on that.
					// this guarantees that we won't run replace on another tag's attribute + it was easier do
					var regexFindTag = /<[a-z][a-z0-9]*[^>]*\s(?:(?:src|href|style)=[^>])+[^>]*>/i;
					var regexFindAttr = /\s(src|href|style)=(['"]?)([\w()\[\]\/.,\\'"-:;#=&?\s@]+?)\2/i;
					// these are the supported protocols, all other is considered relative
					var regexProtocols = /^(?:[#]|(?:(?:https?|ftps?|file|javascript|mailto|news):))/;
		
					while(tag = regexFindTag.exec(s)){
						str += s.substring(0, tag.index);
						s = s.substring((tag.index + tag[0].length), s.length);
						tag = tag[0];
			
						// loop through attributes
						tagFix = '';
						while(attr = regexFindAttr.exec(tag)){
							path = ""; origPath = attr[3];
							switch(attr[1].toLowerCase()){
								case "src":// falltrough
								case "href":
									if(regexProtocols.exec(origPath)){
										path = origPath;
									}else{
										path = (new dojo.uri.Uri(url, origPath).toString());
									}
									break;
								case "style":// style
									path = dojo.html.fixPathsInCssText(origPath, url);//PORT me
									break;
								default:
									path = origPath;
							}
							fix = " " + attr[1] + "=" + attr[2] + path + attr[2];
							// slices up tag before next attribute check
							tagFix += tag.substring(0, attr.index) + fix;
							tag = tag.substring((attr.index + attr[0].length), tag.length);
						}
						str += tagFix + tag; //dojo.debug(tagFix + tag);
					}
					s = str+s;
				}

				/****************  cut out all <style> and <link rel="stylesheet" href=".."> **************/
				regex = /(?:<(style)[^>]*>([\s\S]*?)<\/style>|<link ([^>]*rel=['"]?stylesheet['"]?[^>]*)>)/i;
				while(match = regex.exec(s)){
					if(match[1] && match[1].toLowerCase() == "style"){
						styles.push(dojo.html.fixPathsInCssText(match[2],url)); // PORT me
					}else if(attr = match[3].match(/href=(['"]?)([^'">]*)\1/i)){
						styles.push({path: attr[2]});
					}
					s = s.substring(0, match.index) + s.substr(match.index + match[0].length);
				};

				/***************** cut out all <script> tags, push them into scripts array ***************/
				var regex = /<script([^>]*)>([\s\S]*?)<\/script>/i;
				var regexSrc = /src=(['"]?)([^"']*)\1/i;
				var regexDojoJs = /.*(\bdojo\b\.js(?:\.uncompressed\.js)?)$/;
				var regexInvalid = /(?:var )?\bdjConfig\b(?:[\s]*=[\s]*\{[^}]+\}|\.[\w]*[\s]*=[\s]*[^;\n]*)?;?|dojo\.hostenv\.writeIncludes\(\s*\);?/g;
				var regexRequires = /dojo\.(?:(?:require(?:After)?(?:If)?)|(?:widget\.(?:manager\.)?registerWidgetPackage)|(?:(?:hostenv\.)?registerModulePath)|defineNamespace)\((['"]).*?\1\)\s*;?/;

				while(match = regex.exec(s)){
					if(match[2]){
						// remove all invalid variables etc like djConfig and dojo.hostenv.writeIncludes()
						var sc = match[2].replace(regexInvalid, "");
						if(!sc){ continue; }
		
						// cut out all dojo.require (...) calls, if we have execute 
						// scripts false widgets dont get there require calls
						// takes out possible widgetpackage registration as well
						while((tmp = regexRequires.exec(sc))){
							requires.push(tmp[0]);
							sc = sc.substring(0, tmp.index) + sc.substr(tmp.index + tmp[0].length);
						}
					}
					s = s.substr(0, match.index) + s.substr(match.index + match[0].length);
				}

				/********* extract content *********/
				if(this.extractContent){
					match = s.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
					if(match){ s = match[1]; }
				}
	 		}

			return {"xml": 		s, // Object
				"styles":		styles,
				"titles": 		titles,
				"requires": 	requires,
				"scripts": 		scripts,
				"url": 			url};
		},
	
		
		_setContent: function(cont){
			this.destroyDescendants();
	
			// remove old stylenodes from HEAD
			dojo.forEach(this._styleNodes, function(style){
				if(style && style.parentNode){
					style.parentNode.removeChild(style);
				}
			}, this);
			this._styleNodes = [];

			try{
				var node = this.containerNode || this.domNode;
				while(node.firstChild){
			//PORT memory leak #2931
					node.firstChild.parentNode.removeChild(node.firstChild);
//					delete node.firstChild; //Q is this wrong?
				}
				if(typeof cont != "string"){
					node.appendChild(cont);
				}else{
					node.innerHTML = cont;
				}
			}catch(e){
				e.text = "Couldn't load content:"+e.description; //TODO: i18n
				this._handleDefaults(e, "onContentError");
			}
		},

		setContent: function(data){
			// summary:
			//		Replaces old content with data content, include style classes from old content
			//	data String||DomNode:	new content, be it Document fragment or a DomNode chain
			//			If data contains style tags, link rel=stylesheet it inserts those styles into DOM
			this.abort();
			if(this._callOnUnload){ this.onUnload(); }// this tells a remote script clean up after itself
			this._callOnUnload = true;
			
//PORT: from dojo.dom.  get rid of isNode check and use something else instead?
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

			if(!data || isNode(data)){
				// if we do a clean using setContent(""); or setContent(#node) bypass all parsing, extractContent etc
				this._setContent(data);
				this.onResized();
				this.onLoad();
			}else{
				// need to run splitAndFixPaths? ie. manually setting content
				// adjustPaths is taken care of inside splitAndFixPaths
				if(typeof data.xml != "string"){ 
					this.href = ""; // so we can refresh safely
					data = this.splitAndFixPaths(data); 
				}

				this._setContent(data.xml);

				// insert styles from content (in same order they came in)
				dojo.forEach(data.style, function(style){
					this._styleNodes.push(
						style.path ? dojo.html.insertCssFile(style.path, dojo.doc, false, true) : dojo.html.insertCssText(style));//PORT me?
				}, this);
	
				if(this.parseContent){
					dojo.forEach(data.requires, function(require){
						try{
							eval(require);
						}catch(e){
							//TODO: i18n - user visible error.  Should this be presented in the UI at all?
							e.text = "ContentPane: error in package loading calls, " + (e.description||e);
							this._handleDefaults(e, "onContentError", "debug");
						}
					});
				}
				// need to allow async load, Xdomain uses it
				// is inline function because we cant send args to dojo.addOnLoad
				var _self = this;
				function asyncParse(){
					if(_self.parseContent){
						_self._createSubWidgets();
					}
	
					_self.onResized();
					_self.onLoad();
				}
				// try as long as possible to make setContent sync call
/*				if(dojo.hostenv.isXDomain && data.requires.length){
					dojo.addOnLoad(asyncParse);
				}else{
*/					asyncParse();
//				}
			}
		},

		_createSubWidgets: function(){
			// summary: scan my contents and create subwidgets
			var rootNode = this.containerNode || this.domNode;
			
			// FIXME: this isn't working (see below)
			dijit.util.parser.parse(rootNode);
			
/*			// temporary workaround until dojo.query works with passed in rootNode
			// in above call first find all the descendent widget nodes
			var allNodes = rootNode.all || rootNode.getElementsByTagName("*");
			var i=0, node;
			var nodes = [];
			while((node = allNodes[i++])){
			var djt = node.getAttribute("dojoType");
				if(djt){
					nodes.push(node);
				}
			}
			// instantiate subwidgets
			dijit.util.parser.instantiate(nodes);*/		
		},

		setHandler: function(/*Function*/ handler){ 
			// summary:
			//		Generate pane content from given java function
			var fcn = dojo.isFunction(handler) ? handler : window[handler];
			if(!dojo.isFunction(fcn)){
				// FIXME: needs testing! somebody with java knowledge needs to try this
				this._handleDefaults("Unable to set handler, '" + handler + "' not a function.", "onExecError", true); //TODO: i18n
				return;
			}
			this.handler = function(){
				return fcn.apply(this, arguments);
			}
		},
	
		_runHandler: function(){
			var ret = true;
			if(dojo.isFunction(this.handler)){
				this.handler(this, this.domNode);
				ret = false;
			}
			this.onLoad();
			return ret;
		}
		
});
