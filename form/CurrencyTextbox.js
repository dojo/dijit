dojo.provide("dijit.form.CurrencyTextbox");

//FIXME: dojo.experimental throws an unreadable exception?
//dojo.experimental("dijit.form.CurrencyTextbox");

dojo.require("dojo.currency");
dojo.declare(
	"dijit.form.CurrencyTextbox",
	dijit.form.NumberTextbox,
	{
		// code: String
		//		the ISO4217 currency code, a three letter sequence like "USD"
		//		See http://en.wikipedia.org/wiki/ISO_4217
		currency: "",

		regExpGen: dojo.currency.regexp,
		format: dojo.currency.format,
		parse: dojo.currency.parse,

		postMixInProperties: function(){
			if(this.constraints === dijit.form.ValidationTextbox.prototype.constraints){
				// declare a constraints property on 'this' so we don't overwrite the shared default object in 'prototype'
				this.constraints = {};
			}
			this.constraints.currency = this.currency;
			dijit.form.CurrencyTextbox.superclass.postMixInProperties.apply(this, arguments);
		}
	}
);
