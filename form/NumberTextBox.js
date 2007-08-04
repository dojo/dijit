dojo.provide("dijit.form.NumberTextBox");

dojo.require("dijit.form.ValidationTextBox");
dojo.require("dojo.number");

dojo.declare(
	"dijit.form.NumberTextBoxMixin",
	null,
	{
		// summary:
		//		A mixin for all number textboxes
		regExpGen: dojo.number.regexp,
		format: dojo.number.format,
		parse: dojo.number.parse,
		value: 0
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
