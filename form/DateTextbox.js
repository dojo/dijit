dojo.provide("dijit.form.DateTextbox");

dojo.require("dijit.form.ValidationTextbox");
dojo.require("dojo.date.common");
dojo.require("dojo.date.format");
dojo.require("dojo.date.serialize");

dojo.declare(
	"dijit.form.DateTextbox",
	dijit.form.RangeBoundTextbox,
	{
		// summary:
		//		A validating, serializable, range-bound date text box.
		// constraints object: min, max

		regExpGen: dojo.date.regexp,
		compare: dojo.date.compare,
		format: dojo.date.format,
		parse: dojo.date.parse,
		value: new Date(),
		postMixInProperties: function(){
			this.constraints.selector = "dateOnly";
			dijit.form.DateTextbox.superclass.postMixInProperties.apply(this, arguments);
		},
		serialize: function(val){
			return dojo.date.toRfc3339(val, 'dateOnly');
		}
	}
);
