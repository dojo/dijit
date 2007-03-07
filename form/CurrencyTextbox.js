dojo.provide("dijit.form.CurrencyTextbox");

dojo.require("dijit.form.NumberTextbox");
dojo.require("dojo.i18n.common");
dojo.require("dojo.experimental");
dojo.experimental("dijit.form.CurrencyTextbox");
dojo.require("dojo.i18n.cldr.currencydata");

dojo.declare(
	"dijit.form.CurrencyTextbox",
	dijit.form.NumberTextbox,
	{
		// summary:
		//		A validating, serializable, range-bound text box for entering currency

		// code: String
		//		the ISO4217 currency code, a three letter sequence like "USD"
		//		See http://en.wikipedia.org/wiki/ISO_4217
		currency: "",

		// currencyData: Object?
		//		localized data for the specified currency including symbol and displayName
		currencyData: null,

		postMixInProperties: function(){
			if(!this.currencyData){
				dojo.requireLocalization("dojo.i18n.cldr", this.currency);
				try{
				this.currencyData = dojo.i18n.getLocalization("dojo.i18n.cldr", this.currency);
				}catch(e){
					// If not found, just provide ISO symbol.
					this.currencyData = {};
				}
				this.currencyData.iso4217 = this.currency;
			}
			dojo.lang.mixin(this.constraints, {type: "currency", currency: this.currencyData});
			dojo.lang.mixin(this.constraints, dojo.i18n.cldr.currencydata.getData(this.currency));
			dijit.form.CurrencyTextbox.superclass.postMixInProperties.apply(this, arguments);
		}
	}
);
