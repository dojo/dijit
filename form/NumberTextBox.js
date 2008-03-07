dojo.provide("dijit.form.NumberTextBox");

dojo.require("dijit.form.ValidationTextBox");
dojo.require("dojo.number");

/*=====
dojo.declare(
	"dijit.form.NumberTextBox.__Constraints",
	[dijit.form.RangeBoundTextBox.__Constraints, dojo.number.__FormatOptions, dojo.number.__ParseOptions]
);
=====*/

dojo.declare(
	"dijit.form.NumberTextBoxMixin",
	null,
	{
		// summary:
		//		A mixin for all number textboxes
		// constraints: dijit.form.NumberTextBox.__Constraints 

		/*=====
		constraints: {},
		======*/

		regExpGen: dojo.number.regexp,

		// editOptions: Object
		//		properties to mix into constraints when the value is being edited
		editOptions: { pattern: '#.######' },

		_refreshState: function(){
			this.setValue(this.getValue(), false);	
		},

		_formatter: dojo.number.format,

		format: function(/*Number*/ value, /*dojo.number.__FormatOptions*/ constraints){
			if(typeof value == "string") { return value; }
			if(isNaN(value)){ return ""; }
			if(this.editOptions && this._focused){
				constraints = dojo.mixin(dojo.mixin({}, this.editOptions), this.constraints);
			}
			return this._formatter(value, constraints);
		},

/*=====
		parse: function(value, constraints){
			//	value: String
			//
			//	constraints: dojo.number.__ParseOptions
		},
=====*/
		parse: dojo.number.parse,

		filter: function(/*Number*/ value){
			if(typeof value == "string"){ return this.inherited('filter', arguments); }
			return isNaN(value) ? '' : value;
		},

		value: NaN
	}
);

dojo.declare(
	"dijit.form.NumberTextBox",
	[dijit.form.RangeBoundTextBox,dijit.form.NumberTextBoxMixin],
	{
		// summary:
		//		A validating, serializable, range-bound text box.
		// constraints object: min, max, places
	}
);
