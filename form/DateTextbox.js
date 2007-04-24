dojo.provide("dijit.form.DateTextbox");

dojo.require("dijit.form.ValidationTextbox");
dojo.require("dojo.date.calc");
dojo.require("dojo.date.local");
dojo.require("dojo.date.serial");

dojo.declare(
	"dijit.form.DateTextbox",
	dijit.form.RangeBoundTextbox,
	{
		// summary:
		//		A validating, serializable, range-bound date text box.
		// constraints object: min, max

		regExpGen: dojo.date.local.regexp,
		compare: dojo.date.calc.compare,
		format: dojo.date.local.format,
		parse: dojo.date.local.parse,
		value: new Date(),
		postMixInProperties: function(){
			this.constraints.selector = "dateOnly";
			dijit.form.DateTextbox.superclass.postMixInProperties.apply(this, arguments);
		},
		serialize: function(val){
			return dojo.date.serial.toRfc3339(val, 'dateOnly');
		}
	}
);
