dojo.provide("dijit.form.DateTextbox");

dojo.require("dijit._Calendar");
dojo.require("dijit.util.popup");
dojo.require("dojo.date");
dojo.require("dojo.date.locale");
dojo.require("dojo.date.stamp");
dojo.require("dijit.form.ValidationTextbox");

dojo.declare(
	"dijit.form.DateTextbox",
	dijit.form.RangeBoundTextbox,
	{
		// summary:
		//		A validating, serializable, range-bound date text box.

		// constraints object: min, max
		regExpGen: dojo.date.locale.regexp,
		compare: dojo.date.compare,
		format: dojo.date.locale.format,
		parse: dojo.date.locale.parse,
		value: new Date(),

		postMixInProperties: function(){
			dijit.form.RangeBoundTextbox.prototype.postMixInProperties.apply(this, arguments);

			// #3407: only change constraints after postMixInProperties or ValidationTextbox will clear the change
			this.constraints.selector = 'date';
	
			// #2999
			if(typeof this.constraints.min == "string"){ this.constraints.min = dojo.date.stamp.fromISOString(this.constraints.min); }
 			if(typeof this.constraints.max == "string"){ this.constraints.max = dojo.date.stamp.fromISOString(this.constraints.max); }
		},

		onfocus: function(/*Event*/ evt){
			// open the calendar, UNLESS we received focus because somebody clicked the calendar
			// (which should close the calendar rather than opening it)
			if(this._skipNextFocusOpen){
				this._skipNextFocusOpen = false;
			}else{
				this._open();
			}
			dijit.form.RangeBoundTextbox.prototype.onfocus.apply(this, arguments);
		},

		serialize: function(/*Date*/date){
			return dojo.date.stamp.toISOString(date, 'date'); // String
		},

		setValue: function(/*Date*/date){
			// summary:
			//	Sets the date on this textbox

			if(!this._calendar || !this._calendar.onValueSelected){
				dijit.form.DateTextbox.superclass.setValue.apply(this, arguments);
			}else{
				this._calendar.setValue(date);
			}
		},

		_open: function(){
			// summary:
			//	opens the Calendar, and sets the onValueSelected for the Calendar
			var self = this;
			if(!this._calendar){
				this._calendar = new dijit._Calendar({
					onValueSelected: function(){
						dijit.form.DateTextbox.superclass.setValue.apply(self, arguments);					
						dijit.util.popup.close();
						self._skipNextFocusOpen=true;	// refocus on <input> but don't reopen popup
						self.focus();
					},
					lang: this.lang,
					isDisabledDate: function(/*Date*/ date){
						// summary:
						// 	disables dates outside of the min/max of the DateTextbox
						return self.constraints && (dojo.date.compare(self.constraints.min,date) > 0 || dojo.date.compare(self.constraints.max,date) < 0);
					}
				});
				this._calendar.setValue(this.getValue() || new Date());
			}
			if(!this._opened){
				dijit.util.popup.open({
					popup: this._calendar,
					around: this.domNode,
					onClose: function(){ self._opened=false; }
				});
				this._opened=true;
			}
		},

		postCreate: function(){
			dijit.form.DateTextbox.superclass.postCreate.apply(this, arguments);
			this.connect(this.domNode, "onclick", "_open");
		}
	}
);
