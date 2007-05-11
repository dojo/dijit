dojo.provide("dijit.form.DateTextbox");

dojo.require("dojo.date");
dojo.require("dojo.date.locale");
dojo.require("dojo.date.stamp");

dojo.require("dijit._Calendar");
dojo.require("dijit.form._DropDownTextBox");
dojo.require("dijit.form.ValidationTextbox");

dojo.declare(
	"dijit.form.DateTextbox",
	[dijit.form.RangeBoundTextbox, dijit.form._DropDownTextBox],
	{
		// summary:
		//		A validating, serializable, range-bound date text box.
		// constraints object: min, max
		templatePath: dojo.moduleUrl("dijit.form", "templates/AutoCompleter.html"),
		regExpGen: dojo.date.locale.regexp,
		compare: dojo.date.compare,
		format: dojo.date.locale.format,
		parse: dojo.date.locale.parse,
		value: new Date(),
		postMixInProperties: function(){
			this.constraints.selector = 'date';
			// manual import of RangeBoundTextbox properties
			dijit.form.RangeBoundTextbox.prototype.postMixInProperties.apply(this, arguments);
			//dijit.form.DateTextbox.superclass.postMixInProperties.apply(this, arguments);
			if (typeof this.constraints.min == "string"){ this.constraints.min = dojo.date.stamp.fromRfc3339(this.constraints.min); }
			if (typeof this.constraints.max == "string"){ this.constraints.max = dojo.date.stamp.fromRfc3339(this.constraints.max); }
		},
		serialize: function(val){
			return dojo.date.stamp.toRfc3339(val, 'date');
		},
		setValue:function(value){
			// summary:
			//	Sets the value on the calendar drop down to value
			//	This change is then propagated through the calendar's onValueChanged to DateTextbox
			this.optionsListNode.setValue(value);
		},
		postCreate:function() {
			
			// apply both postCreates
			dijit.form.RangeBoundTextbox.prototype.postCreate.apply(this, arguments);
			dijit.form._DropDownTextBox.prototype.postCreate.apply(this, arguments);
			//dijit.form.DateTextbox.superclass.postCreate.apply(this, arguments);
			this.optionsListNode=new dijit._Calendar({value:this.getValue(), onValueChanged:dojo.hitch(this, this._calendarOnValueChanged)},this.optionsListNode);
		},
		_calendarOnValueChanged:function(value){
			// summary: taps into the popup Calendar onValueChanged
			dijit.form.DateTextbox.superclass.setValue.apply(this, arguments);
			this._hideResultList();
		}
	}
);
