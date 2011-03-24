define("dijit/form/ComboBoxMixin", ["dojo", "dijit", "text!dijit/form/templates/DropDownBox.html", "dijit/form/_AutoCompleterMixin", "dijit/form/_ComboBoxMenu"], function(dojo, dijit) {

dojo.declare("dijit.form.ComboBoxMixin", dijit.form._AutoCompleterMixin, {
		// dropDownClass: [protected extension] String
		//		Name of the dropdown widget class used to select a date/time.
		//		Subclasses should specify this.
		dropDownClass: "dijit.form._ComboBoxMenu",

		// hasDownArrow: Boolean
		//		Set this textbox to have a down arrow button, to display the drop down list.
		//		Defaults to true.
		hasDownArrow: true,

		templateString: dojo.cache("dijit.form", "templates/DropDownBox.html"),

		baseClass: "dijitTextBox dijitComboBox",

		// Set classes like dijitDownArrowButtonHover depending on
		// mouse action over button node
		cssStateNodes: {
			"_buttonNode": "dijitDownArrowButton"
		},

		_setHasDownArrowAttr: function(/*Boolean*/ val){
			this._set("hasDownArrow", val);
			this._buttonNode.style.display = val ? "" : "none";
		},

		_showResultList: function(){
			// hide the tooltip
			this.displayMessage("");
			this.inherited(arguments);
		}
});

return dijit.form.ComboBoxMixin;
});
