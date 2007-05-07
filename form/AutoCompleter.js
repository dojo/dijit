dojo.provide("dijit.form.AutoCompleter");

dojo.require("dijit.util.scroll");
dojo.require("dijit.util.wai");
dojo.require("dojo.data.JsonItemStore");
dojo.require("dijit.form._DropDownTextBox");
dojo.require("dijit.form.ValidationTextbox");

dojo.declare(
			"dijit.form.AutoCompleter",
	[dijit.form.SerializableTextbox, dijit.form._DropDownTextBox],
{
	// summary:
	//		Auto-completing text box, and base class for Select widget.
	//
	//		The drop down box's values are populated from an class called
	//		a data provider, which returns a list of values based on the characters
	//		that the user has typed into the input box.
	//
	//		Some of the options to the AutoCompleter are actually arguments to the data
	//		provider.
	
	// Fixes #2885, #2309
	
	// searchLimit: Integer
	//		Argument to data provider.
	//		Specifies cap on maximum number of search results.
	//		Default is Infinity.
	searchLimit: Infinity,

	// store: Object
	//		Reference to data provider object created for this AutoCompleter
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
	//		"autoCompleterData.js"
	url: "",

	// fadeTime: Integer
	//		Milliseconds duration of fadeout for drop down box
	fadeTime: 200,

	// maxListLength: Integer
	//		 Limits list to X visible rows, scroll on rest
	maxListLength: 8,

	// dataProviderClass: String
	//		Name of data provider class (code that maps a search string to a list of values)
	//		The class must match the interface demonstrated by dojo.data.JsonItemStore
	dataProviderClass: "dojo.data.JsonItemStore",

	// searchField: String
	//		Searches pattern match against this field
	searchField: "name",

	// size: String
	//              Basic input tag size declaration.
	size: "",

	// maxlength: String
	//              Basic input tag maxlength declaration.
	maxlength: "",
		
	// ignoreCase: Boolean
	//		Is the AutoCompleter menu case sensitive?
	ignoreCase: true,
		
	// value: String
	//		The initial value of the AutoCompleter.
	//		This is the value that actually appears in the text area.

	templatePath: dojo.moduleUrl("dijit.form", "templates/AutoCompleter.html"),
	
	_setTextFieldValue:function(/*String*/ value){
		// summary: Select wants to call AutoCompleter's setValue to reach FormElement's setValue
		// But Select does not want to display the "value" in the text field!
		// this function fixes that problem by separating the code from Select's setTextValue
		this.textbox.value=value;
	},
	setValue:function(/*String*/ value){
		// summary: Sets the value of the AutoCompleter
		this._setTextFieldValue(value);
		console.log(value);
		// reuse dijit setValue code
		dijit.form.AutoCompleter.superclass.setValue.apply(this, arguments);
	},

	getState: function(){
		// summary:
		//	Used for saving state of AutoCompleter when navigates to a new
		//	page, in case they then hit the browser's "Back" button.
		var state={};
			//state[this.keyField]=this.getValue();
		state[this.searchField]=this.getValue();
			//query[this.searchField]=this.getSelectedValue();
		return state;
	},

	setState: function(/*Object*/ state){
		// summary:
		//	Used for restoring state of AutoCompleter when has navigated to a new
		//	page but then hits browser's "Back" button.
		//this.setValue(state[this.keyField]);
		this.setValue(state[this.searchField]);
		//this.setSelectedValue(state[this.searchField]);
	},

	enable:function(){
		this.disabled=false;
		this.textbox.removeAttribute("disabled");
	},

	disable: function(){
		this.disabled = true;
		this.textbox.setAttribute("disabled",true);
	},

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
			}catch(e){
				return 0; // If focus has shifted, 0 is fine for caret pos.
			}
		}

	},

	_setCaretPos: function(/*DomNode*/ element, /*Number*/ location){
		location = parseInt(location);
		this._setSelectedRange(element, location, location);
	},

	_setSelectedRange: function(/*DomNode*/ element, /*Number*/ start, /*Number*/ end){
		if(!end){ end = element.value.length; }  // NOTE: Strange - should be able to put caret at start of text?
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
		if(evt.ctrlKey || evt.altKey){ return; }

		// reset these
		this._prev_key_backspace = false;
		this._prev_key_esc = false;

		var k = dojo.keys;
		var doSearch = true;
			switch(evt.keyCode){
				case dojo.keys.DOWN_ARROW:
					if(!this.popupWidget.isShowingNow){
						this._startSearchFromInput();
					}
					this._highlightNextOption();
					dojo.stopEvent(evt);
					return;
				case dojo.keys.UP_ARROW:
					this._highlightPrevOption();
					dojo.stopEvent(evt);
					return;
				case dojo.keys.PAGE_DOWN:
					for(var i=0; i<this.maxListLength; i++){
						this._highlightNextOption();
					}
					dojo.stopEvent(evt);
					return;
				case dojo.keys.PAGE_UP:
					for(var i=0; i<this.maxListLength; i++){
						this._highlightPrevOption();
					}
					dojo.stopEvent(evt);
					return;
				case dojo.keys.TAB:
					// using linux alike tab for autocomplete
					if(!this.autoComplete && this.popupWidget.isShowingNow && this._highlighted_option){
						dojo.stopEvent(evt);
						this._selectOption({ 'target': this._highlighted_option, 'noHide': false});

						// put caret last
						this._setSelectedRange(this.textbox, this.textbox.value.length, null);
					}else{
						this._selectOption();
						return;
					}
					break;
				case dojo.keys.ENTER:
					// prevent submitting form if we press enter with list open
					
					if(this.popupWidget.isShowingNow){
						dojo.stopEvent(evt);
					}
					
					if(this.autoComplete){
						this._selectOption();
						this._hideResultList();
						return;
					}
					
					// fallthrough
				case dojo.keys.SPACE:
					if(this.popupWidget.isShowingNow && this._highlighted_option){
						
						dojo.stopEvent(evt);
						
						this._selectOption();
						this._hideResultList();
						return;
					}
					break;
				case dojo.keys.ESCAPE:
					this._hideResultList();
					this._prev_key_esc = true;
					return;
				case dojo.keys.BACKSPACE:
					//try{
						this._prev_key_backspace = true;
						if(!this.textbox.value.length){
							this.setValue("");
							//this._hideResultList();
							//doSearch = false;
						}
					//}
					//catch(e){
					//	console.log("Error with KEY_BACKSPACE: "+e.message);
					//}
					break;
				case dojo.keys.RIGHT_ARROW: // fall through
				case dojo.keys.LEFT_ARROW: // fall through
					doSearch = false;
					break;
				default:// non char keys (F1-F12 etc..)  shouldn't open list
					if(evt.charCode==0){
						doSearch = false;
					}
			}
		if(this.searchTimer){
			clearTimeout(this.searchTimer);
		}
		if(doSearch){
			// if we have gotten this far we dont want to keep our highlight
			this._blurOptionNode();

			// need to wait a tad before start search so that the event bubbles through DOM and we have value visible
			this.searchTimer = setTimeout(dojo.hitch(this, this._startSearchFromInput), this.searchDelay);
		}
	},

	compositionEnd: function(/*Event*/ evt){
		// summary: When inputting characters using an input method, such as Asian
		// languages, it will generate this event instead of onKeyDown event
		evt.key = evt.charCode = -1;
		this.onkeypress(evt);
	},

	onkeyup: function(/*Event*/ evt){
		// summary: callback on key up event
		this.setValue(this.textbox.value);
	},

	_focusOptionNode: function(/*DomNode*/ node){
		// summary: does the actual highlight
		if(this._highlighted_option != node){
			this._blurOptionNode();
			this._highlighted_option = node;
			console.log(node);
			dojo.addClass(this._highlighted_option, "dojoMenuItemHover");
		}
	},

	_blurOptionNode: function(){
		// summary: removes highlight on highlighted
		if(this._highlighted_option){
			dojo.removeClass(this._highlighted_option, "dojoMenuItemHover");
			this._highlighted_option = null;
		}
	},

	_highlightNextOption: function(){
		if((!this._highlighted_option) || !this._highlighted_option.parentNode){
			this._focusOptionNode(this.optionsListNode.firstChild);
		}else if(this._highlighted_option.nextSibling){
			this._focusOptionNode(this._highlighted_option.nextSibling);
		}
		dijit.util.scroll.scrollIntoView(this._highlighted_option);
	},

	_highlightPrevOption: function(){
		if(this._highlighted_option && this._highlighted_option.previousSibling){
			this._focusOptionNode(this._highlighted_option.previousSibling);
		}else{
			this._highlighted_option = null;
			this._hideResultList();
			return;
		}
		dijit.util.scroll.scrollIntoView(this._highlighted_option);
	},

	_itemMouseOver: function(/*Event*/ evt){
		if(evt.target === this.optionsListNode){ return; }
		this._focusOptionNode(evt.target);
	},

	_itemMouseOut: function(/*Event*/ evt){
		if(evt.target === this.optionsListNode){ return; }
		this._blurOptionNode();
	},

	_openResultList: function(/*Object*/ results){
		console.log("Opening result list; "+results.length+" items");
		if(this.disabled){
			return;
		}
		this._clearResultList();
		if(!results.length){
			this._hideResultList();
			return;
		}
		var zerothvalue=new String(this.store.getValue(results[0], this.searchField));
		if(zerothvalue&&(this.autoComplete)&&
			(!this._prev_key_backspace)&&
			(this.textbox.value.length > 0)&&
			(new RegExp("^"+this.textbox.value, "").test(zerothvalue))){
				var cpos = this._getCaretPos(this.textbox);
				// only try to extend if we added the last character at the end of the input
				if((cpos+1) > this.textbox.value.length){
					// only add to input node as we would overwrite Capitalisation of chars
					this.textbox.value += zerothvalue.substr(cpos);
					// build a new range that has the distance from the earlier
					// caret position to the end of the first string selected
					this._setSelectedRange(this.textbox, cpos, this.textbox.value.length);
				}
		}
		// #2309: iterate over cache nondestructively
		for(var i=0; i<results.length; i++) {
			var tr=results[i];
			if(tr){
				var td=this._createOption(tr);
				td.className = "dojoMenuItem";
				this.optionsListNode.appendChild(td);
			}
		}
			//console.log(this.optionsListNode.innerHTML);
			
			// show our list (only if we have content, else nothing)
		this._showResultList();
	},

	_createOption:function(/*Object*/ tr){
		// summary: creates an option to appear on the popup menu
		var td = document.createElement("div");
		td.appendChild(document.createTextNode(this.store.getValue(tr, this.searchField)));
		td.item=tr;
		return td;
	},
	onfocus:function(){
		dijit.form.RangeBoundTextbox.prototype.onfocus.apply(this, arguments);
		this._hasFocus = true;
	},
	onblur:function(){
		dijit.form._DropDownTextBox.prototype.onblur.apply(this, arguments);
		dijit.form.RangeBoundTextbox.prototype.onblur.apply(this, arguments);
		this._hasFocus = false;
		this._handleBlurTimer(true, 500);
		
	},

	_handleBlurTimer: function(/*Boolean*/clear, /*Number*/ millisec){
		// summary: collect all blur timers issues here
			
		
			if(this.blurTimer && (clear || millisec)){
				clearTimeout(this.blurTimer);
			}
			if(millisec){ // we ignore that zero is false and never sets as that never happens in this widget

				this.blurTimer = setTimeout(dojo.hitch(this, "_checkBlurred"), millisec);
			}
		
	},

	_onMouseOver: function(/*Event*/ evt){
		// summary: needed in IE and Safari as inputTextNode loses focus when scrolling optionslist
		if(!this._mouseover_list){
			this._handleBlurTimer(true, 0);
			this._mouseover_list = true;
		}
	},

	_onMouseOut:function(/*Event*/ evt){
		// summary: needed in IE and Safari as inputTextNode loses focus when scrolling optionslist
		var relTarget = evt.relatedTarget;
		
			if(!relTarget || relTarget.parentNode != this.optionsListNode){
				this._mouseover_list = false;
				this._handleBlurTimer(true, 100);
				this.focus();
			}
		
	},
	_checkBlurred: function(){
			if(!this._hasFocus && !this._mouseover_list){
				this._hideResultList();
			}
	},
	_selectOption: function(/*Event*/ evt){
		var tgt = null;
		if(!evt){
			// what if nothing is highlighted yet?
			evt = { target: this._highlighted_option };
			if(!evt.target) return;
		}
		if(evt.target&&evt.target.parentNode!=this.optionsListNode){
			
				// handle autocompletion where the the user has hit ENTER or TAB
				// if the input is empty do nothing
				if(!this.textbox.value.length){
					//this._checkValueChanged();
					return;
				}
				tgt = this.optionsListNode.firstChild;
				// user has input value not in option list
				/*if(!tgt || !this._isInputEqualToResult(tgt[this.searchField])){
					this.setValue();
					return;
				}*/
			
		// otherwise the user has accepted the autocompleted value
		}else{
			tgt = evt.target;
		}
		while((tgt.nodeType!=1)||(!tgt.item[this.searchField])){
			tgt = tgt.parentNode;
			if(tgt == dojo.body()){
				//this._checkValueChanged();
				return false;
			}
		}
		this._doSelect(tgt);
		if(!evt.noHide){
			this._hideResultList();
			this._setSelectedRange(this.textbox, 0, null);
		}
		//this._checkValueChanged();
		this.focus();
	},


	_doSelect: function(tgt){
		this.setValue(this.store.getValue(tgt.item, this.searchField));
	},

	arrowClicked: function(){
			// summary: callback when arrow is clicked
		if(this.disabled) return;
		this._handleBlurTimer(true, 0);
		this.focus();
		if(this.popupWidget.isShowingNow){
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
		console.log("_startSearch");
		var query={};
		query[this.searchField]=key+"*";
		this.store.fetch({queryIgnoreCase:this.ignoreCase, query: query, onComplete:dojo.hitch(this, "_openResultList"), count:this.searchLimit});
	},
	_assignHiddenValue:function(/*Object*/ keyValArr, /*DomNode*/ option){
			// not necessary in AutoCompleter
		return;
	},
	postCreate: function(){
		//dijit.form.AutoCompleter.superclass.postCreate.apply(this, arguments);
		dijit.form.SerializableTextbox.prototype.postCreate.apply(this, arguments);
		dijit.form._DropDownTextBox.prototype.postCreate.apply(this, arguments);

		/* different nodes get different parts of the style */
		// FIXME: test different style attributes
		//var source = this.srcNodeRef;
		//this.textbox.style=source.style;
			
		var dpClass=dojo.getObject(this.dataProviderClass, false);
			
		// new dojo.data code
		// is the store not specified?  If so, use inline read
		if(this.store==null){
			if(this.url==""&&this.data==null){
 				dpClass=dojo.getObject("dojo.data.JsonItemStore", false);
				var opts = this.domNode.getElementsByTagName("option");
				var ol = opts.length;
				var data=[];
				for(var x=ol-1; x>=0; x--){
					var text = opts[x].innerHTML;
					var keyValArr = {};
					keyValArr[this.searchField]=String(text);
					this._assignHiddenValue(keyValArr, opts[x]);
					data.unshift(keyValArr);
					this.domNode.removeChild(opts[x]);
					//dojo.dom.removeNode(opts[x]);
				}
				// pass store inline data
				this.data={items:data};
			}
			this.store=new dpClass(this);
		}

		
		dojo.connect(this.optionsListNode, 'onclick', this, '_selectOption');
		dojo.connect(this.optionsListNode, 'onmouseover', this, '_onMouseOver');
		dojo.connect(this.optionsListNode, 'onmouseout', this, '_onMouseOut');
			
		// TODO: why does onmouseover and onmouseout connect to two separate handlers???
		dojo.connect(this.optionsListNode, "onmouseover", this, "_itemMouseOver");
		dojo.connect(this.optionsListNode, "onmouseout", this, "_itemMouseOut");
		if(this.disabled){
			this.disable();
		}
		// FIXME: add state code back
		/*var s = dojo.widget.html.stabile.getState(this.id);
			
		if(s){
			this.setState(s);
		}
		else this.setValue(this.value);*/
		this.setValue(this.value);
		// setting the value here is needed since value="" in the template causes "undefined" on form reset
		this.textbox.setAttribute("value", this.value);
	}
}
);

