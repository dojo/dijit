dojo.provide("dijit.layout.ContentPane");

dojo.require("dijit._Widget");
dojo.require("dijit._Container");
dojo.require("dojo.parser");

dojo.declare(
	"dijit.layout.ContentPane",
	dijit._Widget,
{
	// summary:
	//		A widget that acts as a Container for other widgets, and includes a ajax interface
	// description:
	//		A widget that can be used as a standalone widget
	//		or as a baseclass for other widgets
	//		Handles replacement of document fragment using either external uri or javascript
	//		generated markup or DOM content, instantiating widgets within that content.
	//		Don't confuse it with an iframe, it only needs/wants document fragments.
	//		It's useful as a child of LayoutContainer, SplitContainer, or TabContainer.
	//		But note that those classes can contain any widget as a child.
	// usage:
	//		Some quick samples:
	//		To change the innerHTML use .setContent('<b>new content</b>')
	//
	//		Or you can send it a NodeList, .setContent(dojo.query('#t div > h3', otherFrame))
	//		please note that the nodes in NodeList will copied, not moved
	//
	//		To do a ajax update use .setHref('url')


	// href: String
	//		The href of the content that displays now
	//		Set this at construction if you want to load externally,
	//		changing href after creation doesn't have any effect, see setHref
	href: "",

	// extractContent: Boolean
	//	Extract visible content from inside of <body> .... </body>
	extractContent: false,

	// parse: Boolean
	//	parse content and create the widgets, if any
	parse:	true,

	// preventCache: Boolean
	//	Cache content retreived externally
	preventCache:	false,

	// preload: Boolean
	//	Force load of data even if pane is hidden.
	// Note:
	//		In order to delay download you need to initially hide the node it constructs from
	preload: false,

	// refreshOnShow: Boolean
	//		Refresh (re-download) content when pane goes from hidden to shown
	refreshOnShow: false,

	// loadingMessage: String
	//	Message that shows while downloading
	loadingMessage: "Loading...", //TODO: i18n or set a image containing the same info (no i18n required)

	// errorMessage: String
	//	Message that shows if an error occurs
	errorMessage: "Sorry, but an error occured", // TODO: i18n

	// isLoaded: Boolean
	//	Tells loading status see onLoad|onUnload for event hooks
	isLoaded: false,

	// class: String
	//	Class name to apply to ContentPane dom nodes
	"class": "dijitContentPane",

	postCreate: function(){
		// remove the title attribute so it doesn't show up when i hover
		// over a node
		this.domNode.title = "";

		// for programatically created ContentPane (with <span> tag), need to muck w/CSS
		// or it's as though overflow:visible is set
		dojo.addClass(this.domNode, this["class"]);

		if(this.preload || this.isShowing()){
			this._prepareForShow();
		}
	},

	isShowing: function(){
		return (this.domNode.style.display != 'none');
	},

	onShow: function(){
		// summary:
		//	onShow event,
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
		return this._prepareLoad(true);
	},

	setHref: function(/*String|Uri*/ href){
		// summary:
		//		Reset the (external defined) content of this pane and replace with new url
		//
		//	href:
		//		url to the page you want to get, must be within the same domain as your mainpage
		//
		//	Note:
		//		It delays the download until widget is shown if preload is false
		this.href = href;

		// we return result of _prepareLoad here in baseclass to avoid code duplication is dojox.widget.ContentPane
		return this._prepareLoad();
	},

	setContent: function(/*String|DomNode|Nodelist*/data){
		// summary:
		//		Replaces old content with data content, include style classes from old content
		//	data:
		//		the new Content may be String, DomNode or NodeList
		//
		//		if data is a NodeList (or an array of nodes) nodes are copied
		//		so you can import nodes from another document implicitly

		// clear href so we cant run refresh and clear content
		// refresh should only work if we downloaded the content
		if(!this._isDownloaded){
			this.href = "";
			this._onUnloadHandler();
		}

		this._setContent(data || "");
		this._isDownloaded = false;

		// create the widgets?
		if(this.parse){
			try{
				this._createSubWidgets();
			}catch(e){
				console.error("Couldn't create widgets in "+this.id
					+(this.href ? " from "+this.href : ""), e);
			}
		}

		this._onLoadHandler();
	},

	cancel: function(){
		// summary
		//		Cancels a inflight download of content
		if(this._xhrDfd && (this._xhrDfd.fired == -1)){
			this._xhrDfd.cancel();
		}

		delete this._xhrDfd; // garbage collect
	},

	destroy: function(){
		// if we have multiple controllers destroying us, bail after the first
		if(this._beingDestroyed){
			return;
		}
		// make sure we call onUnload
		this._onUnloadHandler();
		this._beingDestroyed = true;
		dijit.layout.ContentPane.superclass.destroy.call(this);
	},

	resize: function(size){
		dojo.marginBox(this.domNode, size);
	},

	_prepareForShow: function(){
		// summary:
		//		Called whenever the ContentPane is displayed.  The first time it's called,
		//		it will download the data from specified URL or handler (if the data isn't
		//		inlined), and will instantiate subwidgets.
		if( this.isLoaded ){
			return;
		}
		if(this.href != ""){
			this._prepareLoad();
		}
		// TODO: trac #3510 to see if auto parse will optional when requiring dojo.parser
		/*else if(this.parse && !dojo.autoparse && !this._initialyParsed){
			// support creating a page without auto widgetParse
			// with a contentPane a Root of some widgetified nodes below
			// these would be created along with the contentPane
			// like calling dojo.parser(topNodeOfDomLeaf)
			this._createSubWidgets();
			this._initialyParsed = true;
			this._onLoadHandler();
		}*/
	},

	_prepareLoad: function(forceLoad){
		// sets up for a xhrLoad, load is deferred until widget is showing
		this.isLoaded = false;

		// defer load if until widget is showing
		if(forceLoad || this.preload || this.isShowing()){
			this._downloadExternalContent();
		}
	},

	_downloadExternalContent: function(){
		this.cancel();
		this._onUnloadHandler();

		// display loading message
		// TODO: maybe we should just set a css class with a loading image as background?
		this._setContent(
			this.onDownloadStart.call(this)
		);

		var self = this;
		var getArgs = {
			preventCache:  (this.preventCache || this.refreshOnShow),
			url: this.href,
			handleAs: "text"
		};

		var getHandler = this._xhrDfd = dojo.xhrGet(getArgs);

		getHandler.addCallback(function(html){
			try{
				self.onDownloadEnd.call(self);
				self._isDownloaded = true;
				self.setContent.call(self, html); // onload event is called from here
			}catch(err){
				self._onError.call(self, 'Content', err); // onContentError
			}
			return html;
		});

		getHandler.addErrback(function(err){
			// TODO: trac #3507 to find out if this check is needed or just a workaround
			if(!getHandler.cancelled){
				// show error message in the pane
				self._onError.call(self, 'Download', err); // onDownloadError
			}
			return err;
		});
	},

	_onLoadHandler: function(){
		this.isLoaded = true;
		try{
			this.onLoad.call(this);
		}catch(e){
			console.error('Error '+this.widgetId+' running custom onLoad code');
		}
	},

	_onUnloadHandler: function(){
		this.isLoaded = false;
		this.cancel();
		try{
			this.onUnload.call(this);
		}catch(e){
			console.error('Error '+this.widgetId+' running custom onUnload code');
		}
	},

	_setContent: function(cont){
		this.destroyDescendants();

		try{
			var node = this.containerNode || this.domNode;
			while(node.firstChild){
		//PORT memory leak #2931
				node.firstChild.parentNode.removeChild(node.firstChild);
			//	delete node.firstChild; //Q is this wrong?
			}
			if(typeof cont == "string"){
				// dijit.ContentPane does only minimal fixes,
				// No pathAdjustments, script retrieval, style clean etc
				// some of these should be available in the dojox.widget.ContentPane
				if(this.extractContent){
					match = cont.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
					if(match){ cont = match[1]; }
				}
				node.innerHTML = cont;
			}else{
				// domNode or NodeList
				if(cont.nodeType){ // domNode (htmlNode 1 or textNode 3)
					node.appendChild(cont);
				}else{// nodelist or array such as dojo.Nodelist
					dojo.forEach(cont, function(n){
						node.appendChild(n.cloneNode(true));
					});
				}
			}
		}catch(e){
			// check if a domfault occurs when we are appending this.errorMessage
			// like for instance if domNode is a UL and we try append a DIV
			var errMess = this.onContentError(e);
			try{
				node.innerHTML = errMess;
			}catch(e){
				console.error('Fatal '+this.id+' could not change content due to '+e.message, e);
			}
		}
	},

	_onError: function(type, err){
		// shows user the string that is returend by onContentError or onDownloadError
		// overide these functions and return your own string to customize
		// a empty string won't change current content
		var errText = this['on' + type + 'Error'].call(this, err);
		if(errText){
			this._setContent.call(this,
				errText
			);
		}
	},

	_createSubWidgets: function(){
		// summary: scan my contents and create subwidgets
		var rootNode = this.containerNode || this.domNode;
		dojo.parser.parse(rootNode, true);
	},

	// EVENT's, should be overide-able
	onLoad: function(e){
		// summary:
		//		Event hook, is called after everything is loaded and widgetified
	},

	onUnload: function(e){
		// summary:
		//		Event hook, is called before old content is cleared
	},

	onDownloadStart: function(){
		// summary:
		//		called before download starts
		//		the string returned by this function will be the html
		//		that tells the user we are loading something
		//	
		//		override with your own function if you want to change text
		return this.loadingMessage;
	},

	onContentError: function(/*Error*/ error){
		// summary:
		//		called on DOM faults, require fault etc in content
		//		default is to display errormessage inside pane
	},

	onDownloadError: function(){
		// summary:
		//		called when download error occurs, preventDefault-able
		//		default is to display errormessage inside pane
		//		the string returned by this function will be the html
		//		that tells the user a error happend
		return this.errorMessage;
	},

	onDownloadEnd: function(){
		// summary:
		//		called when download is finished
	}
});
