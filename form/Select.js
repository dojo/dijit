dojo.provide("dijit.form.Select");

dojo.require("dijit.form.AutoCompleter");

dojo.declare(
	"dijit.form.Select",
	[dijit.form.MappedTextbox, dijit.form.AutoCompleterMixin],
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

		// searchAttr: String
		//		Searches pattern match against this field

		// labelAttr: String
		//		Optional.  The text that actually appears in the drop down.
		//		If not specified, the searchAttr text is used instead.
		labelAttr: "",

		// labelType: String
		//		"html" or "text"
		labelType: "text",

		// keyAttr: String
		//		The field of the selected item that the client should send to the server on submit
		keyAttr: "value",

		_callbackSetLabel: function(/*Object*/ result){
			// summary
			//	Callback function that dynamically sets the label of the AutoCompleter

			if(!result.length){
				this._setValue("", "");
			}else{
				this._setValueFromItem(result[0]);
			}
		},

		getValue:function(){
			// don't get the textbox value but rather the previously set hidden value
			return this.valueNode.value;
		},

		_setValue:function(/*String*/ value, /*String*/ displayedValue){
			this.valueNode.value = value;
			dijit.form.Select.superclass.setValue.apply(this, arguments);
		},

		setValue: function(/*String*/ value){
			// summary
			//	Sets the value of the select.
			//	Also sets the label to the corresponding value by reverse lookup.

			// test for blank value
			if(/^\s*$/.test(value)){
				this._setValue("", "");
				return;
			}
			// Defect #1451: set the label by reverse lookup
			var query={};
			query[this.keyAttr]=value;
			// use case sensitivity for the hidden value
			this.store.fetch({queryOptions:{ignoreCase:false}, query:query, onComplete:dojo.hitch(this, "_callbackSetLabel")});
		},

		_setValueFromItem: function(/*Object*/ item){
			// summary
			//	Set the displayed valued in the input box, based on a selected item.
			//	Users shouldn't call this function; they should be calling setDisplayedValue() instead

			this._setValue(this.store.getValue(item, this.keyAttr), this.labelFunc(item, this.store));
		},

		labelFunc: function(/*Object*/ item, /*dojo.data.store*/ store){
			// summary: Event handler called when the label changes
			// returns the label that the AutoCompleter should display
			return store.getValue(item, this.searchAttr);
		},

		_createOption:function(/*Object*/ tr){
			// summary: creates an option to appear on the popup menu

			var td=dijit.form.AutoCompleterMixin.prototype._createOption.apply(this, arguments);
			// #3129
			if(this.labelAttr){
				if(this.labelType=="html"){
					td.innerHTML=this.store.getValue(tr, this.labelAttr);
				}else{
					// prevent parsing of HTML
					var textnode=document.createTextNode(this.store.getValue(tr, this.labelAttr));
					td.innerHTML="";
					td.appendChild(textnode);
				}
			}
			return td;
		},

		onkeyup: function(/*Event*/ evt){
			// summary: internal function
			// Select needs to wait for the complete label before committing to a reverse lookup
			//this.setDisplayedValue(this.textbox.value);
		},

		_assignHiddenValue:function(/*Object*/ keyValArr, /*DomNode*/ option){
			// summary:
			// 	Overrides AutoCompleter._assignHiddenValue for creating a data store from an options list.
			// 	Takes the <option value="CA"> and makes the CA the hidden value of the item.
			keyValArr[this.keyAttr]=option.value;
		},

		_doSelect: function(/*Event*/ tgt){
			// summary:
			//	AutoCompleter's menu callback function
			//	Select overrides this to set both the visible and hidden value from the information stored in the menu

			this._setValueFromItem(tgt.item);
		},

		setDisplayedValue:function(/*String*/ label){
			// summary:
			//	Set textbox to display label
			//	Also performs reverse lookup to set the hidden value
			//	Used in InlineEditBox

			var query=[];
			query[this.searchAttr]=label;
			if(this.store){
				this.store.fetch({query:query, queryOptions:{ignoreCase:this.ignoreCase}, onComplete: dojo.hitch(this, this._callbackSetLabel)});
			}
		}
	}
);
