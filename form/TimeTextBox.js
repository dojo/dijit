dojo.provide("dijit.form.TimeTextBox");

dojo.require("dijit._TimePicker");
dojo.require("dijit.form._DateTimeTextBox");

dojo.declare(
	"dijit.form.TimeTextBox",
	dijit.form._DateTimeTextBox,
	{
		// summary:
		//		A validating, serializable, range-bound time text box with a popup time picker

		popupClass: "dijit._TimePicker",
		_selector: "time"
	}
);
