dojo.provide("dijit.form.Select");

dojo.require("dijit.form.AutoCompleter");

dojo.declare(
	"dijit.form.Select",
	[dijit.form.SerializableTextbox, dijit.form.AutoCompleterMixin],
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

		_callbackSetLabel: function(/*Object*/ result){
			// summary
			//	Callback function that dynamically sets the label of the AutoCompleter
			
			if(!result.length){
				this._setLabel("");
				this._setValue("");
			}else{
				this._setLabel(result[0]);
				this._setValue(this.store.getValue(result[0], this.keyField));
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
			return this.valueNode.value;
		},

		setState: function(/*Object*/ state){
			// summary:
			//	Used for restoring state of AutoCompleter when has navigated to a new
			//	page but then hits browser's "Back" button.
			this.setValue(state[this.keyField]);
		},

		_setTextFieldValue:function(/*String*/ value){
			// do NOT set the visible text field to the hidden value!
			this.valueNode.value=value;
		},

		_setValue:function(/*String*/ value){

			// stop the setTextValue recursion going on in Textbox
			this.settingValue=true;
			dijit.form.AutoCompleterMixin.prototype.setValue.apply(this, arguments);
			this.settingValue=false;
		},
// Bill: see comments in Autocompleter about settingValue and setValue/setTextValue().
// This all seems overcomplicated.
// If it helps, you can call any function directly, such as:
// dijit.form.FormElement.prototype.setValue.apply(this, arguments)

		setValue: function(/*String*/ value){
			// summary
			//	Sets the value of the select.
			//	Also sets the label to the corresponding value by reverse lookup.
			if(/^\s*$/.test(value)){
				var label=[];
				label[this.searchAttr]="";
				label[this.keyField]=value;
				this._setLabel(label);
				return;
// Bill: This code is for clearing the value (and label), but in that case
// you shouldn't use a fake item attribute; rather just have a clearLabel()
// function or something, or just inline the code here

			}
			// Defect #1451: set the label by reverse lookup
			var query={};
			query[this.keyField]=value;
			// use case sensitivity for the hidden value
			this.store.fetch({queryIgnoreCase:false, query:query, onComplete:dojo.hitch(this, "_callbackSetLabel")});
		},

		_setLabel: function(/*Object*/ item){
			// summary
			//	Set the displayed valued in the input box, based on a selected item.
			//	Users shouldn't call this function; they should be calling setTextValue() instead
			
// Bill: users shouldn't be calling setTextValue() either.   Just setValue() and getValue()

			// get the actual label to display
			var textlabel = this.store.isItem(item) ? this.store.getValue(item, this.searchAttr) : item[this.searchAttr];

			// if custom label function present, call it
			if(this.store.isItem(item)){
				textlabel=this.labelFunc(item);
			}
			this.textbox.value = textlabel;
		},

		labelFunc: function(/*Object*/ item){
			// summary: Event handler called when the label changes
			// returns the label that the AutoCompleter should display
			return this.store.getValue(item, this.searchAttr);
		},

		_createOption:function(/*Object*/ tr){
			// summary: creates an option to appear on the popup menu
			
			var td=dijit.form.AutoCompleterMixin.prototype._createOption.apply(this, arguments);
			if(this.labelType=="html"){
				td.innerHTML=tr[this.labelField];
			}
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
			dijit.form.AutoCompleterMixin.prototype.postCreate.apply(this, arguments);

			// InlineEditBox creates a listener for onValueChanged in an onLoad event
			// if you set the value of Select in postCreate,
			// InlineEditBox will not get the right text value because it is not necessarily listening yet!
			// This addOnLoad prevents race conditions by allowing the InlineEditBox to create the listener first
			// Ideally, dojo.data would support a synchronous fetch so getTextValue could get the right label in time,
			// but it does not, so we do this instead.
			var _this=this;
			dojo.addOnLoad(function(){
				_this.setValue(_this.value);
			});
		},

		_assignHiddenValue:function(/*Object*/ keyValArr, /*DomNode*/ option){
			// summary:
			// 	Overrides AutoCompleter._assignHiddenValue for creating a data store from an options list.
			// 	Takes the <option value="CA"> and makes the CA the hidden value of the item.
			keyValArr[this.keyField]=option.value;
		},

		_doSelect: function(/*Event*/ tgt){
			// summary:
			//	AutoCompleter's menu callback function
			//	Select overrides this to set both the visible and hidden value from the information stored in the menu
			this._setLabel(tgt.item);
			this._setValue(this.store.getValue(tgt.item, this.keyField));
		},

		setTextValue:function(/*String*/ label){
			// summary:
			//	Set textbox to display label
			//	Also performs reverse lookup to set the hidden value
			//	Used in InlineEditBox

			var query=[];
			query[this.searchAttr]=label;
			// stop the recursion
			if(!this.settingValue){
				this.parentClass.setTextValue.apply(this, arguments);
				if(this.store){
					this.store.fetch({query:query, queryIgnoreCase:this.ignoreCase, onComplete: dojo.hitch(this, this._validateOption)});
				}
			}
		},

		_isInputEqualToResult: function(/*Object*/ result){
			// TODO: pass through labelFunc
			var input = this.textbox.value;
			var testlabel;
			if(this.store.isItem(result)){
				testlabel=this.store.getValue(result, this.searchAttr);
			}else{
				testlabel=result[this.searchAttr];
			}
			if(!this.ignoreCase){
				input = input.toLowerCase();
				testlabel = testlabel.toLowerCase();
			}
			return (input == testlabel);
		},

		_validateOption: function(/*Object*/ ret){
			// summary: callback function.  Checks if user input is valid
			//		after the store checks to see if the user input exists
			//		ret is just the result from a direct query (only a few items)

			// find the user's input in the search results to see if it is valid
			var isValidOption=false;
			for(var i=0; i<ret.length; i++){
				if(this._isInputEqualToResult(ret[i])){
					isValidOption=true;
					// set value by reverse lookup
					this._setLabel(ret[i]);
					this._setValue(this.store.getValue(ret[i], this.keyField));
					break;
				}
			}
			// enforce selection from option list
			if(!isValidOption){
				this.setValue("");
			}
		}
	}
);
