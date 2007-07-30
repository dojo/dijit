dojo.provide("dijit.form.InlineEditBox");

dojo.require("dojo.i18n");

dojo.require("dijit.form._FormWidget");
dojo.require("dijit._Container");
dojo.require("dijit.form.Button");

dojo.requireLocalization("dijit", "common");

dojo.declare(
	"dijit.form.InlineEditBox",
	[dijit.form._FormWidget, dijit._Container],
	// summary
	//		Wrapper widget to a text edit widget.
	//		The text is displayed on the page using normal user-styling.
	//		When clicked, the text is hidden, and the edit widget is
	//		visible, allowing the text to be updated.  Optionally,
	//		Save and Cancel button are displayed below the edit widget.
	//		When Save is clicked, the text is pulled from the edit
	//		widget and redisplayed and the edit widget is again hidden.
	//		Currently all textboxes that inherit from dijit.form.Textbox
	//		are supported edit widgets.
	//		An edit widget must support the following API to be used:
	//		String getTextValue() OR String getValue()
	//		void setTextValue(String) OR void setValue(String)
	//		void focus()
	//		It must also be able to initialize with style="display:none;" set.
{
	templatePath: dojo.moduleUrl("dijit.form", "templates/InlineEditBox.html"),

	// editing: Boolean
	//		Is the node currently in edit mode?
	editing: false,

	// autoSave: Boolean
	//				Changing the value automatically saves it, don't have to push save button
	autoSave: true,

	// buttonSave: String
	//              Save button label
	buttonSave: "",

	// buttonCancel: String
	//              Cancel button label
	buttonCancel: "",

	// renderAsHtml: Boolean
	//              should text render as HTML(true) or plain text(false)
	renderAsHtml: false,

	widgetsInTemplate: true,

	startup: function(){
		// look for the input widget as a child of the containerNode
		if(!this._started){

			if(this.editWidget){
				this.containerNode.appendChild(this.editWidget.domNode);
			}else{
				this.editWidget = this.getChildren()[0];
			}
			// #3209: copy the style from the source
			// don't copy ALL properties though, just the necessary/applicable ones
			dojo.forEach(["fontSize","fontFamily","fontWeight"], function(prop){
				this.editWidget.focusNode.style[prop]=this._srcStyle[prop];
				this.editable.style[prop]=this._srcStyle[prop];
			}, this);
			this._setEditValue = dojo.hitch(this.editWidget,this.editWidget.setDisplayedValue||this.editWidget.setValue);
			this._getEditValue = dojo.hitch(this.editWidget,this.editWidget.getDisplayedValue||this.editWidget.getValue);
			this._setEditFocus = dojo.hitch(this.editWidget,this.editWidget.focus);
			this.editWidget.onChange = dojo.hitch(this,"_onChange");
			this._showText();

			this._started = true;
		}
	},

	postCreate: function(){
		if(this.autoSave){
			this.buttonSpan.style.display="none";
		}
	},

	postMixInProperties: function(){
		this._srcStyle=dojo.getComputedStyle(this.srcNodeRef);
		dijit.form.InlineEditBox.superclass.postMixInProperties.apply(this, arguments);
		this.messages = dojo.i18n.getLocalization("dijit", "common", this.lang);
		dojo.forEach(["buttonSave", "buttonCancel"], function(prop){
			if(!this[prop]){ this[prop] = this.messages[prop]; }
		}, this);
	},

	_onKeyPress: function(e){
		// summary: handle keypress when edit box is not open
		if(this.disabled || e.altKey || e.ctrlKey){ return; }
		if(e.charCode == dojo.keys.SPACE || e.keyCode == dojo.keys.ENTER){
			dojo.stopEvent(e);
			this._onClick(e);
		}
	},

	_onMouseOver: function(){
		if(!this.editing){
			var classname = this.disabled ? "dijitDisabledClickableRegion" : "dijitClickableRegion";
			dojo.addClass(this.editable, classname);
		}
	},

	_onMouseOut: function(){
		if(!this.editing){
			var classStr = this.disabled ? "dijitDisabledClickableRegion" : "dijitClickableRegion";
			dojo.removeClass(this.editable, classStr);
		}
	},

	_onClick: function(e){
		// summary
		// 		When user clicks the text, then start editing.
		// 		Hide the text and display the form instead.

		if(this.editing || this.disabled){ return; }
		this._onMouseOut();
		this.editing = true;

		// show the edit form and hide the read only version of the text
		this._setEditValue(this._isEmpty ? '' : (this.renderAsHtml ? this.editable.innerHTML : this.editable.innerHTML.replace(/<br\/?>/gi, "\n")));
		this._initialText = this._getEditValue();
		this._visualize();

		// Before changing the focus, give the browser time to render.
		setTimeout(dojo.hitch(this, function(){	
			this._setEditFocus();
			this.saveButton.setDisabled(true);
		}), 1);
	},

	_visualize: function(){
		// #3209: resize the textarea to match the text
		this.editWidget.resize(dojo.contentBox(this.editable));
		dojo.style(this.editNode, "display", this.editing ? "" : "none");
		dojo.style(this.editable, "display", this.editing ? "none" : "");
	},

	_showText: function(){
		var value = this._getEditValue();
		dijit.form.InlineEditBox.superclass.setValue.call(this, value);
		// whitespace is really hard to click so show a ?
		// TODO: show user defined message in gray
		if(/^\s*$/.test(value)){ value = "?"; this._isEmpty = true; }
		else { this._isEmpty = false; }
		if(this.renderAsHtml){
			this.editable.innerHTML = value;
		}else{
			this.editable.innerHTML = "";
			if(value.split){
				var _this=this;
				dojo.forEach(value.split("\n"), function(line){
					_this.editable.appendChild(document.createTextNode(line)); // use text nodes so that imbedded tags can be edited
					_this.editable.appendChild(document.createElement("BR")); // preserve line breaks
				});
			}else{
				this.editable.appendChild(document.createTextNode(value));
			}
		}
		this._visualize();
	},

	save: function(e){
		// summary: Callback when user presses "Save" button or it's simulated.
		// e is passed in if click on save button or user presses Enter.  It's not
		// passed in when called by _onBlur.
		if(e){ dojo.stopEvent(e); }
		this.editing = false;
		this._showText();
		// If save button pressed on non-autoSave widget or Enter pressed on autoSave
		// widget, restore focus to the inline text.
		if(e){ dijit.focus(this.focusNode); }

		if(this._lastValue != this._lastValueReported){
			this.onChange(this._lastValue); // tell the world that we have changed
		}
	},

	cancel: function(e){
		// summary: Callback when user presses "Cancel" button or it's simulated.
		// e is passed in if click on cancel button or user presses Esc.  It's not
		// passed in when called by _onBlur.
		if(e){ dojo.stopEvent(e); }
		this.editing = false;
		this._visualize();
		// If cancel button pressed on non-autoSave widget or Esc pressed on autoSave
		// widget, restore focus to the inline text.
		if(e){ dijit.focus(this.focusNode); }
	},

	setValue: function(/*String*/ value){
		// sets the text without informing the server
		this._setEditValue(value);
		this.editing = false;
		this._showText();
	},

	_onEditWidgetKeyPress: function(e){
		// summary:
		//		Callback when keypress in the edit box (see template).
		//		For autoSave widgets, if Esc/Enter, call cancel/save.
		//		For non-autoSave widgets, enable save button if the text value is 
		//		different than the original value.
		if(this.autoSave){
			// If Enter/Esc pressed, treat as save/cancel.
			if(e.keyCode == dojo.keys.ESCAPE){
				this.cancel(e);
			}else if(e.keyCode == dojo.keys.ENTER){
				this.save(e);
			}
		}else{
			if(e.keyCode && e.keyCode != dojo.keys.TAB){	// ignore the tab key
				this.saveButton.setDisabled(false);
			}
		}

	},

	_onBlur: function(){
		// summary:
		//	Called by the focus manager in focus.js when focus moves outside of the 
		//	InlineEditBox widget (or it's descendants).
		if(this.autoSave && this.editing){
			if(this._getEditValue() == this._initialText){
				this.cancel();
			}else{
				this.save();
			}
		}
	},

	_onChange: function(){
		// summary:
		//	This is called when the underlying widget fires an onChange event,
		//	which means that the user has finished entering the value
		if(this.autoSave){
			this.save();
		}else{
			// #3752
			// if the keypress does not bubble up to the div, (iframe in TextArea blocks it for example)
			// make sure the save button gets enabled
			this.saveButton.setDisabled(false);
		}
	},

	setDisabled: function(/*Boolean*/ disabled){
		this.saveButton.setDisabled(disabled);
		this.cancelButton.setDisabled(disabled);
		this.editable.disabled = disabled;
		this.editWidget.setDisabled(disabled);
		dijit.form.InlineEditBox.superclass.setDisabled.apply(this, arguments);
	}
});
