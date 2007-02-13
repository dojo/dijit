dojo.provide("dijit.form.ValidationTextbox");

dojo.require("dijit.form.Textbox");
dojo.require("dojo.i18n.common");

dojo.requireLocalization("dijit.form", "validate");

dojo.declare(
	"dijit.form.ValidationTextbox",
	dijit.form.Textbox,
	{
		// summary:
		//		A subclass of Textbox.
		//		Over-ride isValid in subclasses to perform specific kinds of validation.

		// default values for new subclass properties
		// required: Boolean
		//		Can be true or false, default is false.
		required: false,
		// promptMessage: String
		//		Will not issue invalid message if field is populated with default user-prompt text
		promptMessage: "",
		// invalidMessage: String
		// 		The message to display if value is invalid.
		invalidMessage: "",
		// missingMessage: String
		//		The message to display if value is missing or missing.
		missingMessage: "",
		// rangeMessage: String
		//		The message to display if value is out-of-range
		rangeMessage: "",
		// listenOnKeyPress: Boolean
		//		Updates messages on each key press.  Default is true.
		listenOnKeyPress: true,
		// constraints: Object
		//		user-defined object needed to pass parameters to the validator functions
		constraints: {},
		// regExp: String
		//		regular expression string used to validate the input
		//		Do not specify both regExp and regExpGen
		regExp: ".*",
		// regExpGen: Function
		//		user replaceable function used to generate regExp when dependent on constraints
		//		Do not specify both regExp and regExpGen
		regExpGen: function(constraints){ return this.regExp; },
		lastCheckedValue: null,
	
		templatePath: dojo.uri.moduleUri("dijit.form", "templates/ValidationTextbox.html"),
		
		getValue: function() {
			return this.textbox.value;
		},
	
		setValue: function(value) {
			this.textbox.value = value;
			this.update();
		},
	
		validator: function(value,constraints){
			// summary: user replaceable function used to validate the text input against the regular expression.
			return (new RegExp("^(" + this.regExpGen(constraints) + ")$")).test(value);
		},

		isValid: function() {
			// summary: Need to over-ride with your own validation code in subclasses
			return this.validator(this.textbox.value, this.constraints);
		},
	
		rangeCheck: function(value,constraints){
			// summary: user replaceable function used to validate the range of the numeric input value
			if ((typeof constraints.min == "number") || (typeof constraints.min == "number")){
				return dojo.validate.isInRange(value, constraints);
			}else{ return true; }
		},

		isInRange: function() {
			// summary: Need to over-ride with your own validation code in subclasses
			return this.rangeCheck(this.textbox.value, this.constraints);
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
	
			var empty = this.isEmpty();
			var valid = true;
			if(this.promptMessage != this.textbox.value){ 
				valid = this.isValid(); 
			}
			var missing = this.isMissing();
	
			// Display at most one error message
			if(missing){
				this.messageSpan.innerHTML = this.missingMessage;
			}else if( !empty && !valid ){
				this.messageSpan.innerHTML = this.invalidMessage;
			}else if( !empty && !this.isInRange() ){
				this.messageSpan.innerHTML = this.rangeMessage;
			}else{
				this.messageSpan.innerHTML = "";
			}

			this.highlight();
		},
		
		updateClass: function(className){
			// summary: used to ensure that only 1 validation class is set at a time
			dojo.html.removeClass(this.textbox,"dojoInputFieldValidationWarning");
			dojo.html.removeClass(this.textbox,"dojoInputFieldValidationError");
			dojo.html.addClass(this.textbox,className);
		},
		
		highlight: function() {
			// summary: by Called oninit, and onblur.
			
			// highlight textbox background 
			if (this.isEmpty()) {
				this.updateClass("dojoInputFieldValidationError");
			}else if (this.isValid() && this.isInRange() ){
				this.updateClass("dojoInputField");
			}else if(this.textbox.value != this.promptMessage){ 
				this.updateClass("dojoInputFieldValidationError");
			}else{
				this.updateClass("dojoInputFieldValidationWarning");
			}
		},
	
		onfocus: function(evt) {
			if ( !this.listenOnKeyPress) {
				this.updateClass("dojoInputFieldValidationWarning");
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
				this.updateClass("dojoInputFieldValidationWarning");
			}
		},

		postMixInProperties: function(localProperties, frag) {
			dijit.form.ValidationTextbox.superclass.postMixInProperties.apply(this, arguments);
			this.messages = dojo.i18n.getLocalization("dijit.form", "validate", this.lang);
			dojo.lang.forEach(["invalidMessage", "missingMessage", "rangeMessage"], function(prop) {
				if(!this[prop]){ this[prop] = this.messages[prop]; }
			}, this);
			var p = this.regExpGen(this.constraints);
			this.regExp = p;
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
		}
	}
);
