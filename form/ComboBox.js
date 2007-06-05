dojo.provide("dijit.form.ComboBox");

dojo.require("dijit.util.scroll");
dojo.require("dijit.util.wai");
dojo.require("dojo.data.JsonItemStore");
dojo.require("dijit.form._DropDownTextBox");
dojo.require("dijit.form.ValidationTextbox");
dojo.require("dijit.base.TemplatedWidget");

dojo.declare(
	"dijit.form.ComboBoxMixin",
	dijit.form._DropDownTextBox,
	{
		// summary:
		//		Auto-completing text box, and base class for FilteringSelect widget.
		//
		//		The drop down box's values are populated from an class called
		//		a data provider, which returns a list of values based on the characters
		//		that the user has typed into the input box.
		//
		//		Some of the options to the ComboBox are actually arguments to the data
		//		provider.

		// searchLimit: Integer
		//		Argument to data provider.
		//		Specifies cap on maximum number of search results.
		//		Default is Infinity.
		searchLimit: Infinity,

		// store: Object
		//		Reference to data provider object created for this ComboBox
		//		according to "dataProviderClass" argument.
		store: null,

		// autoComplete: Boolean
		//		If you type in a partial string, and then tab out of the <input> box,
		//		automatically copy the first entry displayed in the drop down list to
		//		the <input> field
		autoComplete: true,

		// searchDelay: Integer
		//		Delay in milliseconds between when user types something and we start
		//		searching based on that value
		searchDelay: 100,

		// url: String
		//		URL argument passed to data provider object (class name specified in "dataProviderClass")
		//		An example of the URL format for the default data provider is
		//		"comboBoxData.js"
		url: "",

// Bill: not sure we want to support url parameter; if we do then we have to support it for
// all dojo.data widgets (grid, tree)

		// dataProviderClass: String
		//		Name of data provider class (code that maps a search string to a list of values)
		//		The class must match the interface demonstrated by dojo.data.JsonItemStore
		dataProviderClass: "dojo.data.JsonItemStore",

// Bill: not sure we want to support this; if we do then we have to support it for
// all dojo.data widgets (grid, tree)

		// data: Object
		//		Inline data to put in store
		//		Data must match data type of dataProviderClass
		//		For example, data would contain JSON data if dataProviderClass is a JsonItemStore
		data:null,

		// searchAttr: String
		//		Searches pattern match against this field
		searchAttr: "name",

		// ignoreCase: Boolean
		//		Does the ComboBox menu ignore case?
		ignoreCase: true,

		// value: String
		//		The initial value of the ComboBox.
		//		This is the value that actually appears in the text area.
		value:"",

		templatePath: dojo.moduleUrl("dijit.form", "templates/ComboBox.html"),

		_hasMasterPopup:true,

		_popupClass:"dijit.form._ComboBoxMenu",

		_getCaretPos: function(/*DomNode*/ element){
			// khtml 3.5.2 has selection* methods as does webkit nightlies from 2005-06-22
			if(typeof(element.selectionStart)=="number"){
				// FIXME: this is totally borked on Moz < 1.3. Any recourse?
				return element.selectionStart;
			}else if(dojo.isIE){
				// in the case of a mouse click in a popup being handled,
				// then the document.selection is not the textarea, but the popup
				// var r = document.selection.createRange();
				// hack to get IE 6 to play nice. What a POS browser.
				var tr = document.selection.createRange().duplicate();
				var ntr = element.createTextRange();
				tr.move("character",0);
				ntr.move("character",0);
				try{
					// If control doesnt have focus, you get an exception.
					// Seems to happen on reverse-tab, but can also happen on tab (seems to be a race condition - only happens sometimes).
					// There appears to be no workaround for this - googled for quite a while.
					ntr.setEndPoint("EndToEnd", tr);
					return String(ntr.text).replace(/\r/g,"").length;
				}
				catch(e){
					return 0; // If focus has shifted, 0 is fine for caret pos.
				}
			}
		},

		_setCaretPos: function(/*DomNode*/ element, /*Number*/ location){
			location = parseInt(location);
			this._setSelectedRange(element, location, location);
		},

		_setSelectedRange: function(/*DomNode*/ element, /*Number*/ start, /*Number*/ end){
			if(!end){
				end = element.value.length;
			}  // NOTE: Strange - should be able to put caret at start of text?
			// Mozilla
			// parts borrowed from http://www.faqts.com/knowledge_base/view.phtml/aid/13562/fid/130
			if(element.setSelectionRange){
				element.focus();
				element.setSelectionRange(start, end);
			}else if(element.createTextRange){ // IE
				var range = element.createTextRange();
				with(range){
					collapse(true);
					moveEnd('character', end);
					moveStart('character', start);
					select();
				}
			}else{ //otherwise try the event-creation hack (our own invention)
				// do we need these?
				element.value = element.value;
				element.blur();
				element.focus();
				// figure out how far back to go
				var dist = parseInt(element.value.length)-end;
				var tchar = String.fromCharCode(37);
				var tcc = tchar.charCodeAt(0);
				for(var x = 0; x < dist; x++){
					var te = document.createEvent("KeyEvents");
					te.initKeyEvent("keypress", true, true, null, false, false, false, false, tcc, tcc);
					element.dispatchEvent(te);
				}
			}
		},

		onkeypress: function(/*Event*/ evt){
			// summary: handles keyboard events
			if(evt.ctrlKey || evt.altKey){
				return;
			}
			var doSearch = false;
			switch(evt.keyCode){
				case dojo.keys.PAGE_DOWN:
				case dojo.keys.DOWN_ARROW:
					if(!this.isShowingNow()||this._prev_key_esc){
						this._arrowPressed();
						// bring up full list
						//this._startSearch("");
						doSearch=true;
					}else{
						evt.keyCode==dojo.keys.PAGE_DOWN ? this._popupWidget.pageDown(): this._popupWidget._highlightNextOption();
						this._announceOption(this._popupWidget.getHighlightedOption());
					}
					dojo.stopEvent(evt);
					this._prev_key_backspace = false;
					this._prev_key_esc = false;
					break;

				case dojo.keys.PAGE_UP:
				case dojo.keys.UP_ARROW:
					if(this.isShowingNow()){
						evt.keyCode==dojo.keys.PAGE_UP ? this._popupWidget.pageUp() : this._popupWidget._highlightPrevOption();
						this._announceOption(this._popupWidget.getHighlightedOption());
					}
					dojo.stopEvent(evt);
					this._prev_key_backspace = false;
					this._prev_key_esc = false;
					break;

				case dojo.keys.ENTER:
					// prevent submitting form if user presses enter
					dojo.stopEvent(evt);
					// fall through

				case dojo.keys.TAB:
					if(this.isShowingNow()){
						this._prev_key_backspace = false;
						this._prev_key_esc = false;
						if(this._popupWidget.getHighlightedOption()){
							this._popupWidget.setValue({target:this._popupWidget.getHighlightedOption()});
						}else{
							this.setDisplayedValue(this.getDisplayedValue());
						}
						this._hideResultList();
					}else{
						// also allow arbitrary user input
						this.setDisplayedValue(this.getDisplayedValue());
					}
					break;

				case dojo.keys.SPACE:
					this._prev_key_backspace = false;
					this._prev_key_esc = false;
					if(this.isShowingNow() && this._highlighted_option){
						dojo.stopEvent(evt);
						this._selectOption();
						this._hideResultList();
					}
					else{doSearch=true;}
					break;

				case dojo.keys.ESCAPE:
					this._prev_key_backspace = false;
					this._prev_key_esc = true;
					this._hideResultList();
					this.setValue(this.getValue());
					break;

				case dojo.keys.BACKSPACE:
					this._prev_key_esc = false;
					this._prev_key_backspace = true;
					doSearch=true;
					if(!this.textbox.value.length){
						this.setValue("");
					}
					break;

				case dojo.keys.RIGHT_ARROW: // fall through

				case dojo.keys.LEFT_ARROW: // fall through
					this._prev_key_backspace = false;
					this._prev_key_esc = false;
					break;

				default:// non char keys (F1-F12 etc..)  shouldn't open list
					this._prev_key_backspace = false;
					this._prev_key_esc = false;
					if(evt.charCode!=0){
						doSearch=true;
					}
			}
			if(this.searchTimer){
				clearTimeout(this.searchTimer);
			}
			if(doSearch){
				// need to wait a tad before start search so that the event bubbles through DOM and we have value visible
				this.searchTimer = setTimeout(dojo.hitch(this, this._startSearchFromInput), this.searchDelay);
			}
		},

		_openResultList: function(/*Object*/ results){
			if(this.disabled){
				return;
			}
			this._popupWidget.clearResultList();
			if(!results.length){
				this._hideResultList();
				return;
			}


			// Fill in the textbox with the first item from the drop down list, and
			// highlight the characters that were auto-completed.   For example, if user
			// typed "CA" and the drop down list appeared, the textbox would be changed to
			// "California" and "ifornia" would be highlighted.

			var zerothvalue=new String(this.store.getValue(results[0], this.searchAttr));
			if(zerothvalue&&(this.autoComplete)&&
			(!this._prev_key_backspace)&&
			(this.textbox.value.length > 0)&&
			(new RegExp("^"+this.textbox.value, this.ignoreCase ? "i" : "").test(zerothvalue))){
				var cpos = this._getCaretPos(this.textbox);
				// only try to extend if we added the last character at the end of the input
				if((cpos+1) > this.textbox.value.length){
					// only add to input node as we would overwrite Capitalisation of chars
					// actually, that is ok
					this.textbox.value = zerothvalue;//.substr(cpos);
					// visually highlight the autocompleted characters
					this._setSelectedRange(this.textbox, cpos, this.textbox.value.length);
				}
			}
			// #2309: iterate over cache nondestructively
			for(var i=0; i<results.length; i++){
				var tr=results[i];
				if(tr){
					var td=this._createOption(tr);
					td.className = "dijitMenuItem";
					this._popupWidget.addItem(td);
				}

			}
// Bill: above loop could be done w/ "dojo.forEach(results, function(tr){" or better yet map()
//
// But actually the interface between ComboBoxMenu and Autocompleter is strange to me.
// ComboBoxMenu should be in charge of the
// DOM manipulation (creating text nodes, etc).   autocompleter should just pass in a list of
// items

			// show our list (only if we have content, else nothing)
			this._showResultList();
		},

		_createOption:function(/*Object*/ tr){
			// summary: creates an option to appear on the popup menu
			// subclassed by FilteringSelect
			var td = document.createElement("div");
			td.appendChild(document.createTextNode(this.store.getValue(tr, this.searchAttr)));
			td.item=tr;
			return td;
		},

		onfocus:function(){
			this.parentClass.onfocus.apply(this, arguments);
		},

		onblur:function(){
			// if the user clicks away from the textbox, set the value to the textbox value
			this.setDisplayedValue(this.getDisplayedValue());
			dijit.form._DropDownTextBox.prototype.onblur.apply(this, arguments);
			// don't call this since the Textbox setValue is asynchronous
			// if you uncomment this line, when you click away from the textbox,
			// the value in the textbox reverts to match the hidden value
			//this.parentClass.onblur.apply(this, arguments);
		},

		_announceOption: function(/*Node*/ node){
			// summary:
			//	a11y code that puts the highlighted option in the textbox 
			//	This way screen readers will know what is happening in the menu

			if(node==null){return;}
			var newValue=this.store.getValue(node.item, this.searchAttr);
			dijit.util.wai.setAttr(this.focusNode || this.domNode, "waiState", "valuenow", newValue);
			this.focusNode.value=newValue;
		},

		_selectOption: function(/*Event*/ evt){
			var tgt = null;
			if(!evt){
				// what if nothing is highlighted yet?
				evt ={ target: this._highlighted_option };
			}
			if(!evt.target){
				// handle autocompletion where the the user has hit ENTER or TAB
				this.setDisplayedValue(this.getDisplayedValue());
				return;
			// otherwise the user has accepted the autocompleted value
			}else{
				tgt = evt.target;
			}
			while((tgt.nodeType!=1)||(!this.store.getValue(tgt.item, this.searchAttr))){
				tgt = tgt.parentNode;
				if(tgt == dojo.body()){
					return false;
				}
			}
			this._doSelect(tgt);
			if(!evt.noHide){
				this._hideResultList();
				this._setSelectedRange(this.textbox, 0, null);
			}
			this.focus();
			if(this._popupWidget.domNode.style.display!="none"){
				dijit.util.PopupManager.close(this._popupWidget);
			}
		},

		_doSelect: function(tgt){
			this.setValue(this.store.getValue(tgt.item, this.searchAttr));
		},

		arrowClick: function(){
// Bill: should rename to _onArrowClicked() for consistency
			// summary: callback when arrow is clicked
			if(this.disabled){
				return;
			}
			this.focus();
			this.makePopup();
			if(this.isShowingNow()){
				this._hideResultList();
			}else{
				// forces full population of results, if they click
				// on the arrow it means they want to see more options
				this._startSearch("");
			}
		},

		_startSearchFromInput: function(){
			this._startSearch(this.textbox.value);
		},

		_startSearch: function(/*String*/ key){
			this.makePopup();
			// create a new query to prevent accidentally querying for a hidden value from FilteringSelect's keyField
			var query={};
			query[this.searchAttr]=key+"*";
			// no need to page; no point in caching the return object
			this.store.fetch({queryOptions:{ignoreCase:this.ignoreCase}, query: query, onComplete:dojo.hitch(this, "_openResultList"), count:this.searchLimit});
		},

		_assignHiddenValue:function(/*Object*/ keyValArr, /*DomNode*/ option){
			// sets the hidden value of an item created from an <option value="CA">
			// ComboBox does not care about the value; FilteringSelect does though
			// FilteringSelect overrides this method
		},

		postCreate: function(){
			// dojo.data code
			var dpClass=dojo.getObject(this.dataProviderClass, false);
			// is the store not specified?
			var data;
			if(this.store==null){
				// if user didn't specify either url or data, then assume there are option tags
				if(this.url==""&&this.data==null){
					dpClass=dojo.getObject("dojo.data.JsonItemStore", false);
					var opts = this.domNode.getElementsByTagName("option");
					var ol = opts.length;
					data=[];
					// go backwards to create the options list
					// have to go backwards because we are removing the option nodes
					// the option nodes are visible once the ComboBox initializes
					for(var x=ol-1; x>=0; x--){
						var text = opts[x].innerHTML;
						var keyValArr ={};
						keyValArr[this.searchAttr]=String(text);
						// FilteringSelect: assign the value attribute to the hidden value
						this._assignHiddenValue(keyValArr, opts[x]);
						data.unshift(keyValArr);
						// remove the unnecessary node
						// if you keep the node, it is visible on the page!
						this.domNode.removeChild(opts[x]);
					}
					// pass store inline data
					this.data={items:data};
				}
				this.store=new dpClass(this);
			}
			// call the associated Textbox postCreate
			// ValidationTextbox for ComboBox; MappedTextbox for FilteringSelect
			this.parentClass=dojo.getObject(this.declaredClass, false).superclass;
			this.parentClass.postCreate.apply(this, arguments);

			// if there is no value set and there is an option list,
			// set the value to the first value to be consistent with native Select
			if(data&&data.length&&!this.getValue()){
				this.setDisplayedValue(data[0][this.searchAttr]);
			}

			// convert the arrow image from using style.background-image to the .src property (a11y)
//			dijit.util.wai.imageBgToSrc(this.arrowImage);
		}
	}
);

