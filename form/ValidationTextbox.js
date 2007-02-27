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
		//		Hint string
		promptMessage: "",
		// invalidMessage: String
		// 		The message to display if value is invalid.
		invalidMessage: "",
		// missingMessage: String
		//		The message to display if value is missing or missing.
		missingMessage: "",
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
	
		templatePath: dojo.uri.moduleUri("dijit.form", "templates/ValidationTextbox.html"),
		
		getValue: function(){
			return this.parse(this.textbox.value, this.constraints);
		},
	
		setValue: function(value){
			this.textbox.value = this.format(value, this.constraints);
			this.update(false);
		},
	
		validator: function(value,constraints){
			// summary: user replaceable function used to validate the text input against the regular expression.
			return (new RegExp("^(" + this.regExpGen(constraints) + ")$")).test(value);
		},

		isValid: function(/* Boolean*/ isFocused){
			// summary: Need to over-ride with your own validation code in subclasses
			return this.validator(this.textbox.value, this.constraints);
		},
	
		format: function(/* String */ value, /* Object */ constraints){
			// summary: Convert a primitive value to a properly formatted string
			return value;
		},

		parse: function(/* String */ value, /* Object */ constraints){
			// summary: Convert a properly formatted string to a more primitive value
			return value;
		},

		isEmpty: function() {
			// summary: Checks for whitespace
			return ( /^\s*$/.test(this.textbox.value) ); // Boolean
		},

		isMissing: function(/* Boolean*/ isFocused){
			// summary: Checks to see if value is required and is whitespace
			return ( this.required && this.isEmpty() ); // Boolean
		},
	
		getErrorMessage: function(/* Boolean*/ isFocused){
			if (this.isMissing(isFocused)){ 
				return (this.promptMessage == "" || !isFocused) ? this.missingMessage : this.promptMessage;
			}else if(( this.required || !this.isEmpty() ) && !this.isValid(isFocused)){ return this.invalidMessage; }
		},

		getWarningMessage: function(/* Boolean*/ isFocused){
			if(this.isMissing(false) || (( this.required || !this.isEmpty() ) && !this.isValid(false))){ return this.promptMessage; }
		},

		getValidMessage: function(/* Boolean*/ isFocused){
			if (this.isEmpty()){ return this.promptMessage; }
		},

		update: function(/* Boolean*/ isFocused){
			// summary:
			//		Called by oninit, onblur, and onkeypress.
			// description:
			//		Show missing or invalid messages if appropriate, and highlight textbox field.
			
			// allow base class to handle onValueChanged events
			dijit.form.ValidationTextbox.superclass.setValue.call(this, this.getValue());
			var message = this.getErrorMessage(isFocused);
			if (typeof message == "string"){
				var _class = "dojoInputFieldValidationError";
			}else{
				message = this.getWarningMessage(isFocused);
				if (typeof message == "string"){
					var _class = "dojoInputFieldValidationWarning";
				}else{ 
					var _class = "dojoInputField";
					message = this.getValidMessage(isFocused);
					if (typeof message != "string"){ message = ""; }
				}
			}
			this.messageSpan.innerHTML = message;
			this.updateClass(_class);
		},
		
		updateClass: function(className){
			// summary: used to ensure that only 1 validation class is set at a time
			dojo.html.removeClass(this.textbox,"dojoInputFieldValidationWarning");
			dojo.html.removeClass(this.textbox,"dojoInputFieldValidationError");
			dojo.html.addClass(this.textbox,className);
		},
		
		onfocus: function(evt){
			if (this.listenOnKeyPress){
				this.update(true);
			}else{
				this.updateClass("dojoInputFieldValidationWarning");
			}
		},
	
		onblur: function(evt){ 
			this.filter();
			this.update(false); 
		},
	
		postMixInProperties: function(){
			dijit.form.ValidationTextbox.superclass.postMixInProperties.apply(this, arguments);
			this.messages = dojo.i18n.getLocalization("dijit.form", "validate", this.lang);
			dojo.lang.forEach(["invalidMessage", "missingMessage"], function(prop){
				if(!this[prop]){ this[prop] = this.messages[prop]; }
			}, this);
			var p = this.regExpGen(this.constraints);
			this.regExp = p;
			// make value a string for all types so that form reset works well
			this.value = (this.value == null || this.value == "") ? "" : this.format(this.value, this.constraints);
		},
	
		postCreate: function(){
			dijit.form.ValidationTextbox.superclass.postCreate.apply(this);

			// Attach isMissing and isValid methods to the textbox.
			// We may use them later in connection with a submit button widget.
			// TODO: this is unorthodox; it seems better to do it another way -- Bill
			this.textbox.isValid = function(){ this.isValid.call(this); };
			this.textbox.isMissing = function(){ this.isMissing.call(this); };
			// setting the value here is needed since value="" in the template causes "undefined" on form reset
			this.textbox.setAttribute("value", this.value);
			this.update(false); 
		}
	}
);

