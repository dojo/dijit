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

		// labelField: String
		//		The text that actually appears in the drop down
		labelField: "name",
	
		// labelType: String
		//		"html" or "text"
		labelType: "text",

		// keyField: String
		//		The field of the selected object that the client should send to the server on submit
		keyField: "value",
		//templatePath: dojo.uri.moduleUri("dijit.form", "templates/AutoCompleter.html"),
		_callbackSetLabel: function(/*Object*/ result){
			// summary
			//	Callback function that dynamically sets the label of the AutoCompleter
			
			if(!result.length){
				this._setLabel("");
			}else{
				this._setLabel(result[0]);
			}
		},
		getState: function(){
			// summary:
			//	Used for saving state of AutoCompleter when navigates to a new
			//	page, in case they then hit the browser's "Back" button.
			var state={};
			state[this.keyField]=this.getValue();
			return state;
		},
		getValue:function(){
			return this.comboBoxSelectionValue.value;
		},
		setState: function(/*Object*/ state){
			// summary:
			//	Used for restoring state of AutoCompleter when has navigated to a new
			//	page but then hits browser's "Back" button.
			this.setValue(state[this.keyField]);
		},
		_setTextFieldValue:function(/*String*/ value){
			// do NOT set the text field to the hidden value!
		},
		_setValue:function(/*String*/ value){
			dijit.form.Select.superclass.setValue.apply(this, arguments);
			this.comboBoxSelectionValue.setAttribute("value",value);
		},
		setValue: function(/*String*/ value){
			// summary
			//	Sets the value of the select.
			//	Also sets the label to the corresponding value by reverse lookup.
			this._setValue(value);
			if(/^\s*$/.test(value)){
				var label=[];
				label[this.searchField]="";
				label[this.keyField]=value;
				this._setLabel(label);
				return;
			}
			// Defect #1451: set the label by reverse lookup
			var query={};
			query[this.keyField]=value;
			function find_onError(e){
				console.log("Error trying to find: "+e);
			}
			// do not use case sensitivity for the hidden value
			this.store.fetch({queryIgnoreCase:false, query:query, onComplete:dojo.hitch(this, "_callbackSetLabel"), onError:find_onError});
		},

		_isInputEqualToResult: function(/*Object*/ result){
			var input = this.textbox.value;
			var testlabel=this.store.getValue(result, this.searchField);
			if(!this.ignoreCase){
				input = input.toLowerCase();
				testlabel = testlabel.toLowerCase();
			}
			return (input == testlabel);
		},
		_setLabel: function(/*Object*/ item){
			// summary
			//	Users shouldn't call this function; they should be calling setTextValue() instead
			
			// get the actual label to display
			var textlabel;
			
			if(this.store.isItem(item)) {
				textlabel=this.store.getValue(item, this.searchField);
			}
			else textlabel=item[this.searchField];
			// if custom label function present, call it
			if(this.labelFunc){
				textlabel=this.labelFunc(item);	
			}
			this.textbox.value = textlabel;
		},
		labelFunc: function(/*Object*/ item){
			// summary: Event handler called when the label changes
			// returns the label that the AutoCompleter should display
			return this.store.getValue(item, this.searchField);
		},
		getState: function(){
			// summary: returns current value and label

			// state variables for Select and AutoCompleter are actually backwards
			// that is why there is code duplication
			var obj={};
			obj[this.keyField]=this.getValue();
			obj[this.searchField]=this.getTextValue();
			return obj;
		},
		_createOption:function(/*Object*/ tr){
			// summary: creates an option to appear on the popup menu
			
			var td=dijit.form.Select.superclass._createOption.apply(this, arguments);
			if(this.labelType=="html"){
				td.innerHTML=tr[this.labelField];
			}
			td[this.keyField]=tr[this.keyField];
			return td;
		},
		onkeyup: function(/*Event*/ evt){
			// summary: internal function
			// Select needs to wait for the complete label before committing to a reverse lookup
			//this.setTextValue(this.textbox.value);
		},

		setState: function(/*Object*/ state){
			// summary: internal function to set both value and label
			this.setValue(state[this.keyField]);
		},

		postCreate: function(){
			this.comboBoxSelectionValue = document.createElement('input');
			this.comboBoxSelectionValue.setAttribute("type", "hidden");
			this.comboBoxSelectionValue.setAttribute("tabindex", -1);
			this.comboBoxSelectionValue.setAttribute("name", this.name);
			this.comboBoxSelectionValue.setAttribute("value", "");
			this.comboBoxSelectionValue.setAttribute("dojoAttachPoint","comboBoxSelectionValue");
			this.domNode.appendChild(this.comboBoxSelectionValue);
			dijit.form.Select.superclass.postCreate.apply(this, arguments);
			this.textbox.removeAttribute("name");
			// setting the value here is needed since value="" in the template causes "undefined" on form reset
			this.comboBoxSelectionValue.setAttribute("value", this.value);
			this.setValue(this.value);
			// FIXME: set this in the right spot so the form resets correctly
			this.textbox.setAttribute("value", this.getTextValue());
			//console.log(this.value);
			//this.setValue(this.value);
		},
		_assignHiddenValue:function(/*Object*/ keyValArr, /*DomNode*/ option){
			keyValArr[this.keyField]=option.value;
		},
		_doSelect: function(/*Event*/ tgt){
			this._setValue(tgt.item[this.keyField]);
			this._setLabel(tgt.item);
		},
		
		_isValidOption: function(){
			// deprecated validation
			// using _validateOption now
			var isValidOption = false;
			// this test doesn't work if optionsListNode is empty (page first loaded)
			//var tgt = dojo.html.firstElement(this.optionsListNode); //PORT
			var tgt=this.optionsListNode.firstChild;
			while(!isValidOption && tgt){
				if(this._isInputEqualToResult(tgt.item)){
					isValidOption = true;
				}else{
					//tgt = dojo.html.nextElement(tgt); //PORT
					tgt=this.optionsListNode.nextSibling;
				}
			}

			return isValidOption;
		},
		setTextValue:function(/*String*/ label){
			// summary: set the label to the passed label.
			// The hidden value is set by reverse lookup
			dijit.form.Select.superclass.setTextValue.apply(this, arguments);
			/*var query={};
			query[this.searchField]=label;
			this.store.fetch({queryIgnoreCase:this.ignoreCase, query: query, onComplete:dojo.hitch(this, this._validateOption) });*/
		},
		_validateOption: function(/*Object*/ ret){
			// summary: callback function.  Checks if user input is valid
			//		after the store checks to see if the user input exists

			// find the user's input in the search results to see if it is valid
			var isValidOption=false;
			for(var i=0; i<ret.length; i++){
				if(this._isInputEqualToResult(ret[i])){
					isValidOption=true;
					// set value by reverse lookup
					this._setValue(this.store.getValue(ret[i], this.keyField));
					this._setLabel(ret[i]);
					break;
				}
			}
			// enforce selection from option list
			if(!isValidOption){
				this.setValue("");
			}
			
		},

		_checkBlurred: function(){
			if(!this._hasFocus && !this._mouseover_list){
				this._hideResultList();
				// clear the list if the user empties field and moves away. (no need to search)
				if(!this.textbox.value.length){
					this.setValue("");
					return;
				}
				// asynchronously validate the user input using store's default search method
				var query={};
				query[this.searchField]=this.textbox.value;
				this.store.fetch({queryIgnoreCase:this.ignoreCase, query: query, onComplete:dojo.hitch(this, this._validateOption) });
			}
		}
	}
);
