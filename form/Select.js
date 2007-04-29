dojo.provide("dijit.form.Select");

dojo.require("dijit.form.AutoCompleter");
//dojo.require("dojo.widget.*");
//dojo.require("dojo.widget.html.stabile");


dojo.declare(
	"dijit.form.Select",
	dijit.form.AutoCompleter,
	{
		/*
		 * summary
		 *	Enhanced version of HTML's <select> tag.
		 *
		 *	Similar features:
		 *	  - There is a drop down list of possible values.
		 *    - You can only enter a value from the drop down list.  (You can't enter an arbitrary value.)
		 *    - The value submitted with the form is the hidden value (ex: CA),
		 *      not the displayed value a.k.a. label (ex: California)
		 *
		 *	Enhancements over plain HTML version:
		 *    - If you type in some text then it will filter down the list of possible values in the drop down list.
		 *    - List can be specified either as a static list or via a javascript function (that can get the list from a server)
		 */

		// keyField: String
		//		The field of the selected object that the client should send to the server on submit
		keyField: "value",
		//templatePath: dojo.uri.moduleUri("dijit.form", "templates/AutoCompleter.html"),
		_callbackSetLabel: function(/*Object*/ result) {
			// summary
			//	Callback function that dynamically sets the label of the AutoCompleter
			if(!result.length) this._setLabel("");
			else {
				try {
					this._setLabel(this.store.getValue(result[0],this.searchField, ""));
				}
				catch(e) {
					console.log("Error in Select._callbackSetLabel: "+e);
				}
			}
		},
		getState: function(){
			// summary:
			//	Used for saving state of AutoCompleter when navigates to a new
			//	page, in case they then hit the browser's "Back" button.
			var state=new Object();
			state[this.keyField]=this.getValue();
			return state;
		},

		setState: function(/*Object*/ state){
			// summary:
			//	Used for restoring state of AutoCompleter when has navigated to a new
			//	page but then hits browser's "Back" button.
			this.setValue(state[this.keyField]);
		},
		_setValue:function(/*String*/ value) {
			this.comboBoxValue.value = value;
			try {
				this._checkValueChanged();
			}
			catch(e) {
				console.log("Error in Select._setValue: "+e);
			}
		},
		setValue: function(/*String*/ value) {
			// summary
			//	Sets the value of the select.
			//	Also sets the label to the corresponding value by reverse lookup.
			this._setValue(value);
			if(/^\s*$/.test(value)) {
				this._setLabel("");
				return;
			}
			// Defect #1451: set the AutoCompleter label by reverse lookup
			var query=new Object();
			query[this.keyField]=value;
			function find_onError(e) {
				console.log("Error trying to find: "+e);
			}
			try {
				this.store.fetch({ query:query, onComplete:dojo.hitch(this, "_callbackSetLabel"), onError:find_onError});
			}
			catch(e) {
				// silent; popup or store might not be initialized yet
				console.log("Error in Select.setValue.fetch: "+e);
			}
		},
		_setLabel: function(/*String*/ value){
			// summary
			//	Users shouldn't call this function; they should be calling setTextValue() instead

			// if custom label function present, call it
			if(this.labelFunc)  {
			try {
				value=this.labelFunc(value);
			}
			catch(e) {
				console.log("Error calling user defined labelFunc. "+e.message);
			}
			}
			this.comboBoxSelectionValue.value = value;
			if (this.textInputNode.value != value) { // prevent mucking up of selection
				this.textInputNode.value = value;
			}
		},

		getState: function() {
			// summary: returns current value and label

			// state variables for Select and AutoCompleter are actually backwards
			// that is why there is code duplication
			var obj=new Object();
			obj[this.keyField]=this.getValue();
			obj[this.searchField]=this.getTextValue();
			return obj;
		},
		_createOption:function(/*Object*/ tr) {
			// summary: creates an option to appear on the popup menu
			var td=dijit.form.Select.superclass._createOption.apply(this, arguments);
			td.setAttribute("resultValue", tr[this.keyField]);
			return td;
		},
		_onKeyUp: function(/*Event*/ evt){
			// summary: internal function

			// Select needs to wait for the complete label before committing to a reverse lookup
			//this.setTextValue(this.textInputNode.value);
		},

		setState: function(/*Object*/ state) {
			// summary: internal function to set both value and label
			this.setValue(state[this.keyField]);
		},

		
		postCreate: function(){
			this.comboBoxSelectionValue = document.createElement('input');
			this.comboBoxSelectionValue.setAttribute("tabindex", -1);
			this.comboBoxSelectionValue.setAttribute("name", this.name+"_selected");
			this.comboBoxSelectionValue.setAttribute("value", "");
			this.comboBoxSelectionValue.setAttribute("dojoAttachPoint","comboBoxSelectionValue");
			this.comboBoxSelectionValue.style.display = "none";
			dijit.form.Select.superclass.postCreate.apply(this, arguments);
			console.log(this.value);
			this.setValue(this.value);
		},
		_assignHiddenValue:function(/*Object*/ keyValArr, /*DomNode*/ option) {
			keyValArr[this.keyField]=option.value;
		},
		_doSelect: function(/*Event*/ tgt) {
			this._setValue(tgt.getAttribute("resultValue"));
			this._setLabel(tgt.getAttribute("resultName"));
		},

		
		_isValidOption: function(){
			// deprecated validation
			// using _validateOption now
			var isValidOption = false;
			// this test doesn't work if optionsListNode is empty (page first loaded)
			var tgt = dojo.html.firstElement(this.optionsListNode);
			if(!tgt) {
				// result list not visible; read from store
				
			}
			else {
			while(!isValidOption && tgt){
				if(this._isInputEqualToResult(tgt.getAttribute("resultName"))){
					isValidOption = true;
				}else{
					tgt = dojo.html.nextElement(tgt);
				}
			}
			}
			return isValidOption;
		},
		getTextValue: function(){
			// summary: returns current label
			return this.comboBoxSelectionValue.value;	// String
		},
		setTextValue:function(/*String*/ label) {
			// summary: set the label to the passed label.
			// The hidden value is set by reverse lookup
			var query=new Object();
			query[this.searchField]=label;
			this.store.fetch({ query: query, onComplete:dojo.hitch(this, this._validateOption) });
		},
		_validateOption: function(/*Object*/ ret) {
			// summary: callback function.  Checks if user input is valid
			//		after the store checks to see if the user input exists

			// find the user's input in the search results to see if it is valid
			var isValidOption=false;
			try {
			for(var i=0; i<ret.length; i++) {
				if(this._isInputEqualToResult(this.store.getValue(ret[i], this.searchField))) {
					isValidOption=true;
					// set value by reverse lookup
					this._setValue(this.store.getValue(ret[i], this.keyField));
					break;
				}
			}
			}
			catch(e) {
				console.log("Error in Select._validateOption: "+e.message);
			}

			// enforce selection from option list
			if(!isValidOption){
				this.setValue("");
			}
			this._checkValueChanged();
		},
		_checkBlurred: function(){
			
			if(!this._hasFocus && !this._mouseover_list){
				this._hideResultList();
				// clear the list if the user empties field and moves away. (no need to search)
				if(!this.textInputNode.value.length){
					this.setValue("");
					return;
				}
				
	
				// asynchronously validate the user input using store's default search method
				this.setTextValue(this.textInputNode.value);
			}
		}
	}
);
