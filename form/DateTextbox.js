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
			// open the calendar
			this._open();
			dijit.form.RangeBoundTextbox.prototype.onfocus.apply(this, arguments);
		},

		serialize: function(/*Date*/date){
			return dojo.date.stamp.toISOString(date, 'date'); // String
		},

		setValue: function(/*Date*/date, /*Boolean, optional*/ priorityChange){
			// summary:
			//	Sets the date on this textbox
			this.inherited('setValue', arguments);
			if(this._calendar){
				this._calendar.setValue(date);
			}
		},

		_open: function(){
			// summary:
			//	opens the Calendar, and sets the onValueSelected for the Calendar
			var self = this;

			if(!this._calendar){
				this._calendar = new dijit._Calendar({
					onValueSelected: function(value){

						self.focus(); // focus the textbox before the popup closes to avoid reopening the popup
						setTimeout(dijit.util.popup.close, 1); // allow focus time to take

						// this will cause InlineEditBox and other handlers to do stuff so make sure it's last
						dijit.form.DateTextbox.superclass.setValue.call(self, value, true);
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
					host: this,
					popup: this._calendar,
					around: this.domNode,
					onClose: function(){ self._opened=false; }
				});
				this._opened=true;
			}
		},

		_onBlur: function(){
			// summary: called magically when focus has shifted away from this widget and it's dropdown
			dijit.util.popup.closeAll();
			this.inherited('_onBlur', arguments);
			// don't focus on <input>.  the user has explicitly focused on something else.
		},

		postCreate: function(){
			this.inherited('postCreate', arguments);
			this.connect(this.domNode, "onclick", this._open);
		},

		getDisplayedValue:function(){
			return this.textbox.value;
		},

		setDisplayedValue:function(/*String*/ value){
			this.textbox.value=value;
		}
	}
);
