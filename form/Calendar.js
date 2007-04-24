dojo.provide("dijit.form.Calendar");

dojo.require("dojo.date.calc");
dojo.require("dojo.date.local");
dojo.require("dojo.date.serial");

dojo.require("dijit.base.FormElement");
dojo.require("dijit.base.TemplatedWidget");

dojo.declare(
	"dijit.form.Calendar",
	[dijit.base.FormElement, dijit.base.TemplatedWidget],
	{
		/*
		summary: 
			Base class for a stand-alone DatePicker widget 
			which makes it easy to select a date, or switch by month and/or year. 
		description: 
			A stand-alone DatePicker widget that makes it  
			easy to select a date, or increment by week, month, and/or year. 
			It is designed to be used on its own, or inside of other widgets to  
				(see dojo.widget.DropdownDatePicker) or other similar combination widgets. 
		 	              
			Dates attributes passed in the `RFC 3339` format:
			http://www.faqs.org/rfcs/rfc3339.html (2005-06-30T08:05:00-07:00)
			so that they are serializable and locale-independent.
		
		usage: 
			var datePicker = dojo.widget.createWidget("DatePicker", {},   
			dojo.byId("datePickerNode")); 
		 	 
			<div dojoType="DatePicker"></div> 
		*/
		templatePath: dojo.moduleUrl("dijit.form", "templates/Calendar.html"),

		getTextValue: function(){
		        return this.filter(this.inputNode.value);
		},

		getValue: function(){
			return this.parse(this.getTextValue(), this.constraints);
		},

		setTextValue: function(value){
			this.inputNode.value = this.filter(value);
		},

		setValue: function(dateObj){
			//summary: set the current date and update the UI
			var d = dateObj;
			var t = "";
			if(typeof(d)=="string" && d!=""){
				t = dojo.date.serial.fromRfc3339(d);			
			}else if(typeof(d)=="object"){
				t = new Date(d);
			}
			if(typeof(t)=="object"){
				this.value = new Date(t);
				this.value.setHours(0,0,0,0);
			}else{
				this.value = "";
			}
		
			if(this.selectedNode){
				this._removeClass(this.selectedNode,this.classNames.selectedDate);
			}
			if(this.clickedNode){
				this._addClass(this.clickedNode,this.classNames.selectedDate);
				this.selectedNode = this.clickedNode;
			}else{
				//only call this if setDate was called by means other than clicking a date
				this._preInitUI((this.value=="")?this.curMonth:this.value,false,true);
			}
			this.clickedNode=null;
			this.setTextValue(this.format(value, this.constraints)); //FIXME: value is undefined
			dijit.form.Calendar.superclass.setValue.call(this,value); //FIXME: value is undefined
		},

		format: function(/* String */ value, /* Object */ constraints){
			// summary: Replacable function to convert a value to a properly formatted string
			return value;
		},

		parse: function(/* String */ value, /* Object */ constraints){
			// summary: Replacable function to convert a formatted string to a value
			return value;
		},
		postCreate: function(){
			dijit.form.Calendar.superclass.postCreate.apply(this);
			// get the node for which the background color will be updated
			if (typeof this.nodeWithBorder != "object"){
				this.nodeWithBorder = this.inputNode;
			}
			this.weekTemplate = this.calendarWeekTemplate.parentNode.removeChild(this.calendarWeekTemplate); //PORT leak?
			this._preInitUI(this.value ? this.value : this.today, false, true); //init UI with date selected ONLY if user supplies one

			// Insert localized day names in the template
			var dayLabels = dojo.date.local.getNames('days', this.dayWidth, 'standAlone', this.lang);
			var dayLabelNodes = this.dayLabelsRow.getElementsByTagName("td");
 			for(i=0; i<7; i++){
				dayLabelNodes.item(i).innerHTML = dayLabels[(i + this.weekStartsOn) % 7];
			}

			if(this.value){
				this.setValue(this.value);
			}
		},

		filter: function(val){
			// summary: Return string format of date
			dojo.date.toRfc3339(new Date(val),'dateOnly');
			return val;
		},
	
		focus: function(){
			// summary: if the widget wants focus, then focus the textbox
			this.inputNode.focus();
		},

		// event handlers, you can over-ride these in your own subclasses
		onfocus: function(){ 
			this._addClass(this.nodeWithBorder,"dojoInputFieldFocused"); 
		},
		onblur: function(){ 
			this._removeClass(this.nodeWithBorder,"dojoInputFieldFocused"); 
			this.setValue(this.getValue()); 
		},
		
		// value: String|Date
		//	form value property if =='today' will be today's date
		value: "", 

		// name: String
		// 	name of the form element
		name: "",

		// weekStartsOn: Integer
		//	adjusts the first day of the week 0==Sunday..6==Saturday
		weekStartsOn: "",

		// dayWidth: String
		//	how to render the names of the days in the header. see dojo.date.getDayNames
		dayWidth: 'narrow',

		classNames:{
		// summary:
		//	stores a list of class names that may be overriden
		//	TODO: this is not good; can't be adjusted via markup, etc. since it's an array
			previous: "dojopreviousMonth",
			current: "dojocurrentMonth",
			next: "dojonextMonth",
			currentDate: "dojocurrentDate",
			selectedDate: "dojoselectedDate"
		},

		postMixInProperties: function(){
			// summary: see dojo.widget.DomWidget
			dijit.form.Calendar.superclass.postMixInProperties.apply(this, arguments);
			this.today = new Date();
			this.today.setHours(0,0,0,0);
			if(typeof(this.value)=='string'&&this.value.toLowerCase()=='today'){
				this.value = new Date();
			}else if(this.value && (typeof this.value=="string") && (this.value.split("-").length > 2)){
				this.value = dojo.date.fromRfc3339(this.value);
				this.value.setHours(0,0,0,0);
			}
		},
		
		getValue: function(){
			// summary: return current date in RFC 3339 format
			return dojo.date.toRfc3339(new Date(this.value),'dateOnly'); /*String*/
		},

		getDate: function(){
			// summary: return current date as a Date object
			return this.value; /*Date*/
		},

		setDate: function(/*Date|String*/rfcDate){
			//summary: set the current date from RFC 3339 formatted string or a date object, synonymous with setDate
			this.setValue(rfcDate);
		},			

		_preInitUI: function(dateObj,initFirst,initUI){
			/*
	 	              To get a sense of what month to highlight, we initialize on 
	 	              the first Saturday of each month, since that will be either the first  
	 	              of two or the second of three months being partially displayed, and  
	 	              then work forwards and backwards from that point.
			*/

			//initFirst is to tell _initFirstDay if you want first day of the displayed calendar, or first day of the week for dateObj
			//initUI tells preInitUI to go ahead and run initUI if set to true
			function checkDate(d , s){
				if(typeof(d)=="string"){
					var t = dojo.date.fromRfc3339(d);
					if(t==null && typeof(s)=="string"){
						var t = dojo.date.fromRfc3339(s);
					}
					return t;
				}
				return d;
			}		
			this.firstDay = this._initFirstDay(dateObj,initFirst);
			this.selectedIsUsed = false;
			this.currentIsUsed = false;
			var nextDate = new Date(this.firstDay);
			var tmpMonth = nextDate.getMonth();
			this.curMonth = new Date(nextDate);
			this.curMonth.setDate(nextDate.getDate()+6); //first saturday gives us the current Month
			this.curMonth.setDate(1);
			var days = 42; //init total days to display
			this.curMonth = new Date(nextDate);
			this.curMonth.setDate(nextDate.getDate()+6);
			this.curMonth.setDate(1);
			var curClass = (nextDate.getMonth() == this.curMonth.getMonth())?'current':'previous';
			if(initUI){
				this._initUI(days);
			}
		},
		_initUI: function(days){
			// remove children
			var datesContainer = this.calendarDatesContainerNode;
			while(datesContainer.hasChildNodes()){
				datesContainer.removeChild(datesContainer.firstChild);
			}
			for(var i=0;i<6;i++){
				datesContainer.appendChild(this.weekTemplate.cloneNode(true));
			}

			var nextDate = new Date(this.firstDay);
			this._setMonthLabel(this.curMonth.getMonth());
			this._setYearLabels(this.curMonth.getFullYear());
			var calendarNodes = datesContainer.getElementsByTagName("td");
			var calendarRows = datesContainer.getElementsByTagName("tr");
			var currentCalendarNode;
			for(i=0;i<days;i++){
				//this is our new UI loop... one loop to rule them all, and in the datepicker bind them
				currentCalendarNode = calendarNodes.item(i);
				currentCalendarNode.innerHTML = nextDate.getDate();
				currentCalendarNode.setAttribute("_dojoDateValue",nextDate.valueOf());
				var curClass = (nextDate.getMonth() != this.curMonth.getMonth() && Number(nextDate) < Number(this.curMonth))?'previous':(nextDate.getMonth()==this.curMonth.getMonth())?'current':'next';
				var mappedClass = curClass;
				currentCalendarNode.className = this._getDateClassName(nextDate, mappedClass);
				if(" "+currentCalendarNode+" ".indexOf(this.classNames.selectedDate) != -1){
					this.selectedNode = currentCalendarNode;
				}
				nextDate = dojo.date.calc.add(nextDate, dojo.date.calc.parts.DAY, 1);
			}
			this.lastDay = dojo.date.calc.add(nextDate, dojo.date.calc.parts.DAY, -1);
			this._initControls();
		},
		_initControls: function(){
			//left incase we want to disable/enable Controls
		},
		
		_incrementMonth: function(evt){
			var d = new Date(this.curMonth);
			switch(evt.currentTarget){
				case this.increaseMonthNode.getElementsByTagName("img").item(0):
				case this.increaseMonthNode:
					d = dojo.date.calc.add(d, dojo.date.calc.parts.MONTH, 1);
					break;
				case this.decreaseMonthNode.getElementsByTagName("img").item(0):
				case this.decreaseMonthNode:
					d = dojo.date.calc.add(d, dojo.date.calc.parts.MONTH, -1);
					break;
			}
			this._preInitUI(d,false,true);
		},
	
		_incrementYear: function(evt){
			var d = new Date(this.curMonth);
			switch(evt.target){
				case this.nextYearLabelNode:
					d = dojo.date.calc.add(d, dojo.date.calc.parts.YEAR, 1);
					break;
				case this.previousYearLabelNode:
					d = dojo.date.calc.add(d, dojo.date.calc.parts.YEAR, -1);
					break;
			}
			this._preInitUI(d,false,true);
		},
	
		onIncrementMonth: function(/*Event*/evt){
			// summary: handler for increment month event
			evt.stopPropagation();
			this._incrementMonth(evt);
		},
		
		onIncrementYear: function(/*Event*/evt){
			// summary: handler for increment year event
			evt.stopPropagation();
			this._incrementYear(evt);
		},
	
		_setMonthLabel: function(monthIndex){
			this.monthLabelNode.innerHTML = dojo.date.local.getNames('months', 'wide', 'standAlone', this.lang)[monthIndex];
		},
		
		_setYearLabels: function(year){
			var y = year - 1;
			var that = this;
			function f(n){
				that[n+"YearLabelNode"].innerHTML =
					dojo.date.local.format(new Date(y++, 0), {selector:'yearOnly', locale:that.lang});
			}
			f("previous");
			f("current");
			f("next");
		},
		
		_getDateClassName: function(date, monthState){
			var currentClassName = this.classNames[monthState];
			//we use Number comparisons because 2 dateObjects never seem to equal each other otherwise
			if ((!this.selectedIsUsed && this.value) && (Number(date) == Number(this.value))){
				currentClassName = this.classNames.selectedDate + " " + currentClassName;
				this.selectedIsUsed = true;
			}
			if((!this.currentIsUsed) && (Number(date) == Number(this.today))){
				currentClassName = currentClassName + " "  + this.classNames.currentDate;
				this.currentIsUsed = true;
			}
			return currentClassName;
		},
	
		onClick: function(/*Event*/evt){
			//summary: the click event handler
			dojo.stopEvent(evt);
		},

		_handleUiClick: function(/*Event*/evt){
			var eventTarget = evt.target;
			if(eventTarget.nodeType != 1){eventTarget = eventTarget.parentNode;}
			dojo.stopEvent(evt);
			this.selectedIsUsed = this.todayIsUsed = false;
			this.clickedNode = eventTarget;
			this.setDate(new Date(eventTarget.getAttribute('_dojoDateValue'))); //PORT: dojo.html.getAttribute apparently needed for Opera?
		},
		
		onValueChanged: function(/*Date*/date){
			//summary: the set date event handler
		},
		
		_initFirstDay: function(/*Date*/dateObj, /*Boolean*/adj){
			//adj: false for first day of month, true for first day of week adjusted by startOfWeek
			var d = new Date(dateObj);
			if(!adj){d.setDate(1);}
			d.setDate(d.getDate()-this._getAdjustedDay(d,this.weekStartsOn));
			d.setHours(0,0,0,0);
			return d; // Date
		},

		_getAdjustedDay: function(/*Date*/dateObj){
		//FIXME: use mod instead?
			//summary: used to adjust date.getDay() values to the new values based on the current first day of the week value
			var days = [0,1,2,3,4,5,6];
			if(this.weekStartsOn>0){
				for(var i=0;i<this.weekStartsOn;i++){
					days.unshift(days.pop());
				}
			}
			return days[dateObj.getDay()]; // Number: 0..6 where 0=Sunday
		},

		destroy: function(){
			dijit.Form.Calendar.superclass.destroy.apply(this, arguments);
			this.weekTemplate.parentNode.removeChild(this.weekTemplate); // PORT leak? used to destroyNode
		}
	}
);