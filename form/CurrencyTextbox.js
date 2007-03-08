dojo.provide("dijit.form.CurrencyTextbox");

dojo.require("dojo.i18n.common");
dojo.require("dojo.experimental");
dojo.experimental("dijit.form.CurrencyTextbox");
dojo.require("dojo.currency");

dojo.declare(
	"dijit.form.CurrencyTextbox",
	dijit.form.NumberTextbox,
	{
		// summary:
		//		A validating, serializable, range-bound text box for localized currencies.
		// constraints object: ...
		constraints: {},

		// code: String
		//		the ISO4217 currency code, a three letter sequence like "USD"
		//		See http://en.wikipedia.org/wiki/ISO_4217
		currency: "",

		regExpGen: dojo.currency.regexp,
		format: dojo.currency.format,
		parse: dojo.currency.parse,

		postMixInProperties: function(){
			this.constraints.currency = this.currency;
			dijit.form.CurrencyTextbox.superclass.postMixInProperties.apply(this, arguments);
		}
	}
);
