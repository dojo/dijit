dojo.provide("dijit._editor.RichText");

dojo.require("dijit._Widget");
dojo.require("dijit._editor.selection");

// used to save content
// but do not try doing document.write if we are using xd loading.
// document.write will only work if RichText.js is included in the dojo.js
// file. If it is included in dojo.js and you want to allow rich text saving
// for back/forward actions, then set djConfig.allowXdRichTextSave = true.
if(!djConfig["useXDomain"] || djConfig["allowXdRichTextSave"]){
	if(dojo._post_load){
		(function(){
			var savetextarea = dojo.doc.createElement('textarea');
			savetextarea.id = "dijit._editor.RichText.savedContent";
			var s = savetextarea.style;
			s.display='none';
			s.position='absolute';
			s.top="-100px";
			s.left="-100px"
			s.height="3px";
			s.width="3px";
			dojo.body().appendChild(savetextarea);
		})();
	}else{
		//dojo.body() is not available before onLoad is fired
		try {
			dojo.doc.write('<textarea id="dijit._editor.RichText.savedContent" ' +
				'style="display:none;position:absolute;top:-100px;left:-100px;height:3px;width:3px;overflow:hidden;"></textarea>');
		}catch(e){ }
	}
}
dojo.declare(
	"dijit._editor.RichText",
	[ dijit._Widget ], null,
	{
		preamble: function(){
			// summary:
			//		dijit._editor.RichText is the core of the WYSIWYG editor in dojo, which
			//		provides the basic editing features. It also encapsulates the differences
			//		of different js engines for various browsers

			// contentPreFilters: Array
			//		pre content filter function register array.
			//		these filters will be executed before the actual
			//		editing area get the html content
			this.contentPreFilters = [];

			// contentPostFilters: Array
			//		post content filter function register array.
			//		these will be used on the resulting html
			//		from contentDomPostFilters. The resuling
			//		content is the final html (returned by getValue())
			this.contentPostFilters = [];

			// contentDomPreFilters: Array
			//		pre content dom filter function register array.
			//		these filters are applied after the result from
			//		contentPreFilters are set to the editing area
			this.contentDomPreFilters = [];

			// contentDomPostFilters: Array
			//		post content dom filter function register array.
			//		these filters are executed on the editing area dom
			//		the result from these will be passed to contentPostFilters
			this.contentDomPostFilters = [];

			// editingAreaStyleSheets: Array
			//		array to store all the stylesheets applied to the editing area
			this.editingAreaStyleSheets=[];

			this._keyHandlers = {};
			this.contentPreFilters.push(dojo.hitch(this, "_preFixUrlAttributes"));
			if(dojo.isMoz){
				this.contentPreFilters.push(this._fixContentForMoz);
			}
			//this.contentDomPostFilters.push(this._postDomFixUrlAttributes);


			this.onLoadDeferred = new dojo.Deferred();
			if(this.blockNodeForEnter=='BR'){
				if(dojo.isIE){
					this.contentDomPreFilters.push(dojo.hitch(this, "regularPsToSingleLinePs"));
					this.contentDomPostFilters.push(dojo.hitch(this, "singleLinePsToRegularPs"));
				}
			}else if(this.blockNodeForEnter){
				//add enter key handler
				// FIXME: need to port to the new event code!!
				this.addKeyHandler(13, 0, this.handleEnterKey); //enter
				this.addKeyHandler(13, 2, this.handleEnterKey); //shift+enter
			}
		},

		// inheritWidth: Boolean
		//		whether to inherit the parent's width or simply use 100%
		inheritWidth: false,

		// focusOnLoad: Boolean
		//		whether focusing into this instance of richtext when page onload
		focusOnLoad: false,

		// name: String
		//		If a save name is specified the content is saved and restored when the user
		//		leave this page can come back, or if the editor is not properly closed after
		//		editing has started.
		name: "",

		// styleSheets: String
		//		semicolon (";") separated list of css files for the editing area
		styleSheets: "",

		// _content: String
		//		temporary content storage
		_content: "",

		// height: String
		//		set height to fix the editor at a specific height, with scrolling
		height: "",

		// minHeight: String
		//		The minimum height that the editor should have
		minHeight: "1em",

		// isClosed: Boolean
		isClosed: true,

		// isLoaded: Boolean
		isLoaded: false,

		// _SEPARATOR: String
		//		used to concat contents from multiple textareas into a single string
		_SEPARATOR: "@@**%%__RICHTEXTBOUNDRY__%%**@@",

		// onLoadDeferred: dojo.Deferred
		//		deferred that can be used to connect to the onLoad function. This
		//		will only be set if dojo.Deferred is required
		onLoadDeferred: null,

		// Init
		postCreate: function(){
			dojo.publish("dijit._editor.RichText::init", [this]);
			this.open();
			this.setupDefaultShortcuts();
		},

		setupDefaultShortcuts: function(){
			// summary: add some default key handlers
			// description:
			// 		Overwrite this to setup your own handlers. The default
			// 		implementation does not use Editor commands, but directly
			//		executes the builtin commands within the underlying browser
			//		support.
			var ctrl = this.KEY_CTRL;
			var exec = function(cmd, arg){
				return arguments.length == 1 ? function(){ this.execCommand(cmd); } :
					function(){ this.execCommand(cmd, arg); }
			}
			this.addKeyHandler("b", ctrl, exec("bold"));
			this.addKeyHandler("i", ctrl, exec("italic"));
			this.addKeyHandler("u", ctrl, exec("underline"));
			this.addKeyHandler("a", ctrl, exec("selectall"));
			this.addKeyHandler("s", ctrl, function () { this.save(true); });

			this.addKeyHandler("1", ctrl, exec("formatblock", "h1"));
			this.addKeyHandler("2", ctrl, exec("formatblock", "h2"));
			this.addKeyHandler("3", ctrl, exec("formatblock", "h3"));
			this.addKeyHandler("4", ctrl, exec("formatblock", "h4"));

			this.addKeyHandler("\\", ctrl, exec("insertunorderedlist"));
			if(!dojo.isIE){
				this.addKeyHandler("Z", ctrl, exec("redo"));
			}
		},

		// events: Array
		//		 events which should be connected to the underlying editing area
		events: ["onBlur", "onFocus", "onKeyPress", "onKeyDown", "onKeyUp", "onClick"],

		// events: Array
		//		 events which should be connected to the underlying editing
		//		 area, events in this array will be addListener with
		//		 capture=true
		captureEvents: [],

		_safariIsLeopard: function(){
			var gt420 = false;
			if(dojo.isSafari){
				var tmp = navigator.userAgent.split("AppleWebKit/")[1];
				var ver = parseFloat(tmp.split(" ")[0]);
				if(ver >= 420){ gt420 = true; }
			}
			return gt420;
		},

		_editorCommandsLocalized: false,
		_localizeEditorCommands: function(){
			if(this._editorCommandsLocalized){
				return;
			}
			this._editorCommandsLocalized = true;
			
			//in IE, names for blockformat is locale dependent, so we cache the values here

			//if the normal way fails, we try the hard way to get the list
		
			//do not use _cacheLocalBlockFormatNames here, as it will
			//trigger security warning in IE7

			//in the array below, ul can not come directly after ol,
			//otherwise the queryCommandValue returns Normal for it
			var formats = ['p', 'pre', 'address', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'div', 'ul'];
			var localhtml = "", format, i=0;
			while(format=formats[i++]){
				if(format.charAt(1) != 'l'){
					localhtml += "<"+format+"><span>content</span></"+format+">";
				}else{
					localhtml += "<"+format+"><li>content</li></"+format+">";
				}
			}
			//queryCommandValue returns empty if we hide editNode, so move it out of screen temporary
			with(this.iframe.style){
				position = "absolute";
				left = "-2000px";
				top = "-2000px";
			}
			this.editNode.innerHTML = localhtml;
			var node = this.editNode.firstChild;
			while(node){
				dojo.withGlobal(this.window, "selectElement", dijit._editor.selection, [node.firstChild]);
				var nativename = node.tagName.toLowerCase();
				this._local2NativeFormatNames[nativename] = this.queryCommandValue("formatblock");
				this._native2LocalFormatNames[this._local2NativeFormatNames[nativename]] = nativename;
				node = node.nextSibling;
			}
			with(this.iframe.style){
				position = "";
				left = "";
				top = "";
			}
		},

		open: function(/*DomNode, optional*/element){
			// summary:
			//		Transforms the node referenced in this.domNode into a rich text editing
			//		node. This will result in the creation and replacement with an <iframe>
			//		if designMode(FF)/contentEditable(IE) is used.
			
			if((!this.onLoadDeferred)||(this.onLoadDeferred.fired >= 0)){
				this.onLoadDeferred = new dojo.Deferred();
			}
			
			if(!this.isClosed){ this.close(); }
			dojo.publish("dijit._editor.RichText::open", [ this ]);
			
			this._content = "";
			if((arguments.length == 1)&&(element["nodeName"])){ this.domNode = element; } // else unchanged
			
			if(	(this.domNode["nodeName"])&&
				(this.domNode.nodeName.toLowerCase() == "textarea")){
				// if we were created from a textarea, then we need to create a
				// new editing harness node.
				this.textarea = this.domNode;
				this.name=this.textarea.name;
				var html = this._preFilterContent(this.textarea.value);
				this.domNode = dojo.doc.createElement("div");
				this.domNode.setAttribute('widgetId',this.id);
				this.textarea.removeAttribute('widgetId');
				this.domNode.cssText = this.textarea.cssText;
				this.domNode.className += " "+this.textarea.className;
				dojo.place(this.domNode, this.textarea, "before");
				var tmpFunc = dojo.hitch(this, function(){
					//some browsers refuse to submit display=none textarea, so
					//move the textarea out of screen instead
					with(this.textarea.style){
						display = "block";
						position = "absolute";
						left = top = "-1000px";

						if(dojo.isIE){ //nasty IE bug: abnormal formatting if overflow is not hidden
							this.__overflow = overflow;
							overflow = "hidden";
						}
					}
				});
				if(dojo.isIE){
					setTimeout(tmpFunc, 10);
				}else{
					tmpFunc();
				}

				// this.domNode.innerHTML = html;

//				if(this.textarea.form){
//					// FIXME: port: this used to be before advice!!!
//					dojo.connect(this.textarea.form, "onsubmit", this, function(){
//						// FIXME: should we be calling close() here instead?
//						this.textarea.value = this.getValue();
//					});
//				}
			}else{
				var html = this._preFilterContent(this.getNodeChildrenHtml(this.domNode));
				this.domNode.innerHTML = '';
			}
			if(html == ""){ html = "&nbsp;"; }

			var content = dojo.contentBox(this.domNode);
			// var content = dojo.contentBox(this.srcNodeRef);
			this._oldHeight = content.h;
			this._oldWidth = content.w;

			// FIXME: port to new style APIs instead?
			this._firstChildContributingMargin = this.height ? 0 : this._getContributingMargin(this.domNode, "top");
			this._lastChildContributingMargin = this.height ? 0 : this._getContributingMargin(this.domNode, "bottom");

			this.savedContent = html;

			// If we're a list item we have to put in a blank line to force the
			// bullet to nicely align at the top of text
			if(	(this.domNode["nodeName"]) &&
				(this.domNode.nodeName == "LI") ){
				this.domNode.innerHTML = " <br>";
			}

			this.editingArea = dojo.doc.createElement("div");
			this.domNode.appendChild(this.editingArea);

			if(this.name != "" && (!djConfig["useXDomain"] || djConfig["allowXdRichTextSave"])){
				var saveTextarea = dojo.byId("dijit._editor.RichText.savedContent");
				if(saveTextarea.value != ""){
					var datas = saveTextarea.value.split(this._SEPARATOR), i=0, dat;
					while(dat=datas[i++]){
						var data = dat.split(":");
						if(data[0] == this.name){
							html = data[1];
							datas.splice(i, 1);
							break;
						}
					}
				}
				// FIXME: need to do something different for Opera/Safari
				dojo.connect(window, "onbeforeunload", this, "_saveContent");
				// dojo.connect(window, "onunload", this, "_saveContent");
			}

			this.isClosed = false;
			// Safari's selections go all out of whack if we do it inline,
			// so for now IE is our only hero
			//if (typeof document.body.contentEditable != "undefined") {
			if(dojo.isIE || this._safariIsLeopard() || dojo.isOpera){ // contentEditable, easy
				var ifr = this.iframe = dojo.doc.createElement('iframe');
				ifr.src = 'javascript:void(0)';
				this.editorObject = ifr;
				ifr.style.border = "none";
				ifr.style.width = "100%";
				ifr.frameBorder = 0;
				this.editingArea.appendChild(ifr);
				this.window = ifr.contentWindow;
				this.document = this.window.document;
				this.document.open();
				this.document.write(this._getIframeDocTxt());
				this.document.close();
				if(this.height){
					this.editNode = this.document.body;
				}else{
					this.document.body.appendChild(this.document.createElement("div"));
					this.editNode = this.document.body.firstChild;
				}
				this.editNode.contentEditable = true;
				if(dojo.isIE >= 7){
					if(this.height){
						ifr.style.height = this.height;
					}
					if(this.minHeight){
						ifr.style.minHeight = this.minHeight;
					}
				}else{
					ifr.style.height = this.height ? this.height : this.minHeight;
				}

				// FIXME: setting contentEditable on switches this element to
				// IE's hasLayout mode, triggering weird margin collapsing
				// behavior. It's particularly bad if the element you're editing
				// contains childnodes that don't have margin: defined in local
				// css rules. It would be nice if it was possible to hack around
				// this. Sadly _firstChildContributingMargin and
				// _lastChildContributingMargin don't work on IE unless all
				// elements have margins set in CSS :-(
				
				this._localizeEditorCommands();
				
				this.editNode.innerHTML = html;
				this._preDomFilterContent(this.editNode);
				//	if(this.height){ this.document.body.style.overflowY="scroll"; }
				var events=this.events.concat(this.captureEvents);
				dojo.forEach(events, function(e){
					dojo.connect(this.editNode, e.toLowerCase(), this, e);
				}, this);
				
				this.onLoad();
			}else{ // designMode in iframe
				this._drawIframe(html);
				this.editorObject = this.iframe;
			}

			// TODO: this is a guess at the default line-height, kinda works
			if(this.domNode.nodeName == "LI"){ this.domNode.lastChild.style.marginTop = "-1.2em"; }
			this.domNode.className += " RichTextEditable";
		},

		//static cache variables shared among all instance of this class
		_local2NativeFormatNames: {},
		_native2LocalFormatNames: {},

		_hasCollapseableMargin: function(/*DomNode*/element, /*String*/side){
			// summary:
			//		check if an element has padding or borders on the given side
			//		which would prevent it from collapsing margins
			/*
			if(dojo.html.getPixelValue(element, 'border-'+side+'-width', false)){
				return false;
			}else if(dojo.html.getPixelValue(element, 'padding-'+side, false)){
				return false;
			}else{
				return true;
			}
			*/
		},

		// FIXME: need to port this to 0.9 methods
		_getContributingMargin:	function(/*DomNode*/element, /*String*/topOrBottom){
			// summary:
			//		calculate how much margin this element and its first or last
			//		child are contributing to the total margin between this element
			//		and the adjacent node. CSS border collapsing makes this
			//		necessary.

			return 0; // FIXME: port

			// FIXME: OMG. This has to be horribly inefficient.
			if(topOrBottom == "top"){
				var siblingAttr = "previousSibling";
				var childSiblingAttr = "nextSibling";
				var childAttr = "firstChild";
				var marginProp = "margin-top";
				var siblingMarginProp = "margin-bottom";
			}else{
				var siblingAttr = "nextSibling";
				var childSiblingAttr = "previousSibling";
				var childAttr = "lastChild";
				var marginProp = "margin-bottom";
				var siblingMarginProp = "margin-top";
			}

			var elementMargin = dojo.html.getPixelValue(element, marginProp, false);

			// FIXME: redef'd on every call!!
			function isSignificantNode(element){
				// see if an node is significant in the current context
				// for calulating margins
				return !(element.nodeType==3 && dojo.string.isBlank(element.data))
					&& dojo.html.getStyle(element, "display") != "none"
					&& !dojo.html.isPositionAbsolute(element);
			}

			// walk throuh first/last children to find total collapsed margin size
			var childMargin = 0;
			var child = element[childAttr];
			while(child){
				// skip over insignificant elements (whitespace, etc)
				while((!isSignificantNode(child)) && child[childSiblingAttr]){
					child = child[childSiblingAttr];
				}

				childMargin = Math.max(childMargin, dojo.html.getPixelValue(child, marginProp, false));
				// stop if we hit a bordered/padded element
				if (!this._hasCollapseableMargin(child, topOrBottom)) break;
				child = child[childAttr];
			}

			// if this element has a border, return full child margin immediately
			// as there won't be any margin collapsing
			if (!this._hasCollapseableMargin(element, topOrBottom)){ return parseInt(childMargin); }

			// find margin supplied by nearest sibling
			var contextMargin = 0;
			var sibling = element[siblingAttr];
			while(sibling){
				if(isSignificantNode(sibling)){
					contextMargin = dojo.html.getPixelValue(sibling,
															 siblingMarginProp,
															 false);
					break;
				}
				sibling = sibling[siblingAttr];
			}
			if(!sibling){ // no sibling, look at parent's margin instead
				contextMargin = dojo.html.getPixelValue(element.parentNode, marginProp, false);
			}

			if(childMargin > elementMargin){
				return parseInt(Math.max((childMargin-elementMargin)-contextMargin, 0));
			}else{
				return 0;
			}
		},

		_getIframeDocTxt: function(){
			var _cs = dojo.getComputedStyle(this.domNode);

			var font = [ _cs.fontWeight, _cs.fontSize, _cs.fontFamily ].join(" ");

			// line height is tricky - applying a units value will mess things up.
			// if we can't get a non-units value, bail out.
			var lineHeight = _cs.lineHeight;
			if(lineHeight.indexOf("px") >= 0){
				lineHeight = parseFloat(lineHeight)/parseFloat(_cs.fontSize);
				// console.debug(lineHeight);
			}else if(lineHeight.indexOf("em")>=0){
				lineHeight = parseFloat(lineHeight);
			}else{
				lineHeight = "1.0";
			}
			return [
				"<html><head><style>",
				"body,html {",
				"	background:transparent;",
				"	padding: 0;",
				"	margin: 0;",
				"}",
				// TODO: left positioning will case contents to disappear out of view
				//       if it gets too wide for the visible area
				"body{",
				"	top:0px; left:0px; right:0px;",
					((this.height||dojo.isOpera) ? "" : "position: fixed;"),
				"	font:", font, ";",
				// FIXME: IE 6 won't understand min-height?
				"	min-height:", this.minHeight, ";",
				"	line-height:", lineHeight,
				"}",
				"p{ margin: 1em 0 !important; }",
				(this.height ?
					"" :
					"body > *:first-child{ padding-top:0 !important;margin-top:" + this._firstChildContributingMargin + "px !important;}" + // FIXME: test firstChild nodeType
					"body > *:last-child {"+
					"	padding-bottom:0 !important;"+
					"	margin-bottom:" + this._lastChildContributingMargin + "px !important;"+
					"}"
				),
				"li > ul:-moz-first-node, li > ol:-moz-first-node{ padding-top: 1.2em; } ",
				"li{ min-height:1.2em; }",
				"</style>",
				this._applyEditingAreaStyleSheets(),
				"</head><body></body></html>"
			].join("");
		},

		_drawIframe: function(/*String*/html){
			// summary:
			//		Draws an iFrame using the existing one if one exists.
			//		Used by Mozilla, Safari, and Opera

			if(!this.iframe){
				var ifr = this.iframe = dojo.doc.createElement("iframe");
				// this.iframe.src = "about:blank";
				// document.body.appendChild(this.iframe);
				// console.debug(this.iframe.contentDocument.open());
				// dojo.body().appendChild(this.iframe);
				var ifrs = ifr.style;
				// ifrs.border = "1px solid black";
				ifrs.border = "none";
				ifrs.lineHeight = "0"; // squash line height
				ifrs.verticalAlign = "bottom";
				ifrscrolling = this.height ? "auto" : "vertical";
			}
			// opera likes this to be outside the with block
			//	this.iframe.src = "javascript:void(0)";//dojo.uri.dojoUri("src/widget/templates/richtextframe.html") + ((dojo.doc.domain != currentDomain) ? ("#"+dojo.doc.domain) : "");
			this.iframe.style.width = this.inheritWidth ? this._oldWidth : "100%";

			if(this.height){
				this.iframe.style.height = this.height;
			}else{
				var height = this._oldHeight;
				if(this._hasCollapseableMargin(this.domNode, 'top')){
					height += this._firstChildContributingMargin;
				}
				if(this._hasCollapseableMargin(this.domNode, 'bottom')){
					height += this._lastChildContributingMargin;
				}
				this.iframe.height = height;
			}

			if(this.textarea){
				var tmpContent = this.srcNodeRef;
			}else{
				var tmpContent = dojo.doc.createElement('div');
				tmpContent.style.display="none";
				tmpContent.innerHTML = html;
				//append tmpContent to under the current domNode so that the margin
				//calculation below is correct
				this.editingArea.appendChild(tmpContent);
			}


			this.editingArea.appendChild(this.iframe);

			if(!this.height){
				// fix margins on tmpContent
				var c = dojo.query(">", tmpContent);
				var firstChild = c[0];
				var lastChild = c.pop();
				if(firstChild){
					firstChild.style.marginTop = this._firstChildContributingMargin+"px";
				}
				if(lastChild){
					lastChild.style.marginBottom = this._lastChildContributingMargin+"px";
				}
			}
			//do we want to show the content before the editing area finish loading here?
			//if external style sheets are used for the editing area, the appearance now
			//and after loading of the editing area won't be the same (and padding/margin
			//calculation above may not be accurate)
			//	tmpContent.style.display = "none";
			//	this.editingArea.appendChild(this.iframe);

			var _iframeInitialized = false;
			// console.debug(this.iframe);
			// var contentDoc = this.iframe.contentWindow.document;


			// note that on Safari lower than 420+, we have to get the iframe
			// by ID in order to get something w/ a contentDocument property

			var contentDoc = this.iframe.contentDocument;
			contentDoc.open();
			contentDoc.write(this._getIframeDocTxt());
			contentDoc.close();

			// now we wait for onload. Janky hack!
			var ifrFunc = dojo.hitch(this, function(){
				if(!_iframeInitialized){
					_iframeInitialized = true;
				}else{ return; }
				if(!this.editNode){
					if(this.iframe.contentWindow){
						this.window = this.iframe.contentWindow;
						this.document = this.iframe.contentWindow.document
					}else if(this.iframe.contentDocument){
						// for opera
						this.window = this.iframe.contentDocument.window;
						this.document = this.iframe.contentDocument;
					}

					dojo._destroyElement(tmpContent);
					dojo.query("body", this.document.documentElement)[0].innerHTML = html;
					this.document.designMode = "on";
					//	try{
					//	this.document.designMode = "on";
					// }catch(e){
					//	this._tryDesignModeOnClick=true;
					// }
					try{
						var currentDomain = (new dojo._Url(dojo.doc.location)).host;
						if(dojo.doc.domain!=currentDomain){
							this.document.domain = dojo.doc.domain;
						}
					}catch(e){}

					this.onLoad();
				}else{
					dojo._destroyElement(tmpContent);
					this.editNode.innerHTML = html;
					this.onDisplayChanged();
				}
				this._preDomFilterContent(this.editNode);
			});

			if(this.editNode){
				ifrFunc(); // iframe already exists, just set content
			}else if(dojo.isMoz){
				//mozilla requires some time to make the iframe content window/document ready
				setTimeout(ifrFunc, 250);
			}else{ // opera, safari
				ifrFunc();
			}
		},

		_applyEditingAreaStyleSheets: function(){
			// summary:
			//		apply the specified css files in styleSheets
			var files = [];
			if(this.styleSheets){
				files = this.styleSheets.split(';');
				this.styleSheets = '';
			}

			//empty this.editingAreaStyleSheets here, as it will be filled in addStyleSheet
			files = files.concat(this.editingAreaStyleSheets);
			this.editingAreaStyleSheets = [];

			var text='', i=0, url;
			while(url=files[i++]){
				var abstring = (new dojo._Url(dojo.global.location, url)).toString();
				this.editingAreaStyleSheets.push(abstring);
				text += '<link rel="stylesheet" type="text/css" href="'+abstring+'"/>'
 			}
			return text;
		},

		addStyleSheet: function(/*dojo._Url*/uri){
			// summary:
			//		add an external stylesheet for the editing area
			// uri:	a dojo.uri.Uri pointing to the url of the external css file
			var url=uri.toString();
			if(dojo.indexOf(this.editingAreaStyleSheets, url) > -1){
				console.debug("dijit._editor.RichText.addStyleSheet: Style sheet "+url+" is already applied to the editing area!");
				return;
			}

			//if uri is relative, then convert it to absolute so that it can be resolved correctly in iframe
			if(url.charAt(0) == '.' || (url.charAt(0) != '/' && !uri.host)){
				url = (new dojo._Url(dojo.global.location, url)).toString();
			}

			this.editingAreaStyleSheets.push(url);
			if(this.document.createStyleSheet){ //IE
				this.document.createStyleSheet(url);
			}else{ //other browser
				var head = this.document.getElementsByTagName("head")[0];
				var stylesheet = this.document.createElement("link");
				with(stylesheet){
					rel="stylesheet";
					type="text/css";
					href=url;
				}
				head.appendChild(stylesheet);
			}
		},

		removeStyleSheet: function(/*dojo._Url*/uri){
			// summary:
			//		remove an external stylesheet for the editing area
			var url=uri.toString();
			//if uri is relative, then convert it to absolute so that it can be resolved correctly in iframe
			if(url.charAt(0) == '.' || (url.charAt(0) != '/' && !uri.host)){
				url = (new dojo._Url(dojo.global.location, url)).toString();
			}
			var index = dojo.indexOf(this.editingAreaStyleSheets, url);
			if(index == -1){
				console.debug("dijit._editor.RichText.removeStyleSheet: Style sheet "+url+" is not applied to the editing area so it can not be removed!");
				return;
			}
			delete this.editingAreaStyleSheets[index];

			var link, i=0, links = this.document.getElementsByTagName("link");
			while(link=links[i++]){
				if(link.href == url){
					if(dojo.isIE){//we need to empty the href first, to get IE to remove the rendered styles
						link.href="";
					}
					// FIXME
					dojo.html.removeNode(link);
					break;
				}
			}
		},

		disabled: false,
		setDisabled: function(/*Boolean*/ disabled){
			if(dojo.isIE || this._safariIsLeopard() || dojo.isOpera){
				this.editNode.contentEditable=!disabled;
			}else{ //moz
				this.document.execCommand('contentReadOnly', false, disabled);
//				if(disabled){
//					this.blur(); //to remove the blinking caret
//				}
//				this.document.designMode=(disabled?'off':'on');
			}
			this.disabled=disabled;
		},

	/* Event handlers
	 *****************/

		_isResized: function(){ return false; },

		onLoad: function(e){
			// summary: handler after the content of the document finishes loading
			this.isLoaded = true;
			if(this.iframe && !dojo.isIE){
				this.editNode = this.document.body;
				if(!this.height){
					this.connect(this, "onDisplayChanged", "_updateHeight");
				}

				try{ // sanity check for Mozilla
//					this.document.execCommand("useCSS", false, true); // old moz call
					this.document.execCommand("styleWithCSS", false, false); // new moz call
					//this.document.execCommand("insertBrOnReturn", false, false); // new moz call
				}catch(e2){ }

				if(dojo.isSafari){
					/*
					this.iframe.style.visiblity = "visible";
					this.iframe.style.border = "1px solid black";
					this.editNode.style.visiblity = "visible";
					this.editNode.style.border = "1px solid black";
					*/
					// this.onDisplayChanged();
					this.connect(this.editNode, "onblur", "onBlur");
					this.connect(this.editNode, "onfocus", "onFocus");
					this.connect(this.editNode, "onclick", "onFocus");

					this.interval = setInterval(dojo.hitch(this, "onDisplayChanged"), 750);
					// throw new Error("onload");
				}else if(dojo.isMoz || dojo.isOpera){
					var doc = this.document;
					var events=this.events.concat(this.captureEvents);
					dojo.forEach(events, function(e){
						var l = dojo.connect(this.document, e.toLowerCase(), dojo.hitch(this, e));
						if(e=="onBlur"){
							// We need to unhook the blur event listener on close as we
							// can encounter a garunteed crash in FF if another event is
							// also fired
							// FIXME:
							/*
							var unBlur = { unBlur: function(e){
									// FIXME
									dojo.event.browser.removeListener(doc, "blur", l);
							} };
							// FIXME: need a to attach before!
							// dojo.connect("before", this, "close", unBlur, "unBlur");
							*/
						}
					}, this);
				}
				// FIXME: when scrollbars appear/disappear this needs to be fired
			}else if(dojo.isIE){
				// IE contentEditable
				if(!this.height){
					this.connect(this, "onDisplayChanged", "_updateHeight");
				}
				// give the node Layout on IE
				this.editNode.style.zoom = 1.0;
			}

			if(this.focusOnLoad){
				this.focus();
			}
			this.onDisplayChanged(e);
			if(this.onLoadDeferred){
				this.onLoadDeferred.callback(true);
			}
			if(this.blockNodeForEnter=='BR'){
				if(dojo.isIE){
					this._fixNewLineBehaviorForIE();
				}else{
					try{
						this.document.execCommand("insertBrOnReturn", false, true);
					}catch(e){}
				}
			}
		},

		onKeyDown: function(e){
			// summary: Fired on keydown

			// console.debug("onkeydown:", e.keyCode);

			// we need this event at the moment to get the events from control keys
			// such as the backspace. It might be possible to add this to Dojo, so that
			// keyPress events can be emulated by the keyDown and keyUp detection.
			if((dojo.isIE)&&(e.keyCode == dojo.keys.TAB)){
				e.preventDefault();
				e.stopPropagation();
				// FIXME: this is a poor-man's indent/outdent. It would be
				// better if it added 4 "&nbsp;" chars in an undoable way.
				// Unfortuantly pasteHTML does not prove to be undoable
				this.execCommand((e.shiftKey ? "outdent" : "indent"));
			}else if(dojo.isIE){
				// FIXME: get this from connect() instead!
				if(	(65 <= e.keyCode&&e.keyCode <= 90) ||
					(e.keyCode>=37&&e.keyCode<=40)
				){ //arrow keys
					e.charCode = e.keyCode;
					this.onKeyPress(e);
				}
			}
		},

		onKeyUp: function(e){
			// summary: Fired on keyup
			return;
		},

		KEY_CTRL: 1,
		KEY_SHIFT: 2,

		onKeyPress: function(e){
			// summary: Fired on keypress

			// console.debug("onkeypress:", e.keyCode);

			// handle the various key events
			var modifiers = e.ctrlKey ? this.KEY_CTRL : 0 | e.shiftKey?this.KEY_SHIFT : 0;

			// var key = e.key||e.keyCode;
			var key = e.keyChar;
			if(this._keyHandlers[key]){
				// dojo.debug("char:", e.key);
				var handlers = this._keyHandlers[key], i = 0, h;
				while(h = handlers[i++]){
					if(modifiers == h.modifiers){
						if(!h.handler.apply(this,arguments)){
							e.preventDefault();
						}
						break;
					}
				}
			}

			// function call after the character has been inserted
			setTimeout(dojo.hitch(this, function(){
				this.onKeyPressed(e);
			}), 1);
		},

		addKeyHandler: function(/*String*/key, /*Int*/modifiers, /*Function*/handler){
			// summary: add a handler for a keyboard shortcut
			if(!dojo.isArray(this._keyHandlers[key])){ this._keyHandlers[key] = []; }
			this._keyHandlers[key].push({
				modifiers: modifiers || 0,
				handler: handler
			});
		},

		onKeyPressed: function(e){
			if(this._checkListLater){
				// FIXME:
				if(dojo.withGlobal(this.window, 'isCollapsed', dijit._editor.selection)){
					// FIXME:
					if(!dojo.withGlobal(this.window, 'hasAncestorElement', dijit._editor.selection, ['LI'])){
						//circulate the undo detection code by calling RichText::execCommand directly
						// FIXME:
						dijit._editor.RichText.prototype.execCommand.apply(this, ['formatblock',this.blockNodeForEnter]);
						//set the innerHTML of the new block node
						var block = dojo.withGlobal(this.window, 'getAncestorElement', dijit._editor.selection, [this.blockNodeForEnter])
						if(block){
							block.innerHTML=this.bogusHtmlContent;
							if(dojo.isIE){
								//the following won't work, it will move the caret to the last list item in the previous list
	//							var newrange = dojo.html.range.create();
	//							newrange.setStart(block.firstChild,0);
	//							var selection = dojo.html.range.getSelection(this.editor.window)
	//							selection.removeAllRanges();
	//							selection.addRange(newrange);
								//move to the start by move backward one char
								var r = this.document.selection.createRange();
								r.move('character',-1);
								r.select();
							}
						}else{
							alert('onKeyPressed: Can not find the new block node');
						}
					}
				}
				this._checkListLater = false;
			}else if(this._pressedEnterInBlock){
				//the new created is the original current P, so we have previousSibling below
				this.removeTrailingBr(this._pressedEnterInBlock.previousSibling);
				delete this._pressedEnterInBlock;
			}
			this.onDisplayChanged(/*e*/); // can't pass in e
		},

		// blockNodeForEnter: String
		//		this property decides the behavior of Enter key. It can be either P,
		//		DIV, BR, or empty (which means disable this feature). Anything else
		//		will trigger errors.
		blockNodeForEnter: 'BR',
		bogusHtmlContent: '&nbsp;',
		handleEnterKey: function(e){
			// summary: manually handle enter key event to make the behavior consistant across
			//	all supported browsers. See property blockNodeForEnter for available options
			if(!this.blockNodeForEnter){ return true; } //let browser handle this
			if(e.shiftKey  //shift+enter always generates <br>
			    || this.blockNodeForEnter=='BR'){
				// FIXME
				var parent = dojo.withGlobal(this.window, "getParentElement", dijit._editor.selection);
				// FIXME
				var header = dojo.html.range.getAncestor(parent,/^(?:H1|H2|H3|H4|H5|H6|LI)$/);
				if(header){
					if(header.tagName=='LI'){
						return true; //let brower handle
					}
					// FIXME
					var selection = dojo.html.range.getSelection(this.window);
					var range = selection.getRangeAt(0);
					if(!range.collapsed){
						range.deleteContents();
					}
					// FIXME
					if(dojo.html.range.atBeginningOfContainer(header, range.startContainer, range.startOffset)){
						dojo.place(this.document.createElement('br'), header, "before");
					}else if(dojo.html.range.atEndOfContainer(header, range.startContainer, range.startOffset)){
						dojo.place(this.document.createElement('br'), header, "after");
						// FIXME
						var newrange = dojo.html.range.create();
						newrange.setStartAfter(header);

						selection.removeAllRanges();
						selection.addRange(newrange);
					}else{
						return true; //let brower handle
					}
				}else{
					//don't change this: do not call this.execCommand, as that may have other logic in subclass
					// FIXME
					dijit._editor.RichText.prototype.execCommand.call(this, 'inserthtml', '<br>');
				}
				return false;
			}
			var _letBrowserHandle = true;
			//blockNodeForEnter is either P or DIV
			//first remove selection
			// FIXME
			var selection = dojo.html.range.getSelection(this.window);
			var range = selection.getRangeAt(0);
			if(!range.collapsed){
				range.deleteContents();
			}

			// FIXME
			var block = dojo.html.range.getBlockAncestor(range.endContainer, null, this.editNode);

			if(block.blockNode && block.blockNode.tagName == 'LI'){
				this._checkListLater = true;
				return true;
			}else{
				this._checkListLater = false;
			}

			//text node directly under body, let's wrap them in a node
			if(!block.blockNode){
				this.document.execCommand('formatblock',false, this.blockNodeForEnter);
				//get the newly created block node
				// FIXME
				block = {blockNode:dojo.withGlobal(this.window, "getAncestorElement", dijit._editor.selection, [this.blockNodeForEnter]),
						blockContainer: this.editNode};
				if(block.blockNode){
					if(dojo.html.textContent(block.blockNode).replace(/^\s+|\s+$/g, "").length==0){
						this.removeTrailingBr(block.blockNode);
						return false;
					}
				}else{
					block.blockNode = this.editNode;
				}
				selection = dojo.html.range.getSelection(this.window);
				range = selection.getRangeAt(0);
			}
			var newblock = this.document.createElement(this.blockNodeForEnter);
			newblock.innerHTML=this.bogusHtmlContent;
			this.removeTrailingBr(block.blockNode);
			if(dojo.html.range.atEndOfContainer(block.blockNode, range.endContainer, range.endOffset)){
				if(block.blockNode === block.blockContainer){
					block.blockNode.appendChild(newblock);
				}else{
					dojo.html.insertAfter(newblock,block.blockNode);
				}
				_letBrowserHandle = false;
				//lets move caret to the newly created block
				var newrange = dojo.html.range.create();
				newrange.setStart(newblock,0);
				selection.removeAllRanges();
				selection.addRange(newrange);
				if(this.height){
					newblock.scrollIntoView(false);
				}
			}else if(dojo.html.range.atBeginningOfContainer(block.blockNode,
					range.startContainer, range.startOffset)){
				if(block.blockNode === block.blockContainer){
					dojo.html.prependChild(newblock,block.blockNode);
				}else{
					dojo.html.insertBefore(newblock,block.blockNode);
				}
				if(this.height){
					//browser does not scroll the caret position into view, do it manually
					newblock.scrollIntoView(false);
				}
				_letBrowserHandle = false;
			}else{ //press enter in the middle of P
				if(dojo.isMoz){
					//press enter in middle of P may leave a trailing <br/>, let's remove it later
					this._pressedEnterInBlock = block.blockNode;
				}
			}
			return _letBrowserHandle;
		},
		removeTrailingBr: function(container){
			if(/P|DIV|LI/i .test(container.tagName)){
				var para = container;
			}else{
				var para = dijit._editor.selection.getParentOfType(container,['P','DIV','LI']);
			}

			if(!para){ return; }
			if(para.lastChild){
				if(para.childNodes.length>1 && para.lastChild.nodeType==3 && /^[\s\xAD]*$/ .test(para.lastChild.nodeValue)){
					dojo._destroyElement(para.lastChild);
				}
				if(para.lastChild && para.lastChild.tagName=='BR'){
					dojo._destroyElement(para.lastChild);
				}
			}
			if(para.childNodes.length==0){
				para.innerHTML=this.bogusHtmlContent;
			}
		},
		onClick: function(e){
//			dojo.debug('onClick',this._tryDesignModeOnClick);
//			if(this._tryDesignModeOnClick){
//				try{
//					this.document.designMode='on';
//					this._tryDesignModeOnClick=false;
//				}catch(e){}
//			}
			this.onDisplayChanged(e); },
		onBlur: function(e){ },
		_initialFocus: true,
		onFocus: function(e){
			// summary: Fired on focus
			if( (dojo.isMoz)&&(this._initialFocus) ){
				this._initialFocus = false;
				if(this.editNode.innerHTML.replace(/^\s+|\s+$/g, "") == "&nbsp;"){
					this.placeCursorAtStart();
//					this.execCommand("selectall");
//					this.window.getSelection().collapseToStart();
				}
			}
		},

		blur: function(){
			// summary: remove focus from this instance
			if(this.iframe){
				this.window.blur();
			}else if(this.editNode){
				this.editNode.blur();
			}
		},

		focus: function(){
			// summary: move focus to this instance
			if(this.iframe && !dojo.isIE){
				dijit.focus(this.iframe);
			}else if(this.editNode && this.editNode.focus){
				// editNode may be hidden in display:none div, lets just punt in this case
				dijit.focus(this.editNode);
			}else{
				console.debug("Have no idea how to focus into the editor!");
			}
		},

//		_lastUpdate: 0,
		updateInterval: 200,
		_updateTimer: null,
		onDisplayChanged: function(e){
			// summary:
			//		this event will be fired everytime the display context
			//		changes and the result needs to be reflected in the UI.
			// description:
			//		if you don't want to have update too often, 
			//		onNormlizedDisplayChanged should be used instead

//			var _t=new Date();
			if(!this._updateTimer){
//				this._lastUpdate=_t;
				if(this._updateTimer){
					clearTimeout(this._updateTimer);
				}
				this._updateTimer=setTimeout(dojo.hitch(this,this.onNormlizedDisplayChanged),this.updateInterval);
			}
		},
		onNormlizedDisplayChanged: function(){
			// summary:
			//		this event is fired every updateInterval ms or more
			// description:
			//		if something needs to happen immidiately after a 
			//		user change, please use onDisplayChanged instead
			this._updateTimer=null;
		},
		_normalizeCommand: function(/*String*/cmd){
			// summary:
			//		Used as the advice function by dojo.connect to map our
			//		normalized set of commands to those supported by the target
			//		browser

			var command = cmd.toLowerCase();
			if(command == "formatblock"){
				if(dojo.isSafari){ command = "heading"; }
			}else if(command == "hilitecolor" && !dojo.isMoz){
				command = "backcolor";
			}

			return command;
		},

		queryCommandAvailable: function(/*String*/command){
			// summary:
			//		Tests whether a command is supported by the host. Clients SHOULD check
			//		whether a command is supported before attempting to use it, behaviour
			//		for unsupported commands is undefined.
			// command: The command to test for
			var ie = 1;
			var mozilla = 1 << 1;
			var safari = 1 << 2;
			var opera = 1 << 3;
			var safari420 = 1 << 4;

			var gt420 = this._safariIsLeopard();

			function isSupportedBy(browsers){
				return {
					ie: Boolean(browsers & ie),
					mozilla: Boolean(browsers & mozilla),
					safari: Boolean(browsers & safari),
					safari420: Boolean(browsers & safari420),
					opera: Boolean(browsers & opera)
				}
			}

			var supportedBy = null;

			switch(command.toLowerCase()){
				case "bold": case "italic": case "underline":
				case "subscript": case "superscript":
				case "fontname": case "fontsize":
				case "forecolor": case "hilitecolor":
				case "justifycenter": case "justifyfull": case "justifyleft":
				case "justifyright": case "delete": case "selectall":
					supportedBy = isSupportedBy(mozilla | ie | safari | opera);
					break;

				case "createlink": case "unlink": case "removeformat":
				case "inserthorizontalrule": case "insertimage":
				case "insertorderedlist": case "insertunorderedlist":
				case "indent": case "outdent": case "formatblock":
				case "inserthtml": case "undo": case "redo": case "strikethrough":
					supportedBy = isSupportedBy(mozilla | ie | opera | safari420);
					break;

				case "blockdirltr": case "blockdirrtl":
				case "dirltr": case "dirrtl":
				case "inlinedirltr": case "inlinedirrtl":
					supportedBy = isSupportedBy(ie);
					break;
				case "cut": case "copy": case "paste":
					supportedBy = isSupportedBy( ie | mozilla | safari420);
					break;

				case "inserttable":
					supportedBy = isSupportedBy(mozilla | ie);
					break;

				case "insertcell": case "insertcol": case "insertrow":
				case "deletecells": case "deletecols": case "deleterows":
				case "mergecells": case "splitcell":
					supportedBy = isSupportedBy(ie | mozilla);
					break;

				default: return false;
			}

			return (dojo.isIE && supportedBy.ie) ||
				(dojo.isMoz && supportedBy.mozilla) ||
				(dojo.isSafari && supportedBy.safari) ||
				(gt420 && supportedBy.safari420) ||
				(dojo.isOpera && supportedBy.opera);  // Boolean return true if the command is supported, false otherwise
		},

		execCommand: function(/*String*/command, argument){
			// summary: Executes a command in the Rich Text area
			// command: The command to execute
			// argument: An optional argument to the command
			var returnValue;

			//focus() is required for IE to work
			//In addition, focus() makes sure after the execution of
			//the command, the editor receives the focus as expected
			this.focus();

			command = this._normalizeCommand(command);
			if(argument != undefined){
				if(command == "heading"){
					throw new Error("unimplemented");
				}else if((command == "formatblock") && dojo.isIE){
					argument = '<'+argument+'>';
				}
			}
			if(command == "inserthtml"){
				//TODO: we shall probably call _preDomFilterContent here as well
				argument=this._preFilterContent(argument);
				if(dojo.isIE){
					var insertRange = this.document.selection.createRange();
					insertRange.pasteHTML(argument);
					insertRange.select();
					//insertRange.collapse(true);
					return true;
				}else if(dojo.isMoz && !argument.length){
					//mozilla can not inserthtml an empty html to delete current selection
					//so we delete the selection instead in this case
					dojo.withGlobal(this.window,'remove',dijit._editor.selection); // FIXME
					return true;
				}else{
					return this.document.execCommand(command, false, argument);
				}
			}else if(
				(command == "unlink")&&
				(this.queryCommandEnabled("unlink"))&&
				(dojo.isMoz || dojo.isSafari)
			){
				// fix up unlink in Mozilla to unlink the link and not just the selection

				// grab selection
				// Mozilla gets upset if we just store the range so we have to
				// get the basic properties and recreate to save the selection
				var selection = this.window.getSelection();
				//	var selectionRange = selection.getRangeAt(0);
				//	var selectionStartContainer = selectionRange.startContainer;
				//	var selectionStartOffset = selectionRange.startOffset;
				//	var selectionEndContainer = selectionRange.endContainer;
				//	var selectionEndOffset = selectionRange.endOffset;

				// select our link and unlink
				var a = dojo.withGlobal(this.window, "getAncestorElement",dijit._editor.selection, ['a']);
				dojo.withGlobal(this.window, "selectElement", dijit._editor.selection, [a]);

				return this.document.execCommand("unlink", false, null);
			}else if((command == "hilitecolor")&&(dojo.isMoz)){
//				// mozilla doesn't support hilitecolor properly when useCSS is
//				// set to false (bugzilla #279330)

//				this.document.execCommand("useCSS", false, false);
				returnValue = this.document.execCommand(command, false, argument);
//				this.document.execCommand("useCSS", false, true);

			}else if((dojo.isIE)&&( (command == "backcolor")||(command == "forecolor") )){
				// Tested under IE 6 XP2, no problem here, comment out
				// IE weirdly collapses ranges when we exec these commands, so prevent it
//				var tr = this.document.selection.createRange();
				argument = arguments.length > 1 ? argument : null;
				returnValue = this.document.execCommand(command, false, argument);

				// timeout is workaround for weird IE behavior were the text
				// selection gets correctly re-created, but subsequent input
				// apparently isn't bound to it
//				setTimeout(function(){tr.select();}, 1);
			}else{
				argument = arguments.length > 1 ? argument : null;
//				if(dojo.isMoz){
//					this.document = this.iframe.contentWindow.document
//				}

				if(argument || command!="createlink"){
					returnValue = this.document.execCommand(command, false, argument);
				}
			}

			this.onDisplayChanged();
			return returnValue;
		},

		queryCommandEnabled: function(/*String*/command){
			// summary: check whether a command is enabled or not
			command = this._normalizeCommand(command);
			if(dojo.isMoz || dojo.isSafari){
				if(command == "unlink"){ // mozilla returns true always
					// console.debug(dojo.withGlobal(this.window, "hasAncestorElement",dijit._editor.selection, ['a']));
					return dojo.withGlobal(this.window, "hasAncestorElement",dijit._editor.selection, ['a']);
				}else if (command == "inserttable"){
					return true;
				}
			}

			// return this.document.queryCommandEnabled(command);
			var elem = (dojo.isIE) ? this.document.selection.createRange() : this.document;
			return elem.queryCommandEnabled(command);
		},

		queryCommandState: function(command){
			// summary: check the state of a given command
			command = this._normalizeCommand(command);
			return this.document.queryCommandState(command);
		},

		queryCommandValue: function(command){
			// summary: check the value of a given command
			command = this._normalizeCommand(command);
			if(dojo.isIE && command == "formatblock"){
				return this._local2NativeFormatNames[this.document.queryCommandValue(command)] || this.document.queryCommandValue(command);
			}
			return this.document.queryCommandValue(command);
		},

		// Misc.

		placeCursorAtStart: function(){
			// summary:
			//		place the cursor at the start of the editing area
			this.focus();

			//see comments in placeCursorAtEnd
			var isvalid=false;
			if(dojo.isMoz){
				var first=this.editNode.firstChild;
				while(first){
					if(first.nodeType == 3){
						if(first.nodeValue.replace(/^\s+|\s+$/g, "").length>0){
							isvalid=true;
							dojo.withGlobal(this.window, "selectElement", dijit._editor.selection, [first]);
							break;
						}
					}else if(first.nodeType == 1){
						isvalid=true;
						dojo.withGlobal(this.window, "selectElementChildren",dijit._editor.selection, [first]);
						break;
					}
					first = first.nextSibling;
				}
			}else{
				isvalid=true;
				dojo.withGlobal(this.window, "selectElementChildren",dijit._editor.selection, [this.editNode]);
			}
			if(isvalid){
				dojo.withGlobal(this.window, "collapse", dijit._editor.selection, [true]);
			}
		},

		placeCursorAtEnd: function(){
			// summary:
			//		place the cursor at the end of the editing area
			this.focus();

			//In mozilla, if last child is not a text node, we have to use selectElementChildren on this.editNode.lastChild
			//otherwise the cursor would be placed at the end of the closing tag of this.editNode.lastChild
			var isvalid=false;
			if(dojo.isMoz){
				var last=this.editNode.lastChild;
				while(last){
					if(last.nodeType == 3){
						if(last.nodeValue.replace(/^\s+|\s+$/g, "").length>0){
							isvalid=true;
							dojo.withGlobal(this.window, "selectElement",dijit._editor.selection, [last]);
							break;
						}
					}else if(last.nodeType == 1){
						isvalid=true;
						if(last.lastChild){
							dojo.withGlobal(this.window, "selectElement",dijit._editor.selection, [last.lastChild]);
						}else{
							dojo.withGlobal(this.window, "selectElement",dijit._editor.selection, [last]);
						}
						break;
					}
					last = last.previousSibling;
				}
			}else{
				dojo.withGlobal(this.window, "selectElementChildren",dijit._editor.selection, [this.editNode]);
			}
			if(isvalid){
				dojo.withGlobal(this.window, "collapse", dijit._editor.selection, [false]);
			}
		},

		getValue: function(/*Boolean?*/nonDestructive){
			// summary:
			//		return the current content of the editing area (post filters are applied)
			if(this.textarea){
				if(this.isClosed || !this.isLoaded){
					return this.textarea.value;
				}
			}

			return this._postFilterContent(null, nonDestructive);
		},

		setValue: function(/*String*/html){
			// summary:
			//		this function set the content. No undo history is preserved
			if(this.textarea && (this.isClosed || !this.isLoaded)){
				this.textarea.value=html;
			}else{
				html = this._preFilterContent(html);
				if(this.isClosed){
					this.domNode.innerHTML = html;
					this._preDomFilterContent(this.domNode);
				}else{
					this.editNode.innerHTML = html;
					this._preDomFilterContent(this.editNode);
				}
			}
		},

		replaceValue: function(/*String*/html){
			// summary:
			//		this function set the content while trying to maintain the undo stack
			//		(now only works fine with Moz, this is identical to setValue in all
			//		other browsers)
			if(this.isClosed){
				this.setValue(html);
			}else if(this.window && this.window.getSelection && !dojo.isMoz){ // Safari
				// look ma! it's a totally f'd browser!
				this.setValue(html);
			}else if(this.window && this.window.getSelection){ // Moz
				html = this._preFilterContent(html);
				this.execCommand("selectall");
				if(dojo.isMoz && !html){ html = "&nbsp;" }
				this.execCommand("inserthtml", html);
				this._preDomFilterContent(this.editNode);
			}else if(this.document && this.document.selection){//IE
				//In IE, when the first element is not a text node, say
				//an <a> tag, when replacing the content of the editing
				//area, the <a> tag will be around all the content
				//so for now, use setValue for IE too
				this.setValue(html);
			}
		},

		_preFilterContent: function(/*String*/html){
			// summary:
			//		filter the input before setting the content of the editing area
			var ec = html;
			dojo.forEach(this.contentPreFilters, function(ef){ if(ef){ ec = ef(ec); } });
			return ec;
		},
		_preDomFilterContent: function(/*DomNode*/dom){
			// summary:
			//		filter the input
			dom = dom || this.editNode;
			dojo.forEach(this.contentDomPreFilters, function(ef){
				if(ef && dojo.isFunction(ef)){
					ef(dom);
				}
			}, this);
		},

		_postFilterContent: function(/*DomNode|DomNode[]?*/dom,/*Boolean?*/nonDestructive){
			// summary:
			//		filter the output after getting the content of the editing area
			dom = dom || this.editNode;
			if(this.contentDomPostFilters.length){
				if(nonDestructive && dom['cloneNode']){
					dom = dom.cloneNode(true);
				}
				dojo.forEach(this.contentDomPostFilters, function(ef){
					dom = ef(dom);
				});
			}
			var ec = this.getNodeChildrenHtml(dom);
			if(ec.replace(/^\s+|\s+$/g, "") == "&nbsp;"){ ec = ""; }

			//	if(dojo.isIE){
			//		//removing appended <P>&nbsp;</P> for IE
			//		ec = ec.replace(/(?:<p>&nbsp;</p>[\n\r]*)+$/i,"");
			//	}
			dojo.forEach(this.contentPostFilters, function(ef){
				ec = ef(ec);
			});

			return ec;
		},

		//Int: stored last time height
		_lastHeight: 0,

		_updateHeight: function(){
			// summary:
			//		Updates the height of the editor area to fit the contents.
			if(!this.isLoaded){ return; }
			if(this.height){ return; }

			if(dojo.isSafari && (!this._safariIsLeopard())){
				// old safari (2.0.4) is super-janky
				if(!this.editorObject){ return; }
				try{
					this.editorObject.style.height = (this.editNode.offsetHeight + 10) + "px";
					// console.debug("_updateHeight");
				}catch(e){
					try{
						this.editorObject.style.height = "500px";
					}catch(e2){}
				}
				// this.editorObject.style.height = (this.editNode.offsetHeight + 10) + "px";
				return;
			}

			// var height = dojo.marginBox(this.editNode).h;
			var height = dojo.marginBox(this.editNode).h;
			if(dojo.isOpera){
				height = this.editNode.scrollHeight;
			}

			// console.debug(this.editNode);
			// alert(this.editNode);

			//height maybe zero in some cases even though the content is not empty,
			//we try the height of body instead
			if(!height){
				height = dojo.marginBox(this.document.body).h;
			}
			if(height == 0){
				console.debug("Can not figure out the height of the editing area!");
				return; //prevent setting height to 0
			}
			this._lastHeight = height;
			// this.editorObject.style.height = this._lastHeight + "px";
			dojo.marginBox(this.editorObject, { h: this._lastHeight });
			// this.window.scrollTo(0, 0);
		},

		_saveContent: function(e){
			// summary:
			//		Saves the content in an onunload event if the editor has not been closed
			var saveTextarea = dojo.byId("dijit._editor.RichText.savedContent");
			saveTextarea.value += this._SEPARATOR + this.name + ":" + this.getValue();
		},


		escapeXml: function(/*string*/str, /*boolean*/noSingleQuotes){
			//summary:
			//		Adds escape sequences for special characters in XML: &<>"'
			//		Optionally skips escapes for single quotes
			str = str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/"/gm, "&quot;");
			if(!noSingleQuotes){
				str = str.replace(/'/gm, "&#39;");
			}
			return str; // string
		},

		getNodeHtml: function(node){
			switch(node.nodeType){
				case 1: //element node
					var output = '<'+node.tagName.toLowerCase();
					if(dojo.isMoz){
						if(node.getAttribute('type')=='_moz'){
							node.removeAttribute('type');
						}
						if(node.getAttribute('_moz_dirty') != undefined){
							node.removeAttribute('_moz_dirty');
						}
					}
					//store the list of attributes and sort it to have the
					//attributes appear in the dictionary order
					var attrarray = [];
					if(dojo.isIE){
						var s = node.outerHTML;
						s = s.substr(0,s.indexOf('>'));
						s = s.replace(/(?:['"])[^"']*\1/g, '');//to make the following regexp safe
						var reg = /([^\s=]+)=/g;
						var m, key;
						while((m = reg.exec(s)) != undefined){
							key=m[1];
							if(key.substr(0,3) != '_dj'){
								if(key == 'src' || key == 'href'){
									if(node.getAttribute('_djrealurl')){
										attrarray.push([key,node.getAttribute('_djrealurl')]);
										continue;
									}
								}
								if(key == 'class'){
									attrarray.push([key,node.className]);
								}else{
									attrarray.push([key,node.getAttribute(key)]);
								}
							}
						}
					}else{
						var attr, i=0, attrs = node.attributes;
						while(attr=attrs[i++]){
							//ignore all attributes starting with _dj which are
							//internal temporary attributes used by the editor
							if(attr.name.substr(0,3) != '_dj' /*&&
								(attr.specified == undefined || attr.specified)*/){
								var v = attr.value;
								if(attr.name == 'src' || attr.name == 'href'){
									if(node.getAttribute('_djrealurl')){
										v = node.getAttribute('_djrealurl');
									}
								}
								attrarray.push([attr.name,v]);
							}
						}
					}
					attrarray.sort(function(a,b){
						return a[0]<b[0]?-1:(a[0]==b[0]?0:1);
					});
					i=0;
					while(attr=attrarray[i++]){
						output += ' '+attr[0]+'="'+attr[1]+'"';
					}
					if(node.childNodes.length){
						output += '>' + this.getNodeChildrenHtml(node)+'</'+node.tagName.toLowerCase()+'>';
					}else{
						output += ' />';
					}
					break;
				case 3: //text
					// FIXME:
					var output = this.escapeXml(node.nodeValue,true);
					break;
				case 8: //comment
					// FIXME:
					var output = '<!--'+this.escapeXml(node.nodeValue,true)+'-->';
					break;
				default:
					var output = "Element not recognized - Type: " + node.nodeType + " Name: " + node.nodeName;
			}
			return output;
		},

		getNodeChildrenHtml: function(dom){
			var out = "";
			if(!dom){ return out; }
			var nodes = dom["childNodes"]||dom;
			var i=0;
			var node;
			while(node=nodes[i++]){
				out += this.getNodeHtml(node);
			}
			return out;
		},

		close: function(/*Boolean*/save, /*Boolean*/force){
			// summary:
			//		Kills the editor and optionally writes back the modified contents to the
			//		element from which it originated.
			// save:
			//		Whether or not to save the changes. If false, the changes are discarded.
			// force:
			if(this.isClosed){return false; }

			if(!arguments.length){ save = true; }
			this._content = this.getValue();
			var changed = (this.savedContent != this._content);

			// line height is squashed for iframes
			// FIXME: why was this here? if (this.iframe){ this.domNode.style.lineHeight = null; }

			if(this.interval){ clearInterval(this.interval); }

			if(this.textarea){
				with(this.textarea.style){
					position = "";
					left = top = "";
					if(dojo.isIE){
						overflow = this.__overflow;
						this.__overflow = null;
					}
				}
				if(save){
					this.textarea.value = this._content;
				}else{
					this.textarea.value = this.savedContent;
				}
				dojo._destroyElement(this.domNode);
				this.domNode = this.textarea;
			}else{
				if(save){
					if(dojo.isMoz){
						var nc = dojo.doc.createElement("span");
						this.domNode.appendChild(nc);
						nc.innerHTML = this.editNode.innerHTML;
					}else{
						this.domNode.innerHTML = this._content;
					}
				}else{
					this.domNode.innerHTML = this.savedContent;
				}
			}

			dojo.removeClass(this.domNode, "RichTextEditable");
			this.isClosed = true;
			this.isLoaded = false;
			// FIXME: is this always the right thing to do?
			delete this.editNode;

			if(this.window && this.window._frameElement){
				this.window._frameElement = null;
			}

			this.window = null;
			this.document = null;
			this.editingArea = null;
			this.editorObject = null;

			return changed; // Boolean: whether the content has been modified
		},

		destroyRendering: function(){}, // stub!

		destroy: function(){
			this.destroyRendering();
			if(!this.isClosed){ this.close(false); }

			dijit._editor.RichText.superclass.destroy.call(this);
		},

		_fixContentForMoz: function(html){
			// summary:
			//		Moz can not handle strong/em tags correctly, convert them to b/i
			html = html.replace(/<(\/)?strong([ \>])/gi, '<$1b$2' );
			html = html.replace(/<(\/)?em([ \>])/gi, '<$1i$2' );
			return html;
		},
		_srcInImgRegex	: /(?:(<img(?=\s).*?\ssrc=)("|')(.*?)\2)|(?:(<img\s.*?src=)([^"'][^ >]+))/gi ,
		_hrefInARegex	: /(?:(<a(?=\s).*?\shref=)("|')(.*?)\2)|(?:(<a\s.*?href=)([^"'][^ >]+))/gi ,
		_preFixUrlAttributes: function(html){
			html = html.replace(this._hrefInARegex, '$1$4$2$3$5$2 _djrealurl=$2$3$5$2') ;
			html = html.replace(this._srcInImgRegex, '$1$4$2$3$5$2 _djrealurl=$2$3$5$2') ;
			return html;
		},
		regularPsToSingleLinePs: function(element, noWhiteSpaceInEmptyP){
			function wrapLinesInPs(el){
			  // move "lines" of top-level text nodes into ps
				function wrapNodes(nodes){
					// nodes are assumed to all be siblings
					var newP = nodes[0].ownerDocument.createElement('p'); // FIXME: not very idiomatic
					nodes[0].parentNode.insertBefore(newP, nodes[0]);
					for(var i=0; i<nodes.length; i++){
					    newP.appendChild(nodes[i]);
					}
				}

				var currentNodeIndex = 0;
				var nodesInLine = [];
				var currentNode;
				while(currentNodeIndex < el.childNodes.length){
					currentNode = el.childNodes[currentNodeIndex];
					if( (currentNode.nodeName!='BR') &&
						(currentNode.nodeType==1) &&
						(dojo.style(currentNode, "display")!="block")
					){
						nodesInLine.push(currentNode);
					}else{
						// hit line delimiter; process nodesInLine if there are any
						var nextCurrentNode = currentNode.nextSibling;
						if(nodesInLine.length){
							wrapNodes(nodesInLine);
							currentNodeIndex = (currentNodeIndex+1)-nodesInLine.length;
							if(currentNode.nodeName=="BR"){
								dojo._destroyElement(currentNode);
							}
						}
						nodesInLine = [];
					}
					currentNodeIndex++;
				}
				if(nodesInLine.length){ wrapNodes(nodesInLine); }
			}

			function splitP(el){
			    // split a paragraph into seperate paragraphs at BRs
			    var currentNode = null;
			    var trailingNodes = [];
			    var lastNodeIndex = el.childNodes.length-1;
			    for(var i=lastNodeIndex; i>=0; i--){
					currentNode = el.childNodes[i];
					if(currentNode.nodeName=="BR"){
						var newP = currentNode.ownerDocument.createElement('p');
						dojo.place(newP, el, "after");
						if (trailingNodes.length==0 && i != lastNodeIndex) {
							newP.innerHTML = "&nbsp;"
						}
						dojo.forEach(trailingNodes, function(node){
							newP.appendChild(node);
						});
						dojo._destroyElement(currentNode);
						trailingNodes = [];
					}else{
						trailingNodes.unshift(currentNode);
					}
			    }
			}

			var pList = [];
			var ps = element.getElementsByTagName('p');
			dojo.forEach(ps, function(p){ pList.push(p); });
			dojo.forEach(pList, function(p){
				if(	(p.previousSibling) &&
					(p.previousSibling.nodeName == 'P' || dojo.style(p.previousSibling, 'display') != 'block')
				){
					var newP = p.parentNode.insertBefore(this.document.createElement('p'), p);
					// this is essential to prevent IE from losing the P.
					// if it's going to be innerHTML'd later we need
					// to add the &nbsp; to _really_ force the issue
					newP.innerHTML = noWhiteSpaceInEmptyP ? "" : "&nbsp;";
				}
				splitP(p);
		  },this);
			wrapLinesInPs(element);
			return element;
		},

		singleLinePsToRegularPs: function(element){
			function getParagraphParents(node){
				var ps = node.getElementsByTagName('p');
				var parents = [];
				for(var i=0; i<ps.length; i++){
					var p = ps[i];
					var knownParent = false;
					for(var k=0; k < parents.length; k++){
						if(parents[k] === p.parentNode){
							knownParent = true;
							break;
						}
					}
					if(!knownParent){
						parents.push(p.parentNode);
					}
				}
				return parents;
			}

			function isParagraphDelimiter(node){
				if(node.nodeType != 1 || node.tagName != 'P'){
					return (dojo.style(node, 'display') == 'block');
				}else{
					if(!node.childNodes.length || node.innerHTML=="&nbsp;"){ return true }
					//return node.innerHTML.match(/^(<br\ ?\/?>| |\&nbsp\;)$/i);
				}
			}

			var paragraphContainers = getParagraphParents(element);
			for(var i=0; i<paragraphContainers.length; i++){
				var container = paragraphContainers[i];
				var firstPInBlock = null;
				var node = container.firstChild;
				var deleteNode = null;
				while(node){
					if(node.nodeType != "1" || node.tagName != 'P'){
						firstPInBlock = null;
					}else if (isParagraphDelimiter(node)){
						deleteNode = node;
						firstPInBlock = null;
					}else{
						if(firstPInBlock == null){
							firstPInBlock = node;
						}else{
							if( (!firstPInBlock.lastChild || firstPInBlock.lastChild.nodeName != 'BR') &&
								(node.firstChild) &&
								(node.firstChild.nodeName != 'BR')
							){
								firstPInBlock.appendChild(this.document.createElement('br'));
							}
							while(node.firstChild){
								firstPInBlock.appendChild(node.firstChild);
							}
							deleteNode = node;
						}
					}
					node = node.nextSibling;
					if(deleteNode){
						dojo._destroyElement(deleteNode);
						deleteNode = null;
					}
				}
			}
			return element;
		},

		_fixNewLineBehaviorForIE: function(){
			if(typeof this.document.__INSERTED_EDITIOR_NEWLINE_CSS == "undefined"){
				var lineFixingStyles = "p{margin:0;}";
				// FIXME:
				// dojo.html.insertCssText(lineFixingStyles, this.document);
				this.document.__INSERTED_EDITIOR_NEWLINE_CSS = true;
				// this.regularPsToSingleLinePs(this.editNode);
			}
		}
	}
);
