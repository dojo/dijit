dojo.provide("dijit.form.CurrencyTextBox");

dojo.require("dojo.currency");
dojo.require("dijit.form.NumberTextBox");

/*=====
dojo.declare(
	"dijit.form.CurrencyTextBox.__Constraints",
	[dijit.form.NumberTextBox.__Constraints, dojo.currency.__FormatOptions, dojo.currency.__ParseOptions]
);
=====*/

dojo.declare(
	"dijit.form.CurrencyTextBox",
	dijit.form.NumberTextBox,
	{
		// summary:
		//		A validating currency textbox
		//
		// currency: String
		//		the [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code, a three letter sequence like "USD"
		currency: "",
		//
		// constraints: dijit.form.CurrencyTextBox.__Constraints
		//		Minimum/maximum amount allowed.
		/*=====
		constraints: {},
		======*/

		// Override regExpGen ValidationTextBox.regExpGen().... we use a reg-ex generating function rather
		// than a straight regexp to deal with locale  (plus formatting options too?)
		regExpGen: function(constraints){
			// if focused, accept either currency data or NumberTextBox format
			return '(' + (this._focused? this.inherited(arguments, [ dojo.mixin({}, constraints, this.editOptions) ]) + '|' : '')
				+ dojo.currency.regexp(constraints) + ')';
		},

		// Override NumberTextBox._formatter to deal with currencies, ex: converts "123.45" to "$123.45"
		_formatter: dojo.currency.format,

		parse: function(/* String */ value, /* Object */ constraints){
			// summary:
			// 		Parses string value as a Currency, according to the constraints object
			// tags:
			// 		protected extension
			var v = dojo.currency.parse(value, constraints);
			if(isNaN(v) && /\d+/.test(value)){ // currency parse failed, but it could be because they are using NumberTextBox format so try its parse
				return this.inherited(arguments, [ value, dojo.mixin({}, constraints, this.editOptions) ]);
			}
			return v;
		},


		postMixInProperties: function(){
			this.constraints = dojo.currency._mixInDefaults(dojo.mixin(this.constraints, { currency: this.currency, exponent: false })); // get places
			this.inherited(arguments);
		}
	}
);
