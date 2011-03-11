define("dijit/form/RadioButton", ["dojo", "dijit", "dijit/form/CheckBox", "dijit/form/_RadioButtonMixin"], function(dojo, dijit) {

dojo.declare(
	"dijit.form.RadioButton",
	[dijit.form.CheckBox, dijit.form._RadioButtonMixin],
	{
		// summary:
		// 		Same as an HTML radio, but with fancy styling.

		baseClass: "dijitRadio"
	}
);

return dijit.form.RadioButton;
});
