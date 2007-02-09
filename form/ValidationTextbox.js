dojo.provide("dijit.form.ValidationTextbox");

dojo.require("dijit.form.Textbox");
dojo.require("dojo.i18n.common");

dojo.requireLocalization("dijit.form", "validate");

dojo.declare(
	"dijit.form.ValidationTextbox",
	dijit.form.Textbox,
	function() {
		// summary:
		//		A subclass of Textbox.
		//		Over-ride isValid in subclasses to perform specific kinds of validation.
		
		// this property isn't a primitive and needs to be created on a per-item basis.
		this.flags = {};
	},
	{
		// default values for new subclass properties
		// required: Boolean
		//		Can be true or false, default is false.
		required: false,
		// rangeClass: String
		//              Override default class used for out-of-range input data
		rangeClass: "range",
		// invalidClass: String
		//		Class used to format displayed text in page if necessary to override default class
		invalidClass: "invalid",
		// missingClass: String
		//              Override default class used for missing input data
		missingClass: "missing",
		classPrefix: "dojoValidate",
		// size: String
		//		Basic input tag size declaration.
		size: "",
		// maxlength: String
		//		Basic input tag maxlength declaration.	
		maxlength: "",
		// promptMessage: String
		//		Will not issue invalid message if field is populated with default user-prompt text
		promptMessage: "",
		// invalidMessage: String
		// 		The message to display if value is invalid.
		invalidMessage: "",
		// missingMessage: String
		//		The message to display if value is missing.
		missingMessage: "",
		rangeMessage: "",
		// listenOnKeyPress: Boolean
		//		Updates messages on each key press.  Default is true.
		listenOnKeyPress: true,
		lastCheckedValue: null,
	
		templatePath: dojo.uri.moduleUri("dijit.form", "templates/ValidationTextbox.html"),
		
		// new DOM nodes
		invalidSpan: null,
		missingSpan: null,
		rangeSpan: null,

		getValue: function() {
			return this.textbox.value;
		},
	
		setValue: function(value) {
			this.textbox.value = value;
			this.update();
		},
	
		isValid: function() {
			// summary: Need to over-ride with your own validation code in subclasses
			return true;
		},
	
		isInRange: function() {
			// summary: Need to over-ride with your own validation code in subclasses
			return true;
		},
	
		isEmpty: function() {
			// summary: Checks for whitespace
			return ( /^\s*$/.test(this.textbox.value) ); // Boolean
		},
	
		isMissing: function() {
			// summary: Checks to see if value is required and is whitespace
			return ( this.required && this.isEmpty() ); // Boolean
		},
	
		update: function() {
			// summary:
			//		Called by oninit, onblur, and onkeypress.
			// description:
			//		Show missing or invalid messages if appropriate, and highlight textbox field.
			this.lastCheckedValue = this.textbox.value;
			this.missingSpan.style.display = "none";
			this.invalidSpan.style.display = "none";
			this.rangeSpan.style.display = "none";
	
			var empty = this.isEmpty();
			var valid = true;
			if(this.promptMessage != this.textbox.value){ 
				valid = this.isValid(); 
			}
			var missing = this.isMissing();
	
			// Display at most one error message
			if(missing){
				this.missingSpan.style.display = "";
			}else if( !empty && !valid ){
				this.invalidSpan.style.display = "";
			}else if( !empty && !this.isInRange() ){
				this.rangeSpan.style.display = "";
			}
			this.highlight();
		},
		
		updateClass: function(className){
			// summary: used to ensure that only 1 validation class is set at a time
			var pre = this.classPrefix;
			dojo.html.removeClass(this.textbox,pre+"Empty");
			dojo.html.removeClass(this.textbox,pre+"Valid");
			dojo.html.removeClass(this.textbox,pre+"Invalid");
			dojo.html.addClass(this.textbox,pre+className);
		},
		
		highlight: function() {
			// summary: by Called oninit, and onblur.
			
			// highlight textbox background 
			if (this.isEmpty()) {
				this.updateClass("Empty");
			}else if (this.isValid() && this.isInRange() ){
				this.updateClass("Valid");
			}else if(this.textbox.value != this.promptMessage){ 
				this.updateClass("Invalid");
			}else{
				this.updateClass("Empty");
			}
		},
	
		onfocus: function(evt) {
			if ( !this.listenOnKeyPress) {
				this.updateClass("Empty");
			}
		},
	
		onblur: function(evt) { 
			this.filter();
			this.update(); 
		},
	
		onkeyup: function(evt){ 
			if(this.listenOnKeyPress){ 
				//this.filter();  trim is problem if you have to type two words
				this.update(); 
			}else if (this.textbox.value != this.lastCheckedValue){
				this.updateClass("Empty");
			}
		},

		postMixInProperties: function(localProperties, frag) {
			dijit.form.ValidationTextbox.superclass.postMixInProperties.apply(this, arguments);
			this.messages = dojo.i18n.getLocalization("dijit.form", "validate", this.lang);
			dojo.lang.forEach(["invalidMessage", "missingMessage", "rangeMessage"], function(prop) {
				if(this[prop]){ this.messages[prop] = this[prop]; }
			}, this);
		},
	
		postCreate: function() {
			dijit.form.ValidationTextbox.superclass.postCreate.apply(this);

			// Attach isMissing and isValid methods to the textbox.
			// We may use them later in connection with a submit button widget.
			// TODO: this is unorthodox; it seems better to do it another way -- Bill
			this.textbox.isValid = function() { this.isValid.call(this); };
			this.textbox.isMissing = function() { this.isMissing.call(this); };
			this.textbox.isInRange = function() { this.isInRange.call(this); };
			this.update(); 
			
			// apply any filters to initial value
			this.filter();
		}
	}
);
