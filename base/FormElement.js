dojo.provide("dijit.base.FormElement");

dojo.require("dijit.base.Widget");
dojo.require("dijit.util.sniff");
dojo.require("dijit.util.wai");

dojo.declare("dijit.base.FormElement", dijit.base.Widget,
{
	/*
	Summary:
		FormElement widgets correspond to native HTML elements such as <input> or <button> or <select>.
		Each FormElement represents a single input value, and has a (possibly hidden) <input> element,
		to which it serializes its input value, so that form submission (either normal submission or via FormBind?)
		works as expected.
		
		All these widgets should have these attributes just like native HTML input elements.
		You can set them during widget construction, but after that they are read only.
		
		They also share some common methods.
		
	TODO:
		should this be a mixin or a base class?
	*/

	// baseClass: String
	//		Used to add CSS classes like FormElementDisabled
	baseClass: "",

	// value: String
	//		Corresponds to the native HTML <input> element's attribute.
	value: "", 

	// name: String
	//		Name used when submitting form; same as "name" attribute or plain HTML elements
	name: "",

	// id: String
	//		Corresponds to the native HTML <input> element's attribute.
	//		Also becomes the id for the widget.
	id: "",

	// alt: String
	//		Corresponds to the native HTML <input> element's attribute.
	alt: "",

	// type: String
	//		Corresponds to the native HTML <input> element's attribute.
	type: "text",

	// tabIndex: Integer
	//		Order fields are traversed when user hits the tab key
	tabIndex: "0",

	// disabled: Boolean
	//		Should this widget respond to user input?
	//		In markup, this is specified as "disabled='disabled'", or just "disabled".
	disabled: false,

	// _selected: Boolean
	//		Widgets like ToggleButton, RadioButton, etc., have a selected/not selected
	//		state important for CSS reasons.
	// TODO: should this be on the node instead?  something like ComboButton,
	// the drop down arrow toggles, but the button doesn't
	_selected: false,

	enable: function(){
		// summary:
		//		enables the widget, usually involving unmasking inputs and
		//		turning on event handlers. Not implemented here.
		this._setDisabled(false);
	},

	disable: function(){
		// summary:
		//		disables the widget, usually involves masking inputs and
		//		unsetting event handlers. Not implemented here.
		this._setDisabled(true);
	},
	
	_setDisabled: function(/*Boolean*/ disabled){
		// summary:
		//		Set disabled state of widget.
		// TODO:
		//		not sure which parts of disabling a widget should be here;
		//		not sure which code is common to many widgets and which is specific to a particular widget.
		this.domNode.disabled = this.disabled = disabled;
		if(this.focusNode){
			this.focusNode.disabled = disabled;
		}
		dijit.util.wai.setAttr(this.focusNode || this.domNode, "waiState", "disabled", disabled);
		this._onMouse(null, this.domNode);
	},
	

	_onMouse : function(/*Event*/ event, /*Node*/ mouseNode, /*String*/ baseClass){
		// summary:
		//	Update the visual state of the widget by changing the css class according to the mouse state.
		//	State will be one of:
		//		<baseClass> + "Enabled"|"Disabled"|"Active"|"Hover"
		//	Also forwards to onClick() if the mouse was clicked.

		if(mouseNode == null){ mouseNode = this.domNode; }
		if(event){ dojo.stopEvent(event); }
		var base = mouseNode.getAttribute("baseClass") || this.baseClass || (this.baseClass = "dijit"+this.declaredClass.replace(/.*\./g,""));
		
		if(this.disabled){
			dojo.removeClass(this.domNode, base+"Enabled");
			dojo.removeClass(this.domNode, base+"Hover");
			dojo.removeClass(this.domNode, base+"Active");
			dojo.addClass(this.domNode, base+"Disabled");
		}else{
			if(event){
				switch(event.type){
					case "mouseover" :
						mouseNode._hovering = true;
						break;
						
					case "mouseout" :	
						mouseNode._hovering = false;	
						break;
						
					case "mousedown" :
						mouseNode._active = true;
						// set a global event to handle mouseup, so it fires properly
						//	even if the cursor leaves the button
						var self = this;
						var method = function(event){
							self._onMouse(event, mouseNode);
						}
						// #2685: assign connector with this.connect so destroy() cleans it up
						mouseNode._mouseUpConnector = this.connect(dojo.global, "onmouseup", method);
						break;
	
					case "mouseup" :
						mouseNode._active = false;
						// clear the global mouseup event, if set
						if(this._mouseUpConnector){
							this.disconnect(mouseNode._mouseUpConnector);
							mouseNode._mouseUpConnector = false;
						}
						break;
						
					case "click" :
						if(this.focusNode && this.focusNode.focus){	// mozilla 1.7 doesn't have focus() func
							this.focusNode.focus();
						}
						this.onClick(event);
						break;				
				}
			}

			dojo.removeClass(this.domNode, base+"Disabled");
			dojo.toggleClass(this.domNode, base+"Active", this._selected || mouseNode._active == true);
			dojo.toggleClass(this.domNode, base+"Hover", mouseNode._hovering == true && mouseNode._active != true);
			dojo.addClass(this.domNode, base+"Enabled");
		}
	},

	onValueChanged: function(newValue){
		// summary: callback when value is changed
	},
	
	postCreate: function(){
		this._setDisabled(this.disabled == true);
	},

	_lastValueReported: null,
	setValue: function(newValue){
		// summary: set the value of the widget.
		if(newValue != this._lastValueReported){
			this._lastValueReported = newValue;
			dijit.util.wai.setAttr(this.focusNode || this.domNode, "waiState", "valuenow", newValue);
			this.onValueChanged(newValue);
		}
	},

	getValue: function(){
		// summary: get the value of the widget.
		return this._lastValueReported;
	}
});
