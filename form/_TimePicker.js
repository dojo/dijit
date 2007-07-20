dojo.provide("dijit.form._TimePicker");

dojo.require("dijit.form._FormWidget");
dojo.require("dojo.date.locale");

dojo.declare("dijit.form._TimePicker",
	[dijit._Widget, dijit._Templated],
	{
		/*
		How many times should it show? (10 hours for lotus)
		What are the visible increments? (1 hours for lotus)
		What are the clickable increments? (15 minutes for lotus)
		What is the size of the increments?
		Does clicking a time count as changing the value? (not for lotus; you click away to close the popup and that sets the value)
		How should setting the height affect the widget? (lotus has a fixed pixel height, which is obviously never the case for our widgets)
		*/

		templatePath: dojo.moduleUrl("dijit.form", "templates/TimePicker.html"),

		// clickableIncrement: String
		//		ISO-8601 string representing the amount by which 
		//		every clickable element in the time picker increases
		//		Set in non-Zulu time, without a time zone
		//		Example: "T00:15:00" creates 15 minute increments
		//		Must divide visibleIncrement evenly
		clickableIncrement: "T00:15:00",

		// visibleIncrement: String
		//		ISO-8601 string representing the amount by which 
		//		every element with a visible time in the time picker increases
		//		Set in non Zulu time, without a time zone
		//		Example: "T01:00:00" creates text in every 1 hour increment
		visibleIncrement: "T01:00:00",

		// clickableIncrementHeight: String
		// 		Size of clickableIncrements
		//		Set in em so it looks right
		clickableIncrementHeight: "0.5em",

		// visibleRange: String
		//		ISO-8601 string representing the range of this TimePicker
		//		The TimePicker will only display times in this range
		//		Example: "T05:00:00" displays 5 hours of options
		visibleRange: "T05:00:00",

		// value: String
		//		Date to display.
		//		Defaults to current time and date.
		//		Can be a Date object or an ISO-8601 string
		//		If you specify the GMT time zone ("-01:00"), 
		//		the time will be converted to the local time in the local time zone.
		//		Otherwise, the time is considered to be in the local time zone.
		//		If you specify the date and isDate is true, the date is used.
		//		Example: if your local time zone is GMT -05:00, 
		//		"T10:00:00" becomes "T10:00:00-05:00" (considered to be local time), 
		//		"T10:00:00-01:00" becomes "T06:00:00-05:00" (4 hour difference),
		//		"T10:00:00Z" becomes "T05:00:00-05:00" (5 hour difference between Zulu and local time)
		//		"yyyy-mm-ddThh:mm:ss" is the format to set the date and time
		//		Example: "2007-06-01T09:00:00"
		value: new Date(),

		_refdate: null,
		_visibleIncrement:2,
		_clickableIncrement:1,
		_totalIncrements:10,
		constraints:{},
		lang:this.lang,

		serialize: dojo.date.stamp.toISOString,

		setValue:function(/*Date*/ date, /*Boolean*/ priority){
			// summary:
			//	Set the value of the TimePicker
			//	Redraws the TimePicker around the new date
			//dijit.form._TimePicker.superclass.setValue.apply(this, arguments);
			this.value=date;
			this._showText();
		},

		isDisabledDate: function(/*Date*/dateObject, /*String?*/locale){
			// summary:
			//	May be overridden to disable certain dates in the TimePicker e.g. isDisabledDate=dojo.date.locale.isWeekend
			return false; // Boolean
		},

		_showText:function(){
			this.timeMenu.innerHTML="";
			var fromIso = dojo.date.stamp.fromISOString;
			this._clickableIncrementDate=fromIso(this.clickableIncrement);
			this._visibleIncrementDate=fromIso(this.visibleIncrement);
			this._visibleRangeDate=fromIso(this.visibleRange);
			// get the value of the increments and the range in seconds (since 00:00:00) to find out how many divs to create
			var clickableIncrementSeconds=this._toSeconds(this._clickableIncrementDate);
			var visibleIncrementSeconds=this._toSeconds(this._visibleIncrementDate);
			var visibleRangeSeconds=this._toSeconds(this._visibleRangeDate);

			// round reference date to previous visible increment
			this._refdate=this._roundTime(this.value, visibleIncrementSeconds);

			// assume clickable increment is the smallest unit
			this._clickableIncrement=1;
			// divide the visible range by the clickable increment to get the number of divs to create
			// example: 10:00:00/00:15:00 -> display 40 divs
			this._totalIncrements=visibleRangeSeconds/clickableIncrementSeconds;
			// divide the visible increments by the clickable increments to get how often to display the time inline
			// example: 01:00:00/00:15:00 -> display the time every 4 divs
			this._visibleIncrement=visibleIncrementSeconds/clickableIncrementSeconds;
			for(var i=-this._totalIncrements/2; i<=this._totalIncrements/2; i+=this._clickableIncrement){
				var div=this._createOption(i);
				this.timeMenu.appendChild(div);
			}
		},

		postCreate:function(){
			if(this.constraints===dijit.form._TimePicker.prototype.constraints){
				this.constraints={};
			}
			if(!this.constraints.locale){
				this.constraints.locale=this.lang;
			}
			dijit.typematic.addMouseListener(this.upArrow,this,this._onArrowUp, 0.8, 500);
			dijit.typematic.addMouseListener(this.downArrow,this,this._onArrowDown, 0.8, 500);
			dijit.form._TimePicker.superclass.postCreate.apply(this, arguments);
			this.setValue(this.value);
		},

		_roundTime:function(/*Date*/ date, incrementSeconds){
			// summary:
			//	Return a time that is nearest to the previous clickable increment, as defined by:
			// new time=old time - oldtime%clickableincrement

			// find the new time in seconds
			var oldtime=this._toSeconds(date);
			var newtime=oldtime-oldtime%incrementSeconds;
			// convert back to a date
			var newdate=new Date();
			newdate.setYear(date.getFullYear());
			newdate.setMonth(date.getMonth());
			newdate.setDate(date.getDate());
			newdate.setHours(0);
			newdate.setMinutes(0);
			newdate.setSeconds(newtime);
			console.debug("Time was: "+date+". Rounding UI to: "+newdate);
			return newdate;
		},

		_toSeconds:function(/*Date*/ date){
			// summmary:
			//	Convert a date time to the number of seconds since 00:00:00
			return date.getHours()*60*60+date.getMinutes()*60+date.getSeconds();
		},

		_createOption:function(/*Number*/ index){
			var div=document.createElement("div");
			div.style.textAlign="center";
			div.style.borderStyle="solid";
			div.style.borderWidth="1px";
			div.date=new Date(this._refdate);
			div.index=index;
			div.date.setSeconds(div.date.getSeconds()+this._clickableIncrementDate.getSeconds()*index);
			div.date.setMinutes(div.date.getMinutes()+this._clickableIncrementDate.getMinutes()*index);
			div.date.setHours(div.date.getHours()+this._clickableIncrementDate.getHours()*index);
			if(index%this._visibleIncrement<1&&index%this._visibleIncrement>-1){
				div.innerHTML=dojo.date.locale.format(div.date, this.constraints);
			}else if(index%this._clickableIncrement==0){
				div.style.height=this.clickableIncrementHeight;
			}
			if(this.isDisabledDate(div.date)){
				// set disabled
				div.style.backgroundColor="lightgrey";
			}
			return div;
		},

		_onOptionSelected:function(/*Object*/ tgt){
			if(!tgt.target.date||this.isDisabledDate(tgt.target.date)){return;}
			this.onValueSelected(tgt.target.date);
		},
		
		onValueSelected:function(value){
		},
		
		onmouseover:function(/*Event*/ evt){
			if(evt.target === this.timeMenu){ return; }
			this._highlighted_option=evt.target;
			dojo.addClass(evt.target, "dijitMenuItemHover");
		},

		onmouseout:function(/*Event*/ evt){
			if(evt.target === this.timeMenu){ return; }
			dojo.removeClass(this._highlighted_option, "dijitMenuItemHover");
		},

		_onArrowUp:function(){
			// remove the bottom time and add one to the top
			// TODO: Typematic
			var index=this.timeMenu.childNodes[0].index-1;
			var div=this._createOption(index);
			this.timeMenu.removeChild(this.timeMenu.childNodes[this.timeMenu.childNodes.length-1]);
			this.timeMenu.insertBefore(div, this.timeMenu.childNodes[0]);
		},

		_onArrowDown:function(){
			// remove the top time and add one to the bottom
			// TODO: Typematic
			var index=this.timeMenu.childNodes[this.timeMenu.childNodes.length-1].index+1;
			var div=this._createOption(index);
			this.timeMenu.removeChild(this.timeMenu.childNodes[0]);
			this.timeMenu.appendChild(div);
		}
	}
);
