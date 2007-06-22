dojo.provide("dijit.form._FormWidget");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit.util.sniff");
dojo.require("dijit.util.wai");

dojo.declare("dijit.form._FormWidget", [dijit._Widget, dijit._Templated],
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
	*/

	// baseClass: String
	//		Used to add CSS classes like FormElementDisabled
	// TODO: remove this in favor of this.domNode.baseClass?
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
		this._setStateClass();
	},


	_onMouse : function(/*Event*/ event){
		// summary:
		//	Sets _hovering, _active, and baseClass attributes depending on mouse state,
		//	then calls setStateClass() to set appropriate CSS class for this.domNode.
		//
		//	To get a different CSS class for hover, send onmouseover and onmouseout events to this method.
		//	To get a different CSS class while mouse button is depressed, send onmousedown to this method.

		var mouseNode = event.target;
		dojo.stopEvent(event);

		if(!this.disabled){
			switch(event.type){
				case "mouseover" :
					this._hovering = true;
					var baseClass, node=mouseNode;
					while( !(baseClass=node.getAttribute("baseClass")) && node != this.domNode ){
						node=node.parentNode;
					}
					this.baseClass= baseClass || "dijit"+this.declaredClass.replace(/.*\./g,"");
					break;

				case "mouseout" :	
					this._hovering = false;	
					this.baseClass=null;
					break;

				case "mousedown" :
					this._active = true;
					// set a global event to handle mouseup, so it fires properly
					//	even if the cursor leaves the button
					this._active = true;
					var self = this;
					var mouseUpConnector = dojo.connect(dojo.body(), "onmouseup", function(){
						self._active = false;
						self._setStateClass();
						dojo.disconnect(mouseUpConnector);
					});
					break;
			}
			this._setStateClass();
		}
	},

	focus: function(){
		if(this.focusNode && this.focusNode.focus){	// mozilla 1.7 doesn't have focus() func
			this.focusNode.focus();
		}
	},

	_setStateClass: function(/*String*/ base){
		// summary:
		//	Update the visual state of the widget by changing the css class on the domnode
		//	according to widget state.
		//
		//	State will be one of:
		//		<baseClass>
		//		<baseClass> + "Disabled"	- if the widget is disabled
		//		<baseClass> + "Active"		- if the mouse is being pressed down
		//		<baseClass> + "Hover"		- if the mouse is over the widget
		//
		//	For widgets which can be in a selected state (like checkbox or radio),
		//	in addition to the above classes...
		//		<baseClass> + "Selected"
		//		<baseClass> + "SelectedDisabled"	- if the widget is disabled
		//		<baseClass> + "SelectedActive"		- if the mouse is being pressed down
		//		<baseClass> + "SelectedHover"		- if the mouse is over the widget

		// get original class specified in template
		var origClass = this._origClass || (this._origClass = this.domNode.className);

		// compute the single classname representing the state of the widget
		var state = this.baseClass || this.domNode.getAttribute("baseClass");
		if(this.selected){
			state += "Selected"
		}
		if(this.disabled){
			state += "Disabled";
		}else if(this._active){
			state += "Active";
		}else if(this._hovering){
			state += "Hover";
		}
		this.domNode.className = origClass + " " + " " + state;
		//console.log(this.id + ": disabled=" + this.disabled + ", active=" + this._active + ", hover=" + this._hovering + "; state=" + state + "--> className is " + this.domNode.className);
	},

	onValueChanged: function(newValue){
		// summary: callback when value is changed
	},

	postCreate: function(){
		this._setDisabled(this.disabled == true);
		this._setStateClass();
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
