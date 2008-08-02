dojo.provide("dijit.form.CheckBox");

dojo.require("dijit.form.Button");

dojo.declare(
	"dijit.form.CheckBox",
	dijit.form.ToggleButton,
	{
		// summary:
		// 		Same as an HTML checkbox, but with fancy styling.
		//
		// description:
		// User interacts with real html inputs.
		// On onclick (which occurs by mouse click, space-bar, or
		// using the arrow keys to switch the selected radio button),
		// we update the state of the checkbox/radio.
		//
		// There are two modes:
		//   1. High contrast mode
		//   2. Normal mode
		// In case 1, the regular html inputs are shown and used by the user.
		// In case 2, the regular html inputs are invisible but still used by
		// the user. They are turned quasi-invisible and overlay the background-image.

		templatePath: dojo.moduleUrl("dijit.form", "templates/CheckBox.html"),

		baseClass: "dijitCheckBox",

		//	Value of "type" attribute for <input>
		type: "checkbox",

		// value: Value
		//	equivalent to value field on normal checkbox (if checked, the value is passed as
		//	the value when form is submitted)
		value: "on",

		setValue: function(/*String or Boolean*/ newValue){
			// summary:
			//		When passed a boolean, controls whether or not the CheckBox is checked.
			//		If passed a string, changes the value attribute of the CheckBox (the one
			//		specified as "value" when the CheckBox was constructed (ex: <input
			//		dojoType="dijit.CheckBox" value="chicken">)
			if(typeof newValue == "string"){
				this.setAttribute('value', newValue);
				newValue = true;
			}
			this.setAttribute('checked', newValue);
		},

		_getValueDeprecated: false, // remove when _FormWidget:_getValueDeprecated is removed
		getValue: function(){
			// summary:
			//		If the CheckBox is checked, returns the value attribute.
			//		Otherwise returns false.
			return (this.checked ? this.value : false);
		},

		postMixInProperties: function(){
			if(this.value == ""){
				this.value = "on";
			}
			this.inherited(arguments);
		},

		reset: function(){
			this.inherited(arguments);
			this.setAttribute('value', this._resetValueAttr);
		},

		postCreate: function(){
			this.inherited(arguments);
			this._resetValueAttr = this.value;
		},
		
		_onFocus: function(){
			if(this.id){
				dojo.query("label[for='"+this.id+"']").addClass("dijitFocusedLabel");
			}
		},

		_onBlur: function(){
			if(this.id){
				dojo.query("label[for='"+this.id+"']").removeClass("dijitFocusedLabel");
			}
		}
	}
);

dojo.declare(
	"dijit.form.RadioButton",
	dijit.form.CheckBox,
	{
		// summary:
		// 		Same as an HTML radio, but with fancy styling.
		//
		// description:
		// Implementation details
		//
		// Specialization:
		// We keep track of dijit radio groups so that we can update the state
		// of all the siblings (the "context") in a group based on input
		// events. We don't rely on browser radio grouping.

		type: "radio",
		baseClass: "dijitRadio",

		setAttribute: function(/*String*/ attr, /*anything*/ value){
			// If I am being checked then have to deselect currently checked radio button
			this.inherited(arguments);
			switch(attr){
				case "checked":
					if(this.checked){
						var _this = this;
						dojo.query('[widgetId] INPUT:checked[type=radio][name='+this.name+']', this.focusNode.form||dojo.doc).forEach(
							function(inputNode){
								var widget = dijit.getEnclosingWidget(inputNode);
								if(widget != _this){
									widget.setAttribute('checked', false);
								}
							}
						);
					}
			}
		},

		_clicked: function(/*Event*/ e){
			if(!this.checked){
				this.setAttribute('checked', true);
			}
		}
	}
);
