dojo.provide("dijit.InlineEditBox");

dojo.require("dojo.i18n");

dojo.require("dijit._Widget");
dojo.require("dijit._Container");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.TextBox");

dojo.requireLocalization("dijit", "common");

dojo.declare(
	"dijit.InlineEditBox",
	dijit._Widget,
{
	// summary
	//		Behavior for an existing node (<p>, <div>, <span>, etc.) so that
	// 		when you click it, an editor shows up in place of the original
	//		text.  Optionally, Save and Cancel button are displayed below the edit widget.
	//		When Save is clicked, the text is pulled from the edit
	//		widget and redisplayed and the edit widget is again hidden.
	//		By default a plain Textarea widget is used as the editor (or for
	//		inline values a TextBox), but you can specify an editor such as
	//		dijit.Editor (for editing HTML) or a Slider (for adjusting a number).
	//		An edit widget must support the following API to be used:
	//		String getTextValue() OR String getValue()
	//		void setTextValue(String) OR void setValue(String)
	//		void focus()

	// editing: Boolean
	//		Is the node currently in edit mode?
	editing: false,

	// autoSave: Boolean
	//		Changing the value automatically saves it; don't have to push save button
	//		(and save button isn't even displayed)
	autoSave: true,

	// buttonSave: String
	//		Save button label
	buttonSave: "",

	// buttonCancel: String
	//		Cancel button label
	buttonCancel: "",

	// renderAsHtml: Boolean
	//		Set this to true if the specified Editor's value should be interpreted as HTML
	//		rather than plain text (ie, dijit.Editor)
	renderAsHtml: false,

	// editor: String
	//		Class name for Editor widget
	editor: "dijit.form.TextBox",

	// editorParams: Object
	//		Set of parameters for editor, like {required: true}
	editorParams: {},

	onChange: function(){
		// summary: User should set this handler to be notified of changes to value
	},

	postMixInProperties: function(){
		this.inherited('postMixInProperties', arguments);
		this.messages = dojo.i18n.getLocalization("dijit", "common", this.lang);
		dojo.forEach(["buttonSave", "buttonCancel"], function(prop){
			if(!this[prop]){ this[prop] = this.messages[prop]; }
		}, this);

		// save pointer to original source node, since Widget nulls-out srcNodeRef
		this.displayNode = this.srcNodeRef;

		// connect handlers to the display node
		var events = {
			ondijitclick: "_onClick",
			onmouseover: "_onMouseOver",	// TODO: use onmouseenter / onmouseleave
			onmouseout: "_onMouseOut",
			onfocus: "_onMouseOver",
			onblur: "_onMouseOut"			
		};
		for(var name in events){
			this.connect(this.displayNode, name, events[name]);
		}
		dijit.wai.setAttr(this.displayNode, "waiRole", "role", "button");
		
		/****
		 * TODO: compute whether to use Textarea or TextBox or dijit.Editor (if editor not specified)
		 */
		 /*
			switch(this.srcNodeRef.tagName.toLowerCase()){
				case 'span':
				case 'input':
				case 'img':
				case 'button':
					this._display='inline';
					break;
				default:
					this._display='block';
					break;
			}
		*/
	},

	_onMouseOver: function(){
		dojo.addClass(this.displayNode, this.disabled ? "dijitDisabledClickableRegion" : "dijitClickableRegion");
	},

	_onMouseOut: function(){
		dojo.removeClass(this.displayNode, this.disabled ? "dijitDisabledClickableRegion" : "dijitClickableRegion");
	},

	_onClick: function(/*Event*/ e){
		if(this.disabled){ return; }
		if(e){ dojo.stopEvent(e); }
		this._onMouseOut();

		// Since FF gets upset if you move a node while in an event handler for that node...
		setTimeout(dojo.hitch(this, "_edit"), 0);
	},

	_edit: function(){
		// summary: display the editor widget in place of the original (read only) markup

		this.editing = true;

		// Placeholder for edit widget
		// Put place holder (and evenutally editWidget) before the display node so that it's positioned correctly
		// when Calendar dropdown appears, which happens automatically on focus.
		var placeholder = document.createElement("span");
		dojo.place(placeholder, this.domNode, "before");

		// Create edit widget
		// TODO: If autoSave==false, then need save/cancel buttons.  Need an internal widget
		var cls = dojo.getObject(this.editor);
		var ew = this.editWidget = new cls(this.editorParams, placeholder);

		// Copy the style from the source
		// Don't copy ALL properties though, just the necessary/applicable ones
		var dn = this.displayNode,
			srcStyle=dojo.getComputedStyle(dn);
		dojo.forEach(["fontWeight","fontFamily","fontSize","fontStyle"], function(prop){
			ew.focusNode.style[prop]=srcStyle[prop];
		}, this);
		dojo.forEach(["display","marginTop","marginBottom","marginLeft", "marginRight"], function(prop){
			ew.domNode.style[prop]=srcStyle[prop];
		}, this);
		ew.domNode.style.width="100%";
		this._editorConnects = [
			dojo.connect(this.editWidget.domNode, "onkeypress", this, "_onEditWidgetKeyPress")
			];
		if(this.autoSave){
			this._editorConnects = this._editorConnects.concat( [
				dojo.connect(this.editWidget, "_onBlur", this, "_onEditorBlur"),
				dojo.connect(this.editWidget, "onChange", this, "_onEditorChange")
			]);
		}

		this.displayNode.style.display="none";

		var editValue = 
			this._isEmpty ? '' : 
			(this.renderAsHtml ?
			dn.innerHTML :
			dn.innerHTML.replace(/\s*\r?\n\s*/g,"").replace(/<br\/?>/gi, "\n").replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&"));
		(this.editWidget.setDisplayedValue||this.editWidget.setValue).call(this.editWidget, editValue);
		this._initialText = this._getEditValue();

		// Replace the display widget with edit widget, leaving them both displayed for a brief time so that
		// focus can be shifted without incident.  (browser may needs some time to render the editor.)
		this.domNode = ew;
		
		setTimeout(function(){
			ew.focus();
		}, 0);
	},

	_getEditValue: function(){
		// TODO: think about value vs. display value
		var ew = this.editWidget;
		return ew.getDisplayedValue ? ew.getDisplayedValue() : ew.getValue();
	},

	_showText: function(/*Boolean*/ focus){
		// summary: revert to display mode, and optionally focus on display node

		dojo.forEach(this._editorConnects, dojo.disconnect);
		delete this._editorConnects;

		//dojo.place(this.displayNode, this.editWidget.domNode, "after");
		this.displayNode.style.display="";
		this.domNode = this.displayNode;

		// give the browser some time to render the display node and then shift focus to it
		// and hide the edit widget
		console.log("setting timer");
		var _this = this;
		setTimeout(function(){
			if(focus){
				dijit.focus(_this.displayNode);
			}
			console.log("destroying edit widget");
			_this.editWidget.destroy();
			_this.editWidget = null;
		}, 0);
	},

	save: function(/*Boolean*/ focus){
		// summary
		//		Save the contents of the editor and revert to display mode.
		// focus: Boolean
		//		Focus on the display mode text
		if(!this.enableSave()){ return; }
		this.editing = false;

		// Copy value from edit widget to display dom node
		// whitespace is really hard to click so show a ?
		// TODO: show user defined message in gray
		var value = "" + this._getEditValue(); // "" is to make sure it's a string
		if(/^\s*$/.test(value)){ value = "?"; this._isEmpty = true; }
		else { this._isEmpty = false; }
		if(this.renderAsHtml){
			this.displayNode.innerHTML = value;
		}else{
			this.displayNode.innerHTML =
				value.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/"/gm, "&quot;")
					.replace("\n", "<br>");
			/***
			if(value.split){
				dojo.forEach(value.split("\n"), function(line, ary, idx){
					if(idx > 0){
						this.displayNode.appendChild(document.createElement("BR")); // preserve line breaks
					}
					this.displayNode.appendChild(document.createTextNode(line)); // use text nodes so that imbedded tags can be edited
				}, this);
			}else{
				this.displayNode.appendChild(document.createTextNode(value));
			}
			***/
		}

		this.onChange(this.editWidget.getValue()); // tell the world that we have changed

		this._showText(focus);	
	},

	cancel: function(/*Boolean*/ focus){
		// summary:
		//		Revert to display mode, discarding any changes made in the editor
		this.editing = false;
		this._showText(focus);
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
				dojo.stopEvent(e);
				this.cancel(true);
			}else if(e.keyCode == dojo.keys.ENTER){
				dojo.stopEvent(e);
				this.save(true);
			}
		}else{
			var _this = this;
			// Delay before calling _getEditValue.
			// The delay gives the browser a chance to update the Textarea.
			setTimeout(
				function(){
					console.log("doing 100ms setTimeout, editor is " + _this.editWidget);
					_this.saveButton.setDisabled(_this._getEditValue() == _this._initialText);
				}, 100);
		}
	},

	_onEditorBlur: function(){
		// summary:
		//	Called in auto save mode when focus moves outside the editor
		if(this._getEditValue() == this._initialText){
			this.cancel(false);
		}else{
			this.save(false);
		}
	},

	enableSave: function(){
		// summary: User replacable function returning a Boolean to indicate
		// if the Save button should be enabled or not - usually due to invalid conditions
		return this.editWidget.isValid ? this.editWidget.isValid() : true;
	},

	_onEditorChange: function(){
		// summary:
		//	This is called when the underlying widget fires an onChange event,
		//	which means that the user has finished entering the value
		if(this.autoSave){
			// workaround #4562: onChange is firing on widget load even though nothing has changed
			if(!this.editWidget || this._getEditValue() == this._initialText){
				return;
			}
			this.save(true);
		}else{
			// in case the keypress event didn't get through (old problem with Textarea that has been fixed
			// in theory) or if the keypress event comes too quickly and the value inside the Textarea hasn't
			// been updated yet)
			this.saveButton.setDisabled((this._getEditValue() == this._initialText) || !this.enabledSave());
		}
	}
});
