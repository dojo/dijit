dojo.provide("dijit.form.Checkbox");

dojo.require("dijit.form.Button");
dojo.require("dijit.util.sniff");
dojo.require("dijit.util.wai");

dojo.declare(
	"dijit.form.Checkbox",
	[dijit.form.ToggleButton],
	{
		// summary:
		// 		Same as an HTML checkbox, but with fancy styling.
		//
		// description:
		// Implementation details
		//
		// pattern: MVC
		//   Control: User interacts with real html inputs
		//     Event listeners are added for input node events
		//     These handlers make sure to update the view based on input state
		//   View: The view is basically the the dijit (tundra) sprint image.
		//   Model: The dijit checked state is synched with the input node.
		//
		// There are two modes:
		//   1. High contrast mode
		//   2. Normal mode
		// In case 1, the regular html inputs are shown and used by the user.
		// In case 2, the regular html inputs are invisible but still used by
		// the user. They are turned quasi-invisible and overlay the background-image

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
			this.inputNode.checked=this._selected=this.checked;
			dijit._disableSelection(this.inputNode);
			dijit.form.ToggleButton.prototype.postCreate.apply(this, arguments);
		},

		onChecked: function(/*Boolean*/ newCheckedState){
			// summary: callback when checked state is changed
		},
		
		setChecked: function(/*Boolean*/ check){
			// summary: set the checked state of the widget.
			if(check != this.inputNode.checked){
				this.inputNode.checked = this._selected = check;
				this._update();
			}
		},
	
		getChecked: function(){
			// summary: get the checked state of the widget.
			return this._selected;
		},

		setValue: function(value){
			if(value == null){ value = ""; }
			this.inputNode.value = value;
			dijit.form.Checkbox.superclass.setValue.call(this,value);
		},

		_onMouse: function(/*Event*/ e){
			// any mouse event could change the value of the checkbox,
			// so check for that, and then pass on to default handlers
			this._update();
			dijit.form.Checkbox.superclass._onMouse.apply(this,arguments);
		},

		_updateView: function(){
			if(this.checked != this.inputNode.checked){
				this._selected = this.checked = this.inputNode.checked;
				this._setStateClass();
				this.onChecked(this.checked);
			}
		},
		
		_update: function(){
			// summary: called on possible state change
			this._updateView();
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
		//
		// At the time of implementation not all browsers fire the same events
		// when a different radio button in a group is checked (and the previous
		// unchecked). When the events do fire, e.g. a focus event on the newly
		// checked radio, the checked state of that "newly checked" radio is 
		// set to true in some browsers and false in others.
		// It is vital that the view of the resulting input states be correct
		// so that at the time of form submission the intended data is sent.
		
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

		_update: function(){
			// summary: make sure the sibling radio views are correct
			dojo.forEach(this._groups[this.name], function(widget){ widget._updateView(); });
		}
	}
);
