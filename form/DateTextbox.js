dojo.provide("dijit.form.DateTextbox");

dojo.require("dijit.form.Calendar");
dojo.require("dijit.form._DropDownTextBox");
dojo.require("dojo.date.calc");
dojo.require("dojo.date.local");
dojo.require("dojo.date.serial");
dojo.require("dijit.form.ValidationTextbox");

dojo.declare(
	"dijit.form.DateTextbox",
	[dijit.form.RangeBoundTextbox, dijit.form._DropDownTextBox],
	{
		// summary:
		//		A validating, serializable, range-bound date text box.
		// constraints object: min, max
		templatePath: dojo.moduleUrl("dijit.form", "templates/AutoCompleter.html"),
		regExpGen: dojo.date.local.regexp,
		compare: dojo.date.calc.compare,
		format: dojo.date.local.format,
		parse: dojo.date.local.parse,
		value: new Date(),
		postMixInProperties: function(){
			this.constraints.selector = 'date';
			// manual import of RangeBoundTextbox properties
			dijit.form.RangeBoundTextbox.prototype.postMixInProperties.apply(this, arguments);
			//dijit.form.DateTextbox.superclass.postMixInProperties.apply(this, arguments);
		},
		serialize: function(val){
			return dojo.date.serial.toRfc3339(val, 'date');
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
			this.optionsListNode=new dijit.form.Calendar({value:this.getValue(), onValueChanged:dojo.hitch(this, this._calendarOnValueChanged)},this.optionsListNode);
		},
		_calendarOnValueChanged:function(value){
			// summary: taps into the popup Calendar onValueChanged
			dijit.form.DateTextbox.superclass.setValue.apply(this, arguments);
			this._hideResultList();
		}
	}
);
