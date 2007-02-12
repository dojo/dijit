dojo.provide("dijit.form.Textbox");

dojo.require("dojo.lang.common");
dojo.require("dojo.string.extras");
dojo.require("dojo.i18n.common");

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
		size: "",

		// maxlength: String
		//              Basic input tag maxlength declaration.
		maxlength: "",

		//	digit: Boolean
		//		Removes all characters that are not digits if true.  Default is false.
		digit: false,
		
		templatePath: dojo.uri.moduleUri("dijit.form", "templates/Textbox.html"),
	
		postCreate: function() {
			dijit.form.Textbox.superclass.postCreate.apply(this);
			// assign value programatically in case it has a quote in it
			this.textbox.value = this.value;
			this.filter();
		},

		filter: function() {
			// summary: Apply various filters to textbox value
			if (this.trim) {
				this.textbox.value = this.textbox.value.replace(/(^\s*|\s*$)/g, "");
			} 
			if (this.uppercase) {
				this.textbox.value = this.textbox.value.toUpperCase();
			} 
			if (this.lowercase) {
				this.textbox.value = this.textbox.value.toLowerCase();
			} 
			if (this.ucFirst) {
				this.textbox.value = dojo.string.capitalize(this.textbox.value);
			} 
			if (this.digit) {
				this.textbox.value = this.textbox.value.replace(/\D/g, "");
			} 
		},
	
		// event handlers, you can over-ride these in your own subclasses
		onfocus: function() {},
		onblur: function() { this.filter(); }
	}
);