dojo.declare(
	"dijit.form._ComboBoxMenu",
	[dijit.base.FormElement, dijit.base.TemplatedWidget],

// Bill: 
// I'd like the interface to ComboBoxMenu to be higher level,
// taking a list of items to initialize it, and returns the selected item
//
//                new _ComboBoxMenu({
//                                 items: /*dojo.data.Item[]*/ items,
//                                 labelFunc: dojo.hitc(this, "_makeLabel"),
//                                 onSelectItem: dojo.hitch(this, "_itemSelected")
//               });
//
// (This is dependent on NOT having a global widget for this, but rather
// creating it on the fly, as per discussion with Bill, Adam, and Mark)
// 
// It could also have a method like handleKey(evt) that takes a keystroke
// the <input> received and handles it.
//
// Also, doesn't seem like this should inherit from FormElement, and again I'm not
// sure of the utility of dijit.form._DropDownTextBox.Popup;
// all the popup functionality is supposed to be in PopupManager
//


	{
		// summary:
		//	Focus-less div based menu for internal use in ComboBox

		templateString:"<div class='dijitMenu' dojoAttachEvent='onclick; onmouseover; onmouseout;' tabIndex='-1' style='display:none; position:absolute; overflow:\"auto\";'></div>",
		_onkeypresshandle:null,
		postCreate:function(){
			// summary:
			//	call all postCreates
			dijit.base.FormElement.prototype.postCreate.apply(this, arguments);
		},

		open:function(/*Widget*/ widget){
			this.onValueChanged=dojo.hitch(widget, widget._selectOption);
			// connect onkeypress to ComboBox
			this._onkeypresshandle=dojo.connect(this.domNode, "onkeypress", widget, "onkeypress");
			return dijit.util.PopupManager.openAround(widget.domNode, this);
		},

		onClose:function(){
			dojo.disconnect(this._onkeypresshandle);
			this._blurOptionNode();
		},

		addItem:function(/*Node*/ item){
			this.domNode.appendChild(item);
		},
// Bill: see comments above; this call is too low level for the interface
// between Autocompleter and AutocompleterMenu

		clearResultList:function(){
			this.domNode.innerHTML="";
		},

		// these functions are called in showResultList
		getItems:function(){
			return this.domNode.childNodes;
		},

		getListLength:function(){
			return this.domNode.childNodes.length;
		},

		onclick:function(/*Event*/ evt){
			if(evt.target === this.domNode){ return; }
			var tgt=evt.target;
			// while the clicked node is inside the div
			while(!tgt.item){
				// recurse to the top
				tgt=tgt.parentNode;
			}
			this.setValue({target:tgt});
		},

		onmouseover:function(/*Event*/ evt){
			if(evt.target === this.domNode){ return; }
			this._focusOptionNode(evt.target);
		},

		onmouseout:function(/*Event*/ evt){
			if(evt.target === this.domNode){ return; }
			this._blurOptionNode();
		},

		_focusOptionNode:function(/*DomNode*/ node){
			// summary:
			//	does the actual highlight
			if(this._highlighted_option != node){
				this._blurOptionNode();
				this._highlighted_option = node;
				dojo.addClass(this._highlighted_option, "dijitMenuItemHover");
			}
		},

		_blurOptionNode:function(){
			// summary:
			//	removes highlight on highlighted option
			if(this._highlighted_option){
				dojo.removeClass(this._highlighted_option, "dijitMenuItemHover");
				this._highlighted_option = null;
			}
		},

		_highlightNextOption:function(){
			// because each press of a button clears the menu,
			// the highlighted option sometimes becomes detached from the menu!
			// test to see if the option has a parent to see if this is the case.
			if(!this.getHighlightedOption()){
				this._focusOptionNode(this.domNode.firstChild);
			}else if(this._highlighted_option.nextSibling){
				this._focusOptionNode(this._highlighted_option.nextSibling);
			}
			dijit.util.scroll.scrollIntoView(this._highlighted_option);
		},


		_highlightPrevOption:function(){
			if(!this.getHighlightedOption()){
				dijit.util.PopupManager.close(true);
				return;
			}else if(this._highlighted_option.previousSibling){
				this._focusOptionNode(this._highlighted_option.previousSibling);
			}
			dijit.util.scroll.scrollIntoView(this._highlighted_option);
		},

		_page:function(/*Boolean*/ up){
			var scrollamount=0;
			var oldscroll=this.domNode.scrollTop;
			var height=parseInt(dojo.getComputedStyle(this.domNode).height);
			// if no item is highlighted, highlight the first option
			if(!this.getHighlightedOption()){this._highlightNextOption();}
			while(scrollamount<height){
				if(up){
					// stop at option 1
					if(!this.getHighlightedOption().previousSibling){break;}
					this._highlightPrevOption();
				}else{
					// stop at last option
					if(!this.getHighlightedOption().nextSibling){break;}
					this._highlightNextOption();
				}
				// going backwards
				var newscroll=this.domNode.scrollTop;
				scrollamount+=(newscroll-oldscroll)*(up ? -1:1);
				oldscroll=newscroll;
			}
		},

		pageUp:function(){
			this._page(true);
		},

		pageDown:function(){
			this._page(false);
		},

		getHighlightedOption:function(){
			// summary:
			//	Returns the highlighted option.
			return this._highlighted_option&&this._highlighted_option.parentNode ? this._highlighted_option : null;
		}
	}

);

dojo.declare(
	"dijit.form.ComboBox",
	[dijit.form.ValidationTextbox, dijit.form.ComboBoxMixin],
	{}
);
