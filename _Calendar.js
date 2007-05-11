dojo.provide("dijit._Calendar");

dojo.require("dojo.cldr.supplemental");
dojo.require("dojo.date");
dojo.require("dojo.date.locale");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.base.FormElement");

dojo.declare(
	"dijit._Calendar",
	[dijit.base.Widget, dijit.base.TemplatedWidget],
	{
		/*
		summary: 
			A simple GUI for choosing a date in the context of a monthly calendar.

		description:
			This widget is used internally by other widgets and is not accessible
			as a standalone widget.
			This widget can't be used in a form because it doesn't serialize the date to an
			<input> field.  For a form element, use DateTextbox instead.

			Note that the parser takes all dates attributes passed in the `RFC 3339` format:
			http://www.faqs.org/rfcs/rfc3339.html (2005-06-30T08:05:00-07:00)
			so that they are serializable and locale-independent.
		
		usage: 
			var calendar = new dijit._Calendar({}, dojo.byId("calendarNode")); 
		 	-or-
			<div dojoType="dijit._Calendar"></div> 
		*/
		templatePath: dojo.moduleUrl("dijit", "templates/Calendar.html"),

		// value: Date
		// the currently selected Date
		value: new Date(),

		// dayWidth: String
		// How to represent the days of the week in the calendar header. See dojo.date.locale
		dayWidth: "narrow",

		setValue: function(/*Date*/ value){
			//summary: set the current date and update the UI
			if(!this.value || dojo.date.compare(value, this.value)){
				this.value = new Date(value);
				this.value.setHours(0,0,0,0);
				this.displayMonth = new Date(this.value);
				this._populateGrid();
				this.onValueChanged(this.value);
			}
		},

		_populateGrid: function(){
			var month = this.displayMonth;
			month.setDate(1);
			var firstDay = month.getDay();
			var daysInMonth = dojo.date.getDaysInMonth(month);
			var daysInPreviousMonth = dojo.date.getDaysInMonth(dojo.date.add(month, dojo.date.parts.MONTH, -1));
			var today = new Date();
			var selected = this.value;

			var dayOffset = dojo.cldr.supplemental.getFirstDayOfWeek(this.lang);
			if(dayOffset > firstDay){ dayOffset -= 7; }

			// Iterate through dates in the calendar and fill in date numbers and style info
			dojo.query(".calendarDateTemplate", this.domNode).forEach(function(template, i){
				i += dayOffset;
				var date = new Date(month);
				var number, clazz, adj = 0;

				if(i < firstDay){
					number = daysInPreviousMonth - firstDay + i + 1;
					adj = -1;
					clazz = "calendarPrevious";
				}else if(i >= (firstDay + daysInMonth)){
					number = i - firstDay - daysInMonth + 1;
					adj = 1;
					clazz = "calendarNext";
				}else{
					number = i - firstDay + 1;
					clazz = "calendarCurrent";
				}

				if(adj){
					date = dojo.date.add(date, dojo.date.parts.MONTH, adj);
				}
				date.setDate(number);

				if(!dojo.date.compare(date, today, dojo.date.types.DATE)){
					clazz = "calendarCurrentDate " + clazz;
				}

				if(!dojo.date.compare(date, selected, dojo.date.types.DATE)){
					clazz = "calendarSelectedDate " + clazz;
				}

				template.className =  clazz + "Month calendarDateTemplate";
				template.dijitDateValue = date.valueOf();
				var label = dojo.query(".calendarDateLabel", template)[0];
				label.innerHTML = date.getDate();
			});

			// Fill in localized month name
			var monthNames = dojo.date.locale.getNames('months', 'wide', 'standAlone', this.lang);
			this.monthLabelNode.innerHTML = monthNames[month.getMonth()];

			// Fill in localized prev/current/next years
			var y = month.getFullYear() - 1;
			dojo.forEach(["previous", "current", "next"], function(name){
				this[name+"YearLabelNode"].innerHTML =
					dojo.date.locale.format(new Date(y++, 0), {selector:'year', locale:this.lang});
			}, this);
		},

		postCreate: function(){
			dijit._Calendar.superclass.postCreate.apply(this);

			var dayLabelTemplate = dojo.query(".calendarDayLabelTemplate", this.domNode)[0];
			var calendarDateTemplate = dojo.query(".calendarDateTemplate", this.domNode)[0];
 			for(var i=1; i<7; i++){
				// clone the day label and calendar day templates to make 7 columns
				dayLabelTemplate.parentNode.appendChild(dayLabelTemplate.cloneNode(true));
				calendarDateTemplate.parentNode.appendChild(calendarDateTemplate.cloneNode(true));
  			}

			// now make 6 rows
			var calendarWeekTemplate = dojo.query(".calendarWeekTemplate", this.domNode)[0];
 			for(var j=1; j<6; j++){
				// clone the day label and calendar day templates to make 7 columns
				calendarWeekTemplate.parentNode.appendChild(calendarWeekTemplate.cloneNode(true));
			}

			// insert localized day names in the header
			var dayNames = dojo.date.locale.getNames('days', this.dayWidth, 'standAlone', this.lang);
			var dayOffset = dojo.cldr.supplemental.getFirstDayOfWeek(this.lang);
			dojo.query(".calendarDayLabel", this.domNode).forEach(function(label, i){
				label.innerHTML = dayNames[(i + dayOffset) % 7];
			});

			// Fill in spacer element with all the month names (invisible) so that the maximum width will affect layout
			var monthNames = dojo.date.locale.getNames('months', 'wide', 'standAlone', this.lang);
			dojo.forEach(monthNames, function(name){
				var monthSpacer = dojo.doc.createElement("div");
				monthSpacer.innerHTML = name;
				this.monthLabelSpacer.appendChild(monthSpacer);
			}, this);

			this.value = null;
			this.setValue(new Date());
		},

		_adjustDate: function(/*String*/part, /*int*/amount){
			this.displayMonth = dojo.date.add(this.displayMonth, part, amount);
			this._populateGrid();
		},

		_onIncrementMonth: function(/*Event*/evt){
			// summary: handler for increment month event
			evt.stopPropagation();
			this._adjustDate(dojo.date.parts.MONTH, 1);
		},
	
		_onDecrementMonth: function(/*Event*/evt){
			// summary: handler for increment month event
			evt.stopPropagation();
			this._adjustDate(dojo.date.parts.MONTH, -1);
		},

		_onIncrementYear: function(/*Event*/evt){
			// summary: handler for increment year event
			evt.stopPropagation();
			this._adjustDate(dojo.date.parts.YEAR, 1);
		},
	
		_onDecrementYear: function(/*Event*/evt){
			// summary: handler for increment year event
			evt.stopPropagation();
			this._adjustDate(dojo.date.parts.YEAR, -1);
		},

		_onDayClick: function(/*Event*/evt){
			var node = evt.target;
			dojo.stopEvent(evt);
			while(!node.dijitDateValue){
				node = node.parentNode;
			}
			this.setValue(node.dijitDateValue);
		},

		onValueChanged: function(/*Date*/date){
			//summary: the set date event handler
		}
	}
);
