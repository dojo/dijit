dojo.provide("dijit.form.ValidationTextBox");

dojo.require("dojo.i18n");

dojo.require("dijit.form.TextBox");
dojo.require("dijit.Tooltip");

dojo.requireLocalization("dijit.form", "validate");

dojo.declare(
	"dijit.form.ValidationTextBox",
	dijit.form.TextBox,
	{
		// summary:
		//		A subclass of TextBox.
		//		Over-ride isValid in subclasses to perform specific kinds of validation.

		templatePath: dojo.moduleUrl("dijit.form", "templates/ValidationTextBox.html"),
		baseClass: "dijitTextBox",

		// default values for new subclass properties
		// required: Boolean
		//		Can be true or false, default is false.
		required: false,

		// promptMessage: String
		//		Hint string
		promptMessage: "",

		// invalidMessage: String
		// 		The message to display if value is invalid.
		invalidMessage: "$_unset_$", // read from the message file if not overridden

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

		// state: String
		//		Shows current state (ie, validation result) of input (Normal, Warning, or Error)
		state: "",

		//	tooltipPosition: String[]
		//		See description of dijit.Tooltip.defaultPosition for details on this parameter.
		tooltipPosition: [],

		setValue: function(){
			this.inherited(arguments);
			this.validate(false);
		},

		validator: function(value,constraints){
			// summary: user replaceable function used to validate the text input against the regular expression.
			return (new RegExp("^(" + this.regExpGen(constraints) + ")"+(this.required?"":"?")+"$")).test(value) &&
				(!this.required || !this._isEmpty(value)) &&
				(this._isEmpty(value) || this.parse(value, constraints) !== undefined);
		},

		isValid: function(/* Boolean*/ isFocused){
			// summary: Need to over-ride with your own validation code in subclasses
			return this.validator(this.textbox.value, this.constraints);
		},

		_isEmpty: function(value){
			// summary: Checks for whitespace
			return /^\s*$/.test(value); // Boolean
		},

		getErrorMessage: function(/* Boolean*/ isFocused){
			// summary: return an error message to show if appropriate
			return this.invalidMessage;
		},

		getPromptMessage: function(/* Boolean*/ isFocused){
			// summary: return a hint to show if appropriate
			return this.promptMessage;
		},

		validate: function(/* Boolean*/ isFocused){
			// summary:
			//		Called by oninit, onblur, and onkeypress.
			// description:
			//		Show missing or invalid messages if appropriate, and highlight textbox field.
			var message = "";
			var isValid = this.isValid(isFocused);
			var isEmpty = this._isEmpty(this.textbox.value);
			this.state = (isValid || (!this._hasBeenBlurred && isEmpty)) ? "" : "Error";
			this._setStateClass();
			dijit.setWaiState(this.focusNode, "invalid", isValid ? "false" : "true");
			if(isFocused){
				if(isEmpty){
					message = this.getPromptMessage(true);
				}
				if(!message && this.state == "Error"){
					message = this.getErrorMessage(true);
				}
			}
			this.displayMessage(message);
		},

		// currently displayed message
		_message: "",

		displayMessage: function(/*String*/ message){
			// summary:
			//		User overridable method to display validation errors/hints.
			//		By default uses a tooltip.
			if(this._message == message){ return; }
			this._message = message;
			dijit.hideTooltip(this.domNode);
			if(message){
				dijit.showTooltip(message, this.domNode, this.tooltipPosition);
			}
		},

		_hasBeenBlurred: false,

		_onBlur: function(){
			this._hasBeenBlurred = true;
			this.validate(false);
			this.inherited(arguments);
		},

		_update: function(/*Event*/e){
			this.validate(true);
			this._onMouse(e);	// update CSS classes
		},

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		constructor: function(){
			this.constraints = {};
		},

		postMixInProperties: function(){
			this.inherited(arguments);
			this.constraints.locale = this.lang;
			this.messages = dojo.i18n.getLocalization("dijit.form", "validate", this.lang);
			if(this.invalidMessage == "$_unset_$"){ this.invalidMessage = this.messages.invalidMessage; }
			var p = this.regExpGen(this.constraints);
			this.regExp = p;
			// make value a string for all types so that form reset works well

			this.connect(this, "onfocus", this._update);
			this.connect(this, "onkeyup", this._update);
		}
	}
);

