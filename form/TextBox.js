dojo.provide("dijit.form.TextBox");

dojo.require("dijit.form._FormWidget");

dojo.declare(
	"dijit.form.TextBox",
	dijit.form._FormWidget,
	{
		// summary:
		//		A generic textbox field.
		//		Serves as a base class to derive more specialized functionality in subclasses.

		//	trim: Boolean
		//		Removes leading and trailing whitespace if true.  Default is false.
		trim: false,

		//	uppercase: Boolean
		//		Converts all characters to uppercase if true.  Default is false.
		uppercase: false,

		//	lowercase: Boolean
		//		Converts all characters to lowercase if true.  Default is false.
		lowercase: false,

		//	propercase: Boolean
		//		Converts the first character of each word to uppercase if true.
		propercase: false,

		// size: String
		//		HTML INPUT tag size declaration.
		size: "20",

		// maxlength: String
		//		HTML INPUT tag maxlength declaration.
		maxlength: "999999",

		templatePath: dojo.moduleUrl("dijit.form", "templates/TextBox.html"),

		getTextValue: function(){
			return this.textbox.value;
		},

		getValue: function(){
			return this.parse(this.getTextValue(), this.constraints);
		},

		setValue: function(value, /*Boolean, optional*/ priorityChange, /*String, optional*/ formattedValue){
			var filteredValue = this.filter(value);
			if(filteredValue != "" && (formattedValue == null || formattedValue == undefined)){
				formattedValue = this.format(filteredValue, this.constraints);
			}
			if(formattedValue != null && formattedValue != undefined){
				this.textbox.value = formattedValue;
			}
			dijit.form.TextBox.superclass.setValue.call(this, filteredValue, priorityChange);
		},

		forWaiValuenow: function(){
			return this.getTextValue();
		},

		format: function(/* String */ value, /* Object */ constraints){
			// summary: Replacable function to convert a value to a properly formatted string
			return (value.toString ? value.toString() : value);
		},

		parse: function(/* String */ value, /* Object */ constraints){
			// summary: Replacable function to convert a formatted string to a value
			return value;
		},

		postCreate: function(){
			// get the node for which the background color will be updated
			if(typeof this.nodeWithBorder != "object"){
				this.nodeWithBorder = this.textbox;
			}
			// setting the value here is needed since value="" in the template causes "undefined"
			// and setting in the DOM (instead of the JS object) helps with form reset actions
			this.textbox.setAttribute("value", this.getTextValue());
			this.inherited('postCreate', arguments);
		},

		filter: function(val){
			// summary: Apply various filters to textbox value
			if(val == undefined || val == null){ val = ""; }
			if(this.trim){
				val = dojo.trim(val);
			}
			if(this.uppercase){
				val = val.toUpperCase();
			}
			if(this.lowercase){
				val = val.toLowerCase();
			}
			if(this.propercase){
				val = val.replace(/[^\s]+/g, function(word){
					return word.substring(0,1).toUpperCase() + word.substring(1);
				});
			}
			return val;
		},

		// event handlers, you can over-ride these in your own subclasses
		// TODO: this should be _onFocus (and onfocus removed from the template)
		onfocus: function(){
			dojo.addClass(this.nodeWithBorder, "dijitInputFieldFocused");
		},

		_onBlur: function(){
			dojo.removeClass(this.nodeWithBorder, "dijitInputFieldFocused");

			this.setValue(this.getValue(), (this.isValid ? this.isValid() : true));
		},

		onkeyup: function(){
			// TODO: it would be nice to massage the value (ie: automatic uppercase, etc) as the user types
			// but this messes up the cursor position if you are typing into the middle of a word, and
			// also trimming doesn't work correctly (it prevents spaces between words too!)
			// this.setValue(this.getValue());
		}
	}
);