dojo.declare(
	"dijit.form.SerializableTextbox",
	dijit.form.ValidationTextbox,
	{
		// summary:
		//		A subclass of ValidationTextbox.
		//		Provides a hidden input field and a serialize method to override

		toString: function(val){
			return val.toString();
		},

		serialize: function(val){
			// summary: user replaceable function used to convert the getValue() result to a String
			return val ? this.toString(val) : "";
		},

		update: function(){
			this.valueNode.value = this.serialize(this.getValue());
			dijit.form.SerializableTextbox.superclass.update.apply(this, arguments);
		},

		postCreate: function(){
			this.valueNode = document.createElement('input');
			this.valueNode.setAttribute("type", this.textbox["type"]);
			this.valueNode.setAttribute("value", this.serialize(this.getValue()));
			this.valueNode.style.display = "none";
			var n = this.textbox.name;
			this.textbox.name = "";
			this.valueNode.name = n;
			dojo.html.insertAfter(this.valueNode, this.textbox);
			dijit.form.SerializableTextbox.superclass.postCreate.apply(this, arguments);
		}
	}
);

dojo.declare(
	"dijit.form.RangeBoundTextbox",
	dijit.form.SerializableTextbox,
	{
		// summary:
		//		A subclass of SerializableTextbox.
		//		Tests for a value out-of-range
		/*===== contraints object:
		// min: Number
		//		Minimum signed value.  Default is -Infinity
		min: undefined,
		// max: Number
		//		Maximum signed value.  Default is +Infinity
		max: undefined,
		=====*/

		// rangeMessage: String
		//              The message to display if value is out-of-range
		rangeMessage: "",

		compare: function(val1, val2){
			// summary: user replaceable function used to compare 2 parsed/primitive values
			return 0;
		},

		rangeCheck: function(/* Number */ primitive, /* Object */ constraints){
			// summary: user replaceable function used to validate the range of the numeric input value
			var isMin = (typeof constraints.min != "undefined");
			var isMax = (typeof constraints.max != "undefined");
			if (isMin || isMax){
				return	(!isMin || this.compare(primitive,constraints.min) >= 0) &&
					(!isMax || this.compare(primitive,constraints.max) <= 0);
			}else{ return true; }
		},

		isInRange: function(/* Boolean*/ isFocused){
			// summary: Need to over-ride with your own validation code in subclasses
			return this.rangeCheck(this.getValue(), this.constraints);
		},
	
		getErrorMessage: function(/* Boolean*/ isFocused){
			var msg = dijit.form.RangeBoundTextbox.superclass.getErrorMessage.apply(this, arguments);
			if (typeof msg != "string"){
				if (this.isValid(false) && !this.isInRange(isFocused)){ return this.rangeMessage; }
			}else{ return msg; }
		},

		postMixInProperties: function(){
			dijit.form.RangeBoundTextbox.superclass.postMixInProperties.apply(this, arguments);
			if (!this.rangeMessage){ 
				this.messages = dojo.i18n.getLocalization("dijit.form", "validate", this.lang);
				this.rangeMessage = this.messages["rangeMessage"];
			}
		}
	}
);