dojo.declare(
	"dijit.form.MappedTextBox",
	dijit.form.ValidationTextBox,
	{
		// summary:
		//		A subclass of ValidationTextBox.
		//		Provides a hidden input field and a serialize method to override

		serialize: function(val, /*Object?*/options){
			// summary: user replaceable function used to convert the getValue() result to a String
			return val.toString ? val.toString() : "";
		},

		toString: function(){
			// summary: display the widget as a printable string using the widget's value
			var val = this.filter(this.getValue());
			return val != null ? (typeof val == "string" ? val : this.serialize(val, this.constraints)) : "";
		},

		validate: function(){
			this.valueNode.value = this.toString();
			this.inherited(arguments);
		},

		setAttribute: function(/*String*/ attr, /*anything*/ value){
			this.inherited(arguments);
			switch(attr){
				case "disabled":
					if(this.valueNode){
						this.valueNode.disabled = this.disabled;
					}
			}
		},

		postCreate: function(){
			var textbox = this.textbox;
			var valueNode = (this.valueNode = dojo.doc.createElement("input"));
			valueNode.setAttribute("type", textbox.type);
			valueNode.setAttribute("value", this.toString());
			dojo.style(valueNode, "display", "none");
			valueNode.name = this.textbox.name;
			valueNode.disabled = this.textbox.disabled;
			this.textbox.name = this.textbox.name + "_displayed_";
			this.textbox.removeAttribute("name");
			dojo.place(valueNode, textbox, "after");

			this.inherited(arguments);
		}
	}
);

dojo.declare(
	"dijit.form.RangeBoundTextBox",
	dijit.form.MappedTextBox,
	{
		// summary:
		//		A subclass of MappedTextBox.
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
		//		The message to display if value is out-of-range
		rangeMessage: "",

		compare: function(val1, val2){
			// summary: compare 2 values
			return val1 - val2;
		},

		rangeCheck: function(/* Number */ primitive, /* Object */ constraints){
			// summary: user replaceable function used to validate the range of the numeric input value
			var isMin = (constraints.min !== undefined);
			var isMax = (constraints.max !== undefined);
			if(isMin || isMax){
				return (!isMin || this.compare(primitive,constraints.min) >= 0) &&
					(!isMax || this.compare(primitive,constraints.max) <= 0);
			}
			return true;
		},

		isInRange: function(/* Boolean*/ isFocused){
			// summary: Need to over-ride with your own validation code in subclasses
			return this.rangeCheck(this.getValue(), this.constraints);
		},

		isValid: function(/* Boolean*/ isFocused){
			return this.inherited(arguments) &&
				((this._isEmpty(this.textbox.value) && !this.required) || this.isInRange(isFocused));
		},

		getErrorMessage: function(/* Boolean*/ isFocused){
			if(dijit.form.RangeBoundTextBox.superclass.isValid.call(this, false) && !this.isInRange(isFocused)){ return this.rangeMessage; }
			return this.inherited(arguments);
		},

		postMixInProperties: function(){
			this.inherited(arguments);
			if(!this.rangeMessage){
				this.messages = dojo.i18n.getLocalization("dijit.form", "validate", this.lang);
				this.rangeMessage = this.messages.rangeMessage;
			}
		},

		postCreate: function(){
			this.inherited(arguments);
			if(this.constraints.min !== undefined){
				dijit.setWaiState(this.focusNode, "valuemin", this.constraints.min);
			}
			if(this.constraints.max !== undefined){
				dijit.setWaiState(this.focusNode, "valuemax", this.constraints.max);
			}
		},
		
		setValue: function(/*Number*/ value, /*Boolean, optional*/ priorityChange){
			dijit.setWaiState(this.focusNode, "valuenow", value);
			this.inherited('setValue', arguments);
		}
	}
);
