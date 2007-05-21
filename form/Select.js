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

		// labelAttr: String
		//		The text that actually appears in the drop down
		labelAttr: "name",

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
				this.setValue("");
			}else{
				this._setLabel(result[0]);
				this._setValue(this.store.getValue(result[0], this.keyAttr));
			}
		},

		getValue:function(){
			return this.valueNode.value;
		},

		_setTextFieldValue:function(/*String*/ value){
			// do NOT set the visible text field to the hidden value!
			this.valueNode.value=value;
		},

		_setValue:function(/*String*/ value){

			// stop the setTextValue recursion going on in Textbox
			// can't circumvent Textbox's setValue because that is where the ValidationTextbox code happens
			this.settingValue=true;
			dijit.form.AutoCompleterMixin.prototype.setValue.apply(this, arguments);
			this.settingValue=false;
		},

		setValue: function(/*String*/ value){
			// summary
			//	Sets the value of the select.
			//	Also sets the label to the corresponding value by reverse lookup.

			// test for blank value
			if(/^\s*$/.test(value)){
				this._setValue("");
				// _setValue does not set the text value because settingValue is true
				this.textbox.value="";
				return;
			}
			// Defect #1451: set the label by reverse lookup
			var query={};
			query[this.keyAttr]=value;
			// use case sensitivity for the hidden value
			this.store.fetch({queryIgnoreCase:false, query:query, onComplete:dojo.hitch(this, "_callbackSetLabel")});
		},

		_setLabel: function(/*Object*/ item){
			// summary
			//	Set the displayed valued in the input box, based on a selected item.
			//	Users shouldn't call this function; they should be calling setTextValue() instead
			
			this.textbox.value = this.labelFunc(item, this.store);
		},

		labelFunc: function(/*Object*/ item, /*dojo.data.store*/ store){
			// summary: Event handler called when the label changes
			// returns the label that the AutoCompleter should display
			return store.getValue(item, this.searchAttr);
		},

		_createOption:function(/*Object*/ tr){
			// summary: creates an option to appear on the popup menu
			
			var td=dijit.form.AutoCompleterMixin.prototype._createOption.apply(this, arguments);
			if(this.labelType=="html"){
				td.innerHTML=this.store.getValue(tr, this.labelAttr);
			}
			return td;
		},

		onkeyup: function(/*Event*/ evt){
			// summary: internal function
			// Select needs to wait for the complete label before committing to a reverse lookup
			//this.setTextValue(this.textbox.value);
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
			keyValArr[this.keyAttr]=option.value;
		},

		_doSelect: function(/*Event*/ tgt){
			// summary:
			//	AutoCompleter's menu callback function
			//	Select overrides this to set both the visible and hidden value from the information stored in the menu
			this._setLabel(tgt.item);
			this._setValue(this.store.getValue(tgt.item, this.keyAttr));
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
					this.store.fetch({query:query, queryIgnoreCase:this.ignoreCase, onComplete: dojo.hitch(this, this._callbackSetLabel)});
				}
			}
		}
	}
);
