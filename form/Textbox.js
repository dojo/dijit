dojo.provide("dijit.form.Textbox");

dojo.require("dijit.base.FormElement");
dojo.require("dijit.base.TemplatedWidget");

dojo.declare(
	"dijit.form.Textbox",
	[dijit.base.FormElement, dijit.base.TemplatedWidget],
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

		//	ucFirst: Boolean
		//		Converts the first character of each word to uppercase if true.
		ucFirst: false,

		// size: String
		//              Basic input tag size declaration.
		size: "20",

		// maxlength: String
		//              Basic input tag maxlength declaration.
		maxlength: "999999",

		//	digit: Boolean
		//		Removes all characters that are not digits if true.  Default is false.
		digit: false,
		
		templatePath: dojo.moduleUrl("dijit.form", "templates/Textbox.html"),
	
		getTextValue: function(){
			return this.filter(this.textbox.value);
		},

		getValue: function(){
			return this.parse(this.getTextValue(), this.constraints);
		},

		setTextValue: function(value){
			this.textbox.value = this.filter(value);
		},

		setValue: function(value){
			if (value == null){ value = ""; }
			this.setTextValue((value == "")? "" : this.format(value, this.constraints));
			dijit.form.Textbox.superclass.setValue.call(this,value);
		},

		format: function(/* String */ value, /* Object */ constraints){
			// summary: Replacable function to convert a value to a properly formatted string
			return value;
		},

		parse: function(/* String */ value, /* Object */ constraints){
			// summary: Replacable function to convert a formatted string to a value
			return value;
		},

		postCreate: function() {
			dijit.form.Textbox.superclass.postCreate.apply(this);
			// get the node for which the background color will be updated
			if (typeof this.nodeWithBorder != "object"){
				this.nodeWithBorder = this.textbox;
			}
			// assign value programatically in case it has a quote in it
			this.setTextValue(this.value);
		},

		filter: function(val){
			// summary: Apply various filters to textbox value
			if(this.trim){
				val = val.replace(/(^\s*|\s*$)/g, "");
			} 
			if(this.uppercase){
				val = val.toUpperCase();
			} 
			if(this.lowercase){
				val = val.toLowerCase();
			} 
			if(this.ucFirst){
//PORT is this intended to work on all words or first only?  Perhaps we should use a name more consistent with Dojo's style like capitalize or capitalizeAll?
				val = val.replace(/[^\s]+/g, function(word){
					return word.substring(0,1).toUpperCase() + word.substring(1);
				});
			} 
			if(this.digit){
				val = val.replace(/\D/g, "");
			} 
			return val;
		},
	
		focus: function(){
			// summary: if the widget wants focus, then focus the textbox
			this.textbox.focus();
		},

		// event handlers, you can over-ride these in your own subclasses
		onfocus: function(){
			// addClass dojoInputFieldFocused
			this._addClass(this.nodeWithBorder, "dojoInputFieldFocused");
		},
		onblur: function(){
			// removeClass dojoInputFieldFocused
			this._removeClass(this.nodeWithBorder, "dojoInputFieldFocused");

			this.setValue(this.getValue()); 
		},
		onkeyup: function(){ 
			// TODO: it would be nice to massage the value (ie: automatic uppercase, etc) as the user types
			// but this messes up the cursor position if you are typing into the middle of a word, and
			// also trimming doesn't work correctly (it prevents spaces between words too!)
			// this.setValue(this.getValue()); 
		}
	}
);
