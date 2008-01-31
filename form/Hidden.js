dojo.provide("dijit.form.Hidden");

dojo.require("dijit._Widget");

dojo.declare("dijit.form.Hidden",
	[dijit._Widget, dijit._Templated],
	{
	// summary:
	//		A widget corresponding to a native input type="hidden" element,
	//		which responds to dijit.form.Form, and degrades.
	//
	// example:
	//	|	<input type="hidden" dojoType="dijit.form.Hidden" name="foo" value="bar" />
	//

	// name: String
	//		Name used when submitting form; same as "name" attribute or plain HTML elements
	name: "",

	// value: String
	//		Corresponds to the native HTML <input> element's attribute.
	value: "",

	templateString: "<input type='hidden' name='${name}' dojoAttachEvent='onchange: onChange'>",
	attributeMap: {value:"domNode", id:"domNode"},

	getValue: function(){
		// summary: Normalized getter for this input
		return this.domNode.value || this.value; // String
	},
	
	setValue: function(/* String */val){
		// summary: Normalized control over this input
		this.onChange(val);
		this.domNode.value = this.value = val; 
	},
	
	onChange: function(val){
		// summary: stub -- connect or override to use	
	}
});