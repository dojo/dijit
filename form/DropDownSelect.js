dojo.provide("dijit.form.DropDownSelect");

dojo.require("dijit.form._FormSelectWidget");
dojo.require("dijit._HasDropDown");
dojo.require("dijit.Menu");

dojo.requireLocalization("dijit.form", "validate");

dojo.declare("dijit.form._DropDownSelectMenu", dijit.Menu, {
	// Summary:
	//		An internally-used menu for dropdown that allows us to more
	//		gracefully overflow our menu
	buildRendering: function(){
		// Summary:
		//		Stub in our own changes, so that our domNode is not a table
		//		otherwise, we won't respond correctly to heights/overflows
		this.inherited(arguments);
		var o = this.menuTableNode = this.domNode;
		var n = this.domNode = dojo.doc.createElement("div");
		if(o.parentNode){
			o.parentNode.replaceChild(n, o);
		}
		dojo.removeClass(o, "dijitMenuTable");
		n.className = o.className + " dijitDropDownSelectMenu";
		o.className = "dijitReset dijitMenuTable";
		n.appendChild(o);
	},
	resize: function(/*Object*/ mb){
		// Summary:
		//		Overridden so that we are able to handle resizing our 
		//		internal widget.  Note that this is not a "full" resize
		//		implementation - it only works correctly if you pass it a
		//		marginBox.
		//
		// mb: Object
		//		The margin box to set this dropdown to.
		if(mb){
			dojo.marginBox(this.domNode, mb);
			var w = dojo.contentBox(this.domNode).w;
			if(dojo.isFF && this.domNode.scrollHeight > this.domNode.clientHeight){
				w--;
			}
			dojo.marginBox(this.menuTableNode, {w: w});
		}
	}
});

