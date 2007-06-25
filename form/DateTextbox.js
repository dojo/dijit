dojo.provide("dijit.form.DateTextbox");

dojo.require("dijit._Calendar");
dojo.require("dijit.form._DropDownTextBox");
dojo.require("dojo.date");
dojo.require("dojo.date.locale");
dojo.require("dojo.date.stamp");
dojo.require("dijit.form.ValidationTextbox");

dojo.declare(
	"dijit.form.DateTextbox",
	[dijit.form.RangeBoundTextbox, dijit.form._DropDownTextBox],
	{
		// summary:
		//		A validating, serializable, range-bound date text box.
		// constraints object: min, max
		regExpGen: dojo.date.locale.regexp,
		compare: dojo.date.compare,
		format: dojo.date.locale.format,
		parse: dojo.date.locale.parse,
		value: new Date(),
		_popupClass: "dijit._Calendar",

		postMixInProperties: function(){
			// manual import of RangeBoundTextbox properties
			// both _DropDownTextBox and RangeBoundTextbox have a postMixInProperties!
			dijit.form.RangeBoundTextbox.prototype.postMixInProperties.apply(this, arguments);
			dijit.form._DropDownTextBox.prototype.postMixInProperties.apply(this, arguments);
			// #3407: only change constraints after postMixInProperties or ValidationTextbox will clear the change
			this.constraints.selector = 'date';
			// #2999
			if(typeof this.constraints.min == "string"){ this.constraints.min = dojo.date.stamp.fromISOString(this.constraints.min); }
 			if(typeof this.constraints.max == "string"){ this.constraints.max = dojo.date.stamp.fromISOString(this.constraints.max); }
		},

		onfocus: function(){
			dijit.form._DropDownTextBox.prototype.onfocus.apply(this, arguments);
			dijit.form.RangeBoundTextbox.prototype.onfocus.apply(this, arguments);
		},

		serialize: function(/*Date*/date){
			return dojo.date.stamp.toISOString(date, 'date'); // String
		},

		setValue: function(/*Date*/date){
			// summary:
			//	Sets the date on this textbox

			if(!this._popupWidget || !this._popupWidget.onValueSelected){
				dijit.form.DateTextbox.superclass.setValue.apply(this, arguments);
			}else{
				this._popupWidget.setValue(date);
			}
		},

		open: function(){
			// summary:
			//	opens the Calendar, and sets the onValueSelected for the Calendar
			this._popupWidget.constraints = this.constraints;
			this._popupWidget.setValue(this.getValue() || new Date());
			this._popupWidget.onValueSelected = dojo.hitch(this, this._calendarOnValueSelected);
			return dijit.form._DropDownTextBox.prototype.open.apply(this, arguments);
		},

		postCreate: function(){
			dijit.form.DateTextbox.superclass.postCreate.apply(this, arguments);
			this._popupArgs={
				lang: this.lang,
				isDisabledDate: function(/*Date*/ date){
					// summary:
					// 	disables dates outside of the min/max of the DateTextbox
					return this.constraints && (dojo.date.compare(this.constraints.min,date) > 0 || dojo.date.compare(this.constraints.max,date) < 0);
				}
			};
		},

		_calendarOnValueSelected: function(value){
			// summary: taps into the popup Calendar onValueSelected
			dijit.form.DateTextbox.superclass.setValue.apply(this, arguments);
			this._hideResultList();
		}
	}
);
