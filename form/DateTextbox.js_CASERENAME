dojo.provide("dijit.form.DateTextbox");

dojo.require("dijit._Calendar");
dojo.require("dijit.form.TimeTextbox");

dojo.declare(
	"dijit.form.DateTextbox",
	dijit.form.TimeTextbox,
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
