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

			// #3407: only change constraints after postMixInProperties or ValidationTextbox will clear the change
			this.constraints.selector = 'date';
		}
	}
);
