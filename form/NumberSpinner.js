dojo.provide("dijit.form.NumberSpinner");

dojo.require("dijit.form._Spinner");
dojo.require("dijit.form.NumberTextbox");

dojo.declare(
"dijit.form.NumberSpinner",
[dijit.form._Spinner, dijit.form.NumberTextboxMixin],
{
	// summary: Number Spinner
	// description: This widget is the same as NumberTextbox but with up/down arrows added

	required: true,

	adjust: function(/* Object */ val, /*Number*/ delta){
		// summary: change Number val by the given amount
		var newval = val+delta;
		if (isNaN(val) || isNaN(newval)) { return val; }
		if ((typeof this.constraints.max == "number") && (newval > this.constraints.max)){ 
			newval = this.constraints.max;
		}
		if ((typeof this.constraints.min == "number") && (newval < this.constraints.min)){ 
			newval = this.constraints.min;
		}
		return newval;
	}
});
