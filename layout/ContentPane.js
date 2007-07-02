dojo.provide("dijit.layout.ContentPane");

dojo.require("dijit._Widget");
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
	//		Or you can send it a NodeList, .setContent(dojo.query('div [class=selected]', userSelection))
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

	// parseOnLoad: Boolean
	//	parse content and create the widgets, if any
	parseOnLoad:	true,

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
	},

	startup: function(){
		if(!this._started){
			if(!this.linkLazyLoadToParent()){
				this._loadCheck();
			}
			this._started = true;
		}
	},

	refresh: function(){
		// summary:
		//		Force a refresh (re-download) of content, be sure to turn off cache

		// we return result of _prepareLoad here to avoid code dup. in dojox.widget.ContentPane
		return this._prepareLoad(true);
	},

	setHref: function(/*String|Uri*/ href){
		// summary:
		//		Reset the (external defined) content of this pane and replace with new url
		//		Note: It delays the download until widget is shown if preload is false
		//	href:
		//		url to the page you want to get, must be within the same domain as your mainpage
		this.href = href;

		// we return result of _prepareLoad here to avoid code dup. in dojox.widget.ContentPane
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

		this._isDownloaded = false; // must be set after _setContent(..), pathadjust in dojox.widget.ContentPane

		if(this.parseOnLoad){
			this._createSubWidgets();
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
		this.unlinkLazyLoadFromParent();
		this._beingDestroyed = true;
		dijit.layout.ContentPane.superclass.destroy.call(this);
	},

	resize: function(size){
		dojo.marginBox(this.domNode, size);
	},

	linkLazyLoadToParent: function(){
		// summary:
		//		start to listen on parent Container selectChild publishes (lazy load)
		//		You dont need to call this method unless you manualy addChild this ContentPane to a Container
		// description:
		//		Container must be a instanceof dijit.layout.StackContainer
		//		like TabContainer, AccordionContainer etc
		//		For this method to work, this.domNode must already be
		//		inserted in DOM as a Child of Container
		if(dijit._Contained && dijit.layout.StackContainer && !this._subscr_show){
			// look upwards to find the closest stackContainer
			var p = this, ch = this;
			while(p = dijit._Contained.prototype.getParent.call(p)){
				if(p && p instanceof dijit.layout.StackContainer){ break; }
				ch = p; // containers child isn't always this widget, see AccordionPane
			}

			if(p){
				// relay published event to correct function (code reuse)
				function cb(receiver){
					return function(page){
						if(page==ch && receiver){ receiver.call(this);}
					};
				}

				// if container has this page selected, start loading..
				if(p.selectedChildWidget == ch){ this._loadCheck(); }

				this._subscr_show = dojo.subscribe(p.id+"-selectChild", this, cb(this._loadCheck));
				this._subscr_remove = dojo.subscribe(p.id+"-selectChild", this, cb(this.unlinkLazyLoadFromParent));
				return true; // Boolean
			}
		}
		return false; // Boolean
	},

	unlinkLazyLoadFromParent: function(){
		// summary:
		//		unhooks selectChild publishes from parent Container (lazy load)
		if(this._subscr_show){
			dojo.unsubscribe(this._subscr_remove);
			dojo.unsubscribe(this._subscr_show);
			this._subscr_remove = this._subscr_show = null;
		}
	},

	_loadCheck: function(){
		// call this when you change onShow (onSelected) status when selected in parent container
		// its used as a trigger for href download when this.domNode.display != 'none'
		if(this.refreshOnShow || (!this.isLoaded && this.href)){
			this._prepareLoad(this.refreshOnShow);
		}
	},

	_prepareLoad: function(forceLoad){
		// sets up for a xhrLoad, load is deferred until widget onShowor selected in parentContainer
		this.isLoaded = false;

		// defer load if until widget is showing
		if(forceLoad || this.preload || (this.domNode.style.display != 'none')){
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
				dojo._destroyElement(node.firstChild);
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

	_onError: function(type, err, consoleText){
		// shows user the string that is returned by on[type]Error
		// overide on[type]Error and return your own string to customize
		var errText = this['on' + type + 'Error'].call(this, err);
		if(consoleText){
			console.error(consoleText, err);
		}else if(errText){// a empty string won't change current content
			this._setContent.call(this, errText);
		}
	},

	_createSubWidgets: function(){
		// summary: scan my contents and create subwidgets
		var rootNode = this.containerNode || this.domNode;
		try{
			dojo.parser.parse(rootNode, true);
		}catch(e){
			this._onError('Content', e, "Couldn't create widgets in "+this.id
				+(this.href ? " from "+this.href : ""));
		}
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
		//		override with your own function if you want to change text
		return this.loadingMessage;
	},

	onContentError: function(/*Error*/ error){
		// summary:
		//		called on DOM faults, require fault etc in content
		//		default is to display errormessage inside pane
	},

	onDownloadError: function(/*Error*/ error){
		// summary:
		//		Called when download error occurs, default is to display
		//		errormessage inside pane. Overide function to change that.
		//		The string returned by this function will be the html
		//		that tells the user a error happend
		return this.errorMessage;
	},

	onDownloadEnd: function(){
		// summary:
		//		called when download is finished
	}
});