dojo.declare("dijit.form.DropDownSelect", [dijit.form._FormSelectWidget, dijit._HasDropDown], {
	attributeMap: dojo.mixin(dojo.clone(dijit.form._FormSelectWidget.prototype.attributeMap),{value:"valueNode",name:"valueNode"}),
	// summary:
	//		This is a "Styleable" select box - it is basically a DropDownButton which
	//		can take as its input a <select>.

	baseClass: "dijitDropDownSelect",
	
	templatePath: dojo.moduleUrl("dijit.form", "templates/DropDownSelect.html"),
	
	// attributeMap: Object
	//		Add in our style to be applied to the focus node
	attributeMap: dojo.mixin(dojo.clone(dijit.form._FormSelectWidget.prototype.attributeMap),{style:"tableNode"}),
	
	// required: Boolean
	//		Can be true or false, default is false.
	required: false,

	// state: String
	//		Shows current state (ie, validation result) of input (Normal, Warning, or Error)
	state: "",

	//	tooltipPosition: String[]
	//		See description of dijit.Tooltip.defaultPosition for details on this parameter.
	tooltipPosition: [],

	// emptyLabel: string
	//		What to display in an "empty" dropdown
	emptyLabel: "",
	
	// _isLoaded: boolean
	//		Whether or not we have been loaded
	_isLoaded: false,
	
	// _childrenLoaded: boolean
	//		Whether or not our children have been loaded
	_childrenLoaded: false,
	
	_fillContent: function(){
		// summary:  
		//		Set the value to be the first, or the selected index
		this.inherited(arguments);
		if(this.options.length && !this.value){
			var si = this.srcNodeRef.selectedIndex;
			this.value = this.options[si != -1 ? si : 0].value;
		}
		
		// Create the dropDown widget
		this.dropDown = new dijit.form._DropDownSelectMenu();
		dojo.addClass(this.dropDown.domNode, this.baseClass + "Menu");
	},

	_getMenuItemForOption: function(/* dijit.form.__SelectOption */ option){
		// summary:
		//		For the given option, return the menu item that should be
		//		used to display it.  This can be overridden as needed
		if(!option.value){
			// We are a separator (no label set for it)
			return new dijit.MenuSeparator();
		}else{
			// Just a regular menu option
			var click = dojo.hitch(this, "_setValueAttr", option);
			return new dijit.MenuItem({
				option: option,
				label: option.label,
				onClick: click,
				disabled: option.disabled || false
			});
		}
	},

	_addOptionItem: function(/* dijit.form.__SelectOption */ option){
		// summary:
		//		For the given option, add a option to our dropdown
		//		If the option doesn't have a value, then a separator is added 
		//		in that place.
		this.dropDown.addChild(this._getMenuItemForOption(option));
	},

	_getChildren: function(){ return this.dropDown.getChildren(); },
	
	_loadChildren: function(/* boolean */ loadMenuItems){
		// summary: 
		//		Resets the menu and the length attribute of the button - and
		//		ensures that the label is appropriately set.
		//	loadMenuItems: boolean
		//		actually loads the child menu items - we only do this when we are
		//		populating for showing the dropdown.

		if(loadMenuItems === true){
			// this.inherited destroys this.dropDown's child widgets (MenuItems).
			// Avoid this.dropDown (Menu widget) having a pointer to a destroyed widget (which will cause
			// issues later in _setSelected).
			delete this.dropDown.focusedChild;

			this.inherited(arguments);
		}else{
			this._updateSelection();
		}

		var len = this.options.length;
		this._isLoaded = false;
		this._childrenLoaded = true;
		
		// Set our length attribute and our value
		if(!this._iReadOnly){
			this.attr("readOnly", (len === 1));
			delete this._iReadOnly;
		}
		if(!this._iDisabled){
			this.attr("disabled", (len === 0));
			delete this._iDisabled;
		}
		if(!this._loadingStore){
			// Don't call this if we are loading - since we will handle it later
			this._setValueAttr(this.value);
		}
	},
	
	_setValueAttr: function(value){
		this.inherited(arguments);
		dojo.attr(this.valueNode, "value", this.attr("value"));
	},
	
	_setDisplay: function(/*String*/ newDisplay){
		// summary: sets the display for the given value (or values)
		this.containerNode.innerHTML = '<span class="dijitReset dijitInline ' + this.baseClass + 'Label">' +
					(newDisplay || this.emptyLabel || "&nbsp;") +
					'</span>';
		this._layoutHack();
	},

	validate: function(/*Boolean*/ isFocused){
		// summary:
		//		Called by oninit, onblur, and onkeypress.
		// description:
		//		Show missing or invalid messages if appropriate, and highlight textbox field.
		var isValid = this.isValid(isFocused);
		this.state = isValid ? "" : "Error";
		this._setStateClass();
		dijit.setWaiState(this.focusNode, "invalid", isValid ? "false" : "true");
		var message = isValid ? "" : this._missingMsg;
		if(this._message !== message){
			this._message = message;
			dijit.hideTooltip(this.domNode);
			if(message){
				dijit.showTooltip(message, this.domNode, this.tooltipPosition);
			}
		}
		return isValid;		
	},

	isValid: function(/*Boolean*/ isFocused){
		// summary: Whether or not this is a valid value
		return (!this.required || !(/^\s*$/.test(this.value)));
	},
	
	reset: function(){
		// summary: Overridden so that the state will be cleared.
		this.inherited(arguments);
		dijit.hideTooltip(this.domNode);
		this.state = "";
		this._setStateClass();
		delete this._message;
	},

	postMixInProperties: function(){
		// summary: set the missing message
		this.inherited(arguments);
		this._missingMsg = dojo.i18n.getLocalization("dijit.form", "validate", 
									this.lang).missingMessage;
	},
	
	postCreate: function(){
		this.inherited(arguments);
		if(dojo.attr(this.srcNodeRef, "disabled")){
			this.attr("disabled", true);
		}
		if(this.tableNode.style.width){
			dojo.addClass(this.domNode, this.baseClass + "FixedWidth");
		}
	},

	startup: function(){
		if(this._started){ return; }

		// the child widget from srcNodeRef is the dropdown widget.  Insert it in the page DOM,
		// make it invisible, and store a reference to pass to the popup code.
		if(!this.dropDown){
			var dropDownNode = dojo.query("[widgetId]", this.dropDownContainer)[0];
			this.dropDown = dijit.byNode(dropDownNode);
			delete this.dropDownContainer;
		}
		this.inherited(arguments);
	},
	
	isLoaded: function(){
		return this._isLoaded;
	},
	
	loadDropDown: function(/* Function */ loadCallback){
		// summary: populates the menu
		this._loadChildren(true);
		this._isLoaded = true;
		loadCallback();
	},
	
	_setReadOnlyAttr: function(value){
		this._iReadOnly = value;
		if(!value && this._childrenLoaded && this.options.length === 1){
			return;
		}
		this.readOnly = value;
	},
	
	_setDisabledAttr: function(value){
		this._iDisabled = value;
		if(!value && this._childrenLoaded && this.options.length === 0){
			return;
		}
		this.inherited(arguments);
	},

	uninitialize: function(preserveDom){
		if(this.dropDown){
			this.dropDown.destroyRecursive(preserveDom);
			delete this.dropDown;
		}
		this.inherited(arguments);
	}
});
