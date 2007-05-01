dojo.provide("dijit.form.Checkbox");

dojo.require("dijit.base.FormElement");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.util.sniff");
dojo.require("dijit.util.wai");

dojo.declare(
	"dijit.form.Checkbox",
	[dijit.base.FormElement, dijit.base.TemplatedWidget],
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
		//   1. Image not used or failed to load
		//   2. Image loaded and used.
		// In case 1, the regular html inputs are shown and used by the user.
		// In case 2, the regular html inputs are invisible but still used by
		// the user. They are turned invisible and overlay the dijit image.
		//
		// Layout
		//   Styling is controlled in 3 places: tundra, template, and 
		// programmatically in Checkbox.js. The latter is required 
		// because of two modes of dijit checkbox: image loaded, vs 
		// image not loaded. Also for accessibility it is important 
		// that dijit work with images off (a browser preference).

		templatePath: dojo.moduleUrl("dijit.form", "templates/Checkbox.html"),

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
			// find the image to use, as notated in the CSS file, but use it as a foreground
			var bi = dojo.getComputedStyle(this.imageContainer).backgroundImage;
			var href = bi.charAt(4)=='"' ? bi.slice(5,-2) : bi.slice(4,-1);	// url(foo) --> foo, url("foo") --> foo
			this.imageContainer.style.backgroundImage = "none";
			var img = (this.imageNode = document.createElement("img"));
			var self=this;

			// inputNode.checked must be assigned before img.onload handler
			this.inputNode.checked=this.checked;
			// note: onImageLoad may get called as a side-effect of this assignment
			img.onload = function(){ self.onImageLoad(); }
			img.src = href;
			this._setDisabled(this.disabled);
		},

		onImageLoad: function(){
			this.imageLoaded = true;

			// set image container size to just show one sprite
			if(!this.width){
				this.width = 16;
			} // dojo.html.getPixelValue is not succeeding for all browsers
			if(!this.height){
				this.height = 16;
			}

			// Turn the input element invisible and make sure it overlays
			// the dojo image container.
			this._addClass(this.inputNode,"dojoCheckboxInputInvisible");
			this._addClass(this.imageContainer,"dojoCheckboxImageContainer");

			var imageContainerStyle = this.imageContainer.style;
			var inputStyle = this.inputNode.style;
			var domNodeStyle = this.domNode.style;
			 
			// Force size based on width and height.
			inputStyle.width = imageContainerStyle.width = this.width + "px";
			inputStyle.height = imageContainerStyle.height = this.height + "px";
			domNodeStyle.position = "relative";
			domNodeStyle.fontFamily = "monospace"; // webkit spacing hack
			
			// User will always interact with input element
			this._connectEvents(this.inputNode);
			
			this.imageContainer.appendChild(this.imageNode);
			
			this._updateView();
		},
		
		_connectEvents: function(/*DomNode*/ node){
			dojo.addListener(node, "onfocus", this, this.mouseOver);
			dojo.addListener(node, "onblur", this, this.mouseOut);
			dojo.addListener(node, "onmouseover", this, this.mouseOver);
			dojo.addListener(node, "onmouseout", this, this.mouseOut);
			dojo.addListener(node, "onclick", this, this._onClick);
			dijit._disableSelection(node);
		},

		_setDisabled: function(/*Boolean*/ disabled){
			this.domNode.disabled = this.inputNode.disabled = this.disabled = disabled;
		},
		

		onChecked: function(/*Boolean*/ newCheckedState){
			// summary: callback when value is changed
		},
		
		setChecked: function(/*Boolean*/ check){
			// summary: set the checked state of the widget.
			if(check != this.checked){
				this.checked = check;
				dijit.util.wai.setAttr(this.domNode, "waiState", "checked", check);
				this.onChecked(check);
			}
		},
	
		getChecked: function(){
			// summary: get the checked state of the widget.
			return this.checked;
		},

		onClick: function(/*Event*/ e){
			// summary: user overridable callback for click event handling 
		},
		
		_onClick: function(/*Event*/ e){
			/// summary: callback for a click event
			this._updateView();
			this.onClick(e);
		},

		mouseOver: function(/*Event*/ e){
			// summary: callback when user moves mouse over checkbox
			this.hover=true;
			this._updateView();
		},

		mouseOut: function(/*Event*/ e){
			// summary: callback when user moves mouse off of checkbox
			this.hover=false;
			this._updateView();
		},

		// offset from left of image
		_leftOffset: 0,

		_updateView: function(/*Widget?*/ awidget){
			var w = awidget || this;
			w.setChecked(w.inputNode.checked);
			
			this.setValue(w.checked? this.inputNode.value:"");

			this._setDisabled(w.disabled);

			// show the right sprite, depending on state of checkbox
			if(w.imageLoaded){
				var left = w._leftOffset + (w.checked ? 0 : w.width) +
					(w.disabled ? this.width*2 : (w.hover ? w.width*4 : 0));
				w.imageNode.style.marginLeft = -1*left + "px";
			}
			if(!awidget){
				this.updateContext();
			}
		},
		
		updateContext: function(){
			// summary: specialize this function to update related GUI
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
		
		// This shared object keeps track of all widgets, grouped by name
		_groups: {},

		_register: function(){
			// summary: add this widget to _groups
			(this._groups[this.name] = this._groups[this.name] || []).push(this);
		},

		_deregister: function(){
			// summary: remove this widget from _groups
			dojo.forEach(this._groups[this.name], function(widget, i, arr){
				if(widget === this){
					arr.splice(i, 1);
					return;
				}
			}, this);
		},
		
		uninitialize: function(){
			this._deregister();
		},

		updateContext: function(){
			// summary: make sure the sibling radio views are correct
			dojo.forEach(this._groups[this.name], function(widget){
				if(widget != this){
					widget._updateView(widget);
				}
			}, this);
		},

		onImageLoad: function(){
			this._leftOffset = 96;	// this.imageNode.width/2;
			this._register();
			dijit.form.Checkbox.prototype.onImageLoad.call(this);
		}
	}
);
