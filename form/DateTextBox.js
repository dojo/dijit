dojo.provide("dijit.form.DateTextBox");

dojo.require("dijit._Calendar");
dojo.require("dijit.form.TimeTextBox");

dojo.declare(
	"dijit.form.DateTextBox",
	dijit.form.TimeTextBox,
	{
		// summary:
		//		A validating, serializable, range-bound date text box.
		
		_popupClass: "dijit._Calendar",
		
		postMixInProperties: function(){
			this.inherited('postMixInProperties', arguments);
			this.constraints.selector = 'date';
		}
	}
);
