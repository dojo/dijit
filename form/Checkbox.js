dojo.provide("dijit.form.Checkbox");

dojo.require("dojo.event.browser");
dojo.require("dojo.html.style");
dojo.require("dojo.html.selection");
dojo.require("dojo.uri.Uri");

dojo.require("dijit.base.FormElement");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.util.wai");

dojo.declare(
	"dijit.form.Checkbox",
	[dijit.base.FormElement, dijit.base.TemplatedWidget],
	{
		// summary
		//	Same as a native HTML checkbox, but with fancy styling

		templatePath: dojo.uri.moduleUri("dijit", "form/templates/Checkbox.html"),

		//	Value of "type" attribute for <input>, and waiRole attribute also.
		//	User probably shouldn't adjust this.
		_type: "checkbox",

		// checked: Boolean
		//	if true, checkbox is initially marked turned on;
		//	in markup, specified as "checked='checked'" or just "checked"
		checked: false,
		
		// value: Value
		//	equivalent to value field on normal checkbox (if checked, the value is passed as
		//	the value when form is submitted)
		value: "on",

		// This shared object keeps track of all widgets, grouped by name
		_groups: { },

		postMixInProperties: function(){
			dijit.form.Checkbox.superclass.postMixInProperties.apply(this, arguments);
			
			// set tabIndex="0" because if tabIndex=="" user won't be able to tab to the field
			if(!this.disabled && this.tabIndex==""){ this.tabIndex="0"; }		
		},

		postCreate: function(){

			// find the image to use, as notated in the CSS file, but use it as a foreground
			// image
			var bi = dojo.html.getComputedStyle(this.imageContainer, "background-image");
			var href = bi.charAt(4)=='"' ? bi.slice(5,-2) : bi.slice(4,-1);	// url(foo) --> foo, url("foo") --> foo
			this.imageContainer.style.backgroundImage = "none";
			var img = this.imageNode = document.createElement("img");
			var self=this;
			img.onload = function(){ self.onImageLoad(); }
			img.src = href;

			this._setValue(this.checked);

			// find any associated label and create a labelled-by relationship
			// assumes <label for="inputId">label text </label> rather than
			// <label><input type="xyzzy">label text</label>
			var notcon = true;
			this.id = this.id !="" ? this.id : this.widgetId;
			if(this.id != ""){
				var labels = document.getElementsByTagName("label");
				if (labels != null && labels.length > 0){
					for(var i=0; i<labels.length; i++){
						if (labels[i].htmlFor == this.id){
							labels[i].id = (labels[i].htmlFor + "label");
							this._connectEvents(labels[i]);
							dijit.util.wai.setAttr(this.domNode, "waiState", "labelledby", labels[i].id);
							break;
						}
					}
				}
			}
			this._connectEvents(this.domNode);
			// this is needed here for IE
			this.inputNode.checked=this.checked;
			this._register();
		},

		onImageLoad: function(){
			this.imageLoaded = true;
			
			// set image container size to just show one sprite
			this.width = 16;	//	this.imageNode.width/6;
			this.height = 16;	// this.imageNode.height/2;
			this.imageContainer.style.width = this.width + "px";
			this.imageContainer.style.height = this.height + "px";

			// Hide the HTML native checkbox and display the image instead
			this.inputNode.style.display="none";
			this.imageContainer.appendChild(this.imageNode);

			// position image to display right sprite
			this._setValue(this.checked);
		},
		
		uninitialize: function(){
			this._deregister();
		},

		_connectEvents: function(/*DomNode*/ node){
			dojo.event.browser.addListener(node, "onmouseover", dojo.lang.hitch(this, "mouseOver"));
			dojo.event.browser.addListener(node, "onmouseout", dojo.lang.hitch(this, "mouseOut"));
			dojo.event.browser.addListener(node, "onkey", dojo.lang.hitch(this, "onKey"));
			dojo.event.browser.addListener(node, "onclick", dojo.lang.hitch(this, "_onClick"));
			dojo.html.disableSelection(node);
		},

		_onClick: function(/*Event*/ e){
			if(this.disabled == false){
				this.setValue(!this.checked);
			}
			e.stopPropagation();
			this.onClick();
		},

		_register: function(){
			// summary: add this widget to _groups
			if(this._groups[this.name] == null){
				this._groups[this.name]=[];
			}
			this._groups[this.name].push(this);
		},

		_deregister: function(){
			// summary: remove this widget from _groups
			var idx = dojo.lang.find(this._groups[this.name], this, true);
			this._groups[this.name].splice(idx, 1);
		},

		setValue: function(/*boolean*/ bool){
			// summary: set the checkbox state
			this._setValue(bool);
		},

		onClick: function(){
			// summary: user overridable callback function for checkbox being clicked
		},

		onKey: function(/*Event*/ e){
			// summary: callback when user hits a key
			var k = dojo.event.browser.keys;
			if(e.key == " "){
	 			this._onClick(e);
	 		}
		},

		mouseOver: function(/*Event*/ e){
			// summary: callback when user moves mouse over checkbox
			this.hover=true;
			this._setValue(this.checked);
		},

		mouseOut: function(/*Event*/ e){
			// summary: callback when user moves mouse off of checkbox
			this.hover=false;
			this._setValue(this.checked);
		},

		// offset from top of image
		_topOffset: 0,

		_setValue: function(/*Boolean*/ bool){
			// summary:
			//	sets checkbox to given value
			//	set state of hidden checkbox node to correspond to given value.
			this.checked = bool;
			this.inputNode.checked = this.checked;
			if(this.disabled){
				this.inputNode.setAttribute("disabled",true);
			}else{
				this.inputNode.removeAttribute("disabled");
			}
			dijit.util.wai.setAttr(this.domNode, "waiState", "checked", this.checked);

			// show the right sprite, depending on state of checkbox
			if(this.imageLoaded){
				var left = (this.checked ? 0 : this.width ) + (this.disabled ? this.width*2 : (this.hover ? this.width*4 : 0 ));
				var s = this.imageNode.style;
				s.marginLeft = -1*left + "px";
				s.marginTop = -1*this._topOffset + "px";
			}
		}
	}
);
dojo.declare(
	"dijit.form.RadioButton",
	dijit.form.Checkbox,
	{
		// summary
		//	Same as an HTML radio button, but with fancy styling

		_type: "radio",

		_onClick: function(/*Event*/ e){
			if(!this.disabled && !this.checked){
				this.setValue(true);
			}
			e.stopPropagation();
			this.onClick();
		},

		setValue: function(/*boolean*/ bool){
			this._setValue(bool);

			// if turning this widget on, then turn others in same group off
			if(bool){
				dojo.lang.forEach(this._groups[this.name], function(widget){
					if(widget != this){
						widget._setValue(false);
					}
				}, this);
			}
		},

		onImageLoad: function(){
			// position to second row of sprites (the radio buttons)
			this._topOffset = 16;	// this.imageNode.height/2;
			dijit.form.Checkbox.prototype.onImageLoad.call(this);
		}
	}
);
