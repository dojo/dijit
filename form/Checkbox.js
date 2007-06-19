dojo.provide("dijit.form.Checkbox");

dojo.require("dijit.form.Button");
dojo.require("dijit.util.sniff");
dojo.require("dijit.util.wai");

dojo.declare(
	"dijit.form.Checkbox",
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

		templatePath: dojo.moduleUrl("dijit.form", "templates/Checkbox.html"),

		baseClass: "dijitCheckbox",

		//	Value of "type" attribute for <input>
		_type: "checkbox",

		// checked: Boolean
		// Corresponds to the native HTML <input> element's attribute.
		// If true, checkbox is initially marked turned on;
		// in markup, specified as "checked='checked'" or just "checked"
		checked: false,

		// value: Value
		//	equivalent to value field on normal checkbox (if checked, the value is passed as
		//	the value when form is submitted)
		value: "on",

		postCreate: function(){
			dijit._disableSelection(this.inputNode);
			this.setSelected(this.checked);
			dijit.form.ToggleButton.prototype.postCreate.apply(this, arguments);
		},

		setSelected: function(/*Boolean*/ selected){
			this.inputNode.checked = this.checked = selected;
			dijit.form.ToggleButton.prototype.setSelected.apply(this, arguments);
		},

		setValue: function(/*String*/ value){
			if(value == null){ value = ""; }
			this.inputNode.value = value;
			dijit.form.Checkbox.superclass.setValue.call(this,value);
		}
	}
);

dojo.declare(
	"dijit.form.RadioButton",
	dijit.form.Checkbox,
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

		_type: "radio",
		baseClass: "dijitRadio",

		// This shared object keeps track of all widgets, grouped by name
		_groups: {},

		postCreate: function(){
			// add this widget to _groups
			(this._groups[this.name] = this._groups[this.name] || []).push(this);

			dijit.form.Checkbox.prototype.postCreate.apply(this, arguments);
		},

		uninitialize: function(){
			// remove this widget from _groups
			dojo.forEach(this._groups[this.name], function(widget, i, arr){
				if(widget === this){
					arr.splice(i, 1);
					return;
				}
			}, this);
		},

		setSelected: function(/*Boolean*/ selected){
			// If I am being selected then have to deselect currently selected radio button
			if(selected){
				dojo.forEach(this._groups[this.name], function(widget){
					if(widget != this && widget.selected){
						widget.setSelected(false);
					}
				}, this);
			}
			dijit.form.Checkbox.prototype.setSelected.apply(this, arguments);			
		},

		onClick: function(/*Event*/ e){
			if(!this.selected){
				this.setSelected(true);
			}
		}
	}
);
