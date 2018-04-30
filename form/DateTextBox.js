define([
	"dojo/_base/declare", // declare
	"../Calendar",
	"./_DateTimeTextBox"
], function(declare, Calendar, _DateTimeTextBox){

	// module:
	//		dijit/form/DateTextBox

	return declare("dijit.form.DateTextBox", _DateTimeTextBox, {
		// summary:
		//		A validating, serializable, range-bound date text box with a drop down calendar
		// example:
		// |	new DateTextBox({value: new Date(2009, 0, 20)})
		// example:
		// |	<input data-dojo-type='dijit/form/DateTextBox' value='2009-01-20'>

		baseClass: "dijitTextBox dijitComboBox dijitDateTextBox",
		popupClass: Calendar,
		_selector: "date",

		// Prevent scrollbar on Calendar dropdown.  On iPad it often gets a scrollbar unnecessarily because Viewport
		// thinks the keyboard is showing.  Even if the keyboard is showing, it disappears when the calendar gets focus.
		maxHeight: Infinity,

		// value: Date
		//		The value of this widget as a JavaScript Date object, with only year/month/day specified.
		//		If specified in markup, use the format specified in `stamp.fromISOString`.
		//		set("value", ...) accepts either a Date object or a string.
		value: new Date(""),	// value.toString()="NaN"

		// Determine if a date is in range, or could become in range while it is being typed. 
		// For example, 1/2/20 could be in the range 1/1/2015 to 12/31/2015 and shouldn't become invalid until the contorl loses focus
		_isDefinitelyOutOfRange: function () {
			var outOfRange = this.inherited(arguments);
			var inPossibleRange = true;

			if (outOfRange) {
				var dateParts = this._lastInputEventValue.split("/");
				var val = new Date(this._lastInputEventValue);
				if (dateParts.length >= 3) {
					val.setFullYear(dateParts[2]); // use the year entered, not the year converted to a 4 digit year
				}
				var year = val.getFullYear() || (dateParts.length >= 3 ? dateParts[2] : "");
				var month = val.getMonth() || (dateParts.length >= 2 ? dateParts[1] : 0);
				var date = val.getDate() || (dateParts.length >= 1 ? dateParts[0] : 1);

				//TODO: assumes a 4 digit year. adjusted to handle years before 1000?
				// year 0 defaults to 1900, so use 1000
				var minYear = (String(year ? year : 1) + "0000").slice(0, 4)
				// 2 digit years add a 20 to the beginning by default. check that for the min year (ie. 22 could be 2200 or 2022)
				if (dateParts.length >= 3 && String(dateParts[2]).length === 2) {
					minYear = Math.min(minYear, parseInt("20" + dateParts[2]));
				}
				var minPossibleDate = new Date(minYear, month, date);

				var maxYear = (String(year) + "9999").slice(0, 4);
				// 2 digit years add a 20 to the beginning by default. check that for the max year (ie. 22 could be 2200 or 2022)
				if (dateParts.length >= 3 && String(dateParts[2]).length === 2) {
					maxYear = Math.max(maxYear, parseInt("20" + dateParts[2]));
				}
				var maxMonth = (month === 0 ? 11 : month);
				var maxDate = date;
				if ((date === 3 && month !== 1) || (date === 2 && month === 1)) {
					// use the 0 day of the next month to get the last day of the month
					maxMonth += 1;
					maxDate = 0;
				} else if (date < 3) {
					maxDate = String(date) + 9;
				}
				var maxPossibleDate = new Date(maxYear, maxMonth, maxDate);

				// if the min or max are within the possible range then the value is not out of range
				var hasMin = ("min" in this.constraints);
				var hasMax = ("max" in this.constraints);
				if (hasMin || hasMax) {
					if ("min" in this.constraints) {
						inPossibleRange = (this.compare(maxPossibleDate, this.constraints.min) > 0);
					}
					if ("max" in this.constraints) {
						inPossibleRange = inPossibleRange && (this.compare(minPossibleDate, this.constraints.max) < 0);
					}
				}
			}

			return outOfRange && !inPossibleRange;
		}
	});
});
