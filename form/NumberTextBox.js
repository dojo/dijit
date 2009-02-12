dojo.provide("dijit.form.NumberTextBox");

dojo.require("dijit.form.ValidationTextBox");
dojo.require("dojo.number");

/*=====
dojo.declare(
	"dijit.form.NumberTextBox.__Constraints",
	[dijit.form.RangeBoundTextBox.__Constraints, dojo.number.__FormatOptions, dojo.number.__ParseOptions]
);
=====*/

dojo.declare("dijit.form.NumberTextBoxMixin",
	null,
	{
		// summary:
		//		A mixin for all number textboxes

		// TODOC: no inherited. ValidationTextBox describes this, but why is this here:
		regExpGen: dojo.number.regexp,

		/*=====
		// constraints: dijit.form.NumberTextBox.__Constraints 
		constraints: {},
		======*/

		// editOptions: Object
		//		properties to mix into constraints when the value is being edited
		editOptions: { pattern: '#.######' },

		_formatter: dojo.number.format,

		_onFocus: function(){
			if(this.disabled){ return; }
			var val = this.attr('value');
			if(typeof val == "number" && !isNaN(val)){
				this.textbox.value = this.format(val, this.constraints);
			}
			this.inherited(arguments);
		},

		format: function(/*Number*/ value, /*dojo.number.__FormatOptions*/ constraints){
			// summary:
			//		Formats the value as a Number, according to constraints

			if(typeof value == "string") { return value; }
			if(isNaN(value)){ return ""; }
			if(this.editOptions && this._focused){
				constraints = dojo.mixin(dojo.mixin({}, this.editOptions), this.constraints);
			}
			return this._formatter(value, constraints);
		},

		parse: dojo.number.parse,
		/*=====
		parse: function(value, constraints){
			//	summary:
			//		Parses the value as a Number, according to constraints.
			//	value: String
			//
			//	constraints: dojo.number.__ParseOptions
		},
		=====*/

		_getDisplayedValueAttr: function(){
			var v = this.inherited(arguments); 
			return isNaN(v) ? this.textbox.value : v;
		},

		filter: function(/*Number*/ value){
			return (value === null || value === '' || value === undefined) ? NaN : this.inherited(arguments); // attr('value', null||''||undefined) should fire onChange(NaN)
		},

		serialize: function(/*Number*/ value, /*Object?*/options){
			return (typeof value != "number" || isNaN(value))? '' : this.inherited(arguments);
		},

		_getValueAttr: function(){
			// summary:
			//		Hook so attr('value') works.
			var v = this.inherited(arguments);
			return (isNaN(v) && this.textbox.value !== '')? undefined : v;
		},

		value: NaN
	}
);

dojo.declare("dijit.form.NumberTextBox",
	[dijit.form.RangeBoundTextBox,dijit.form.NumberTextBoxMixin],
	{
		// summary:
		//		A validating, serializable, range-bound text box.
	}
);
