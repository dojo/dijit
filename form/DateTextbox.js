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
		templatePath: dojo.moduleUrl("dijit.form", "templates/AutoCompleter.html"),
		regExpGen: dojo.date.locale.regexp,
		compare: dojo.date.compare,
		format: dojo.date.locale.format,
		parse: dojo.date.locale.parse,
		value: new Date(),

		postMixInProperties: function(){
			this.constraints.selector = 'date';
			// manual import of RangeBoundTextbox properties
			dijit.form.DateTextbox.superclass.postMixInProperties.apply(this, arguments);
			// #2999
			if(typeof this.constraints.min == "string"){ this.constraints.min = dojo.date.stamp.fromRfc3339(this.constraints.min); }
 			if(typeof this.constraints.max == "string"){ this.constraints.max = dojo.date.stamp.fromRfc3339(this.constraints.max); }
		},

		serialize: function(/*Date*/date){
			return dojo.date.stamp.toRfc3339(date, 'date'); // String
		},

		setValue:function(/*Date*/date){
			// summary:
			//	Sets the date on this textbox

			if(this.popupWidget.parentWidget!=this){
				dijit.form.DateTextbox.superclass.setValue.apply(this, arguments);
			}else{
				this.popupWidget.setValue(value);
			}
		},

		postCreate:function(){
			dijit.form.DateTextbox.superclass.postCreate.apply(this, arguments);
			var node=document.createElement('div');
			this.popupWidget=dijit.form.DateTextbox.MasterPopup;

			// convert the arrow image from using style.background-image to the .src property (a11y)
			dijit.util.wai.imageBgToSrc(this.arrowImage);

			this.setupLabels();
		},

		_calendarOnValueSelected:function(value){
			// summary: taps into the popup Calendar onValueSelected
			dijit.form.DateTextbox.superclass.setValue.apply(this, arguments);
			this._hideResultList();
		}
	}
);

dojo.declare(
	"dijit._CalendarPopup",
	[dijit._Calendar, dijit.form._DropDownTextBox.Popup],
	{
		postCreate:function(){
			// summary:
			//	call all postCreates and set background color
			
			dijit._Calendar.prototype.postCreate.apply(this, arguments);
			dijit.form._DropDownTextBox.Popup.prototype.postCreate.apply(this, arguments);
			// FIXME: Calendar does not have a background color
			dojo.addClass(this.domNode, 'dijitMenu');
		},

		open:function(/*Widget*/ widget){
			// summary:
			//	opens the menu, and sets the onValueSelected for the Calendar
	
			dijit.form._DropDownTextBox.Popup.prototype.open.apply(this, arguments);
			this.constraints=widget.constraints;
			this.setValue(widget.getValue());
			this.onValueSelected=dojo.hitch(widget, widget._calendarOnValueSelected);
		},

		close:function(){
			dijit.form._DropDownTextBox.Popup.prototype.close.apply(this, arguments);
			this.constraints=null;
		},

		isDisabledDate:function(/*Date*/ date){
			// summary:
			// 	disables dates outside of the min/max of the DateTextbox
			if(this.constraints){
				return((dojo.date.compare(this.constraints.min,date)>0||dojo.date.compare(this.constraints.max,date)<0));
			}else{
				return false;
			}
		}
	}
);

// dojo.addOnLoad() throws things on the end of the onload stack. We want to be on the front.
dojo._loaders.unshift(function(){
	if(!dijit.form.DateTextbox.MasterPopup){
		// append some popup code to Calendar
		dijit.form.DateTextbox.MasterPopup = new dijit._CalendarPopup({lang:this.lang},document.createElement('div'));
	}
});
