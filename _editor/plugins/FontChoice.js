dojo.provide("dijit._editor.plugins.FontChoice");

dojo.require("dijit._editor._Plugin");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojo.i18n");

dojo.requireLocalization("dijit._editor", "FontChoice");

dojo.declare("dijit._editor.plugins._FontDropDown",
	[dijit._Widget, dijit._Templated],{
	// summary:
	//		Base class for widgets that contains a label (like "Font:")
	//		and a FilteringSelect drop down to pick a value.
	//		Used as Toolbar entry.

	labelId: "", 
	label: "",
	widget: null,
	widgetsInTemplate: true,

	templateString:
		"<span style='white-space: nowrap' class='dijit dijitReset dijitInline'>" +
			"<label class='dijitLeft dijitInline' for='${selectId}'>${label}</label>" +
			"<input dojoType='dijit.form.FilteringSelect' required=false labelType=html labelAttr=label searchAttr=name " +
					"tabIndex='-1' id='${selectId}' dojoAttachPoint='select' value=''/>" +
		"</span>",

	postMixInProperties: function(){
		this.inherited(arguments);

		this.strings = dojo.i18n.getLocalization("dijit._editor", "FontChoice");

		// Set some substitution variables used in the template
		this.label = this.strings[this.command];
		this.id = dijit.getUniqueId(this.declaredClass.replace(/\./g,"_"));		
		this.selectId = this.id + "_select";
		
		this.inherited(arguments);
	},

	postCreate: function(){
		// Initialize the list of items in the drop down by creating data store with items like:
		// {value: 1, name: "xx-small", label: "<font size=1>xx-small</font-size>" }
		var	items = dojo.map(this.values, function(value){
				var name = this.strings[value] || value;
				return {
					label: this.getLabel(value, name),
					name: name,
					value: value
				};
			}, this);
		//items.push({label: "", name:"", value:""}); // FilteringSelect doesn't like unmatched blank strings

		this.select.store = new dojo.data.ItemFileReadStore({
			data: {
				identifier: "value",
				items: items
			}
		});

		this.select.attr("value", "");
	},

	_setValueAttr: function(value){
		//if the value is not a permitted value, just set empty string to prevent showing the warning icon
		this.select.attr('value', dojo.indexOf(this.values,value) < 0 ? "" : value);
	},

	focus: function(){
		this.select.focus();
	}
});


dojo.declare("dijit._editor.plugins._FontNameDropDown", dijit._editor.plugins._FontDropDown, {
	// summary:
	//		Dropdown to select a font; goes in editor toolbar.

	// generic: Boolean
	//		Use generic (web standard) font names
	generic: false,

	command: "fontName",

	postMixInProperties: function(){
		if(!this.values){
			this.values = this.generic ? ["serif", "sans-serif", "monospace", "cursive", "fantasy"] : // CSS font-family generics
					["Arial", "Times New Roman", "Comic Sans MS", "Courier New"];
		}
		this.inherited(arguments);
	},

	getLabel: function(value, name){
		return "<div style='font-family: "+value+"'>" + name + "</div>";
	},

	_setValueAttr: function(value){
		if(this.generic){
			var map = {
				"Arial": "sans-serif",
				"Helvetica": "sans-serif",
				"Myriad": "sans-serif",
				"Times": "serif",
				"Times New Roman": "serif",
				"Comic Sans MS": "cursive",
				"Apple Chancery": "cursive",
				"Courier": "monospace",
				"Courier New": "monospace",
				"Papyrus": "fantasy"
//					,"????": "fantasy" TODO: IE doesn't map fantasy font-family?
			};
			value = map[value] || value;
		}

		this.inherited(arguments, [value]);
	}
});

dojo.declare("dijit._editor.plugins._FontSizeDropDown", dijit._editor.plugins._FontDropDown, {
	// summary:
	//		Dropdown to select a font size; goes in editor toolbar.

	command: "fontSize",
	
	values: [1,2,3,4,5,6,7], // sizes according to the old HTML FONT SIZE
	
	getLabel: function(value, name){
		// we're stuck using the deprecated FONT tag to correspond with the size measurements used by the editor
		return "<font size="+value+"'>"+name+"</font>";
	},
	
	_setValueAttr: function(value){
		if(value.indexOf && value.indexOf("px") != -1){
			var pixels = parseInt(value);
			value = {10:1, 13:2, 16:3, 18:4, 24:5, 32:6, 48:7}[pixels] || value;
		}

		this.inherited(arguments, [value]);
	}
});


dojo.declare("dijit._editor.plugins._FormatBlockDropDown", dijit._editor.plugins._FontDropDown, {
	// summary:
	//		Dropdown to select a format (like paragraph or heading); goes in editor toolbar.

	command: "formatBlock",
	
	values: ["p", "h1", "h2", "h3", "pre"],
	              
	getLabel: function(value, name){
		// we're stuck using the deprecated FONT tag to correspond with the size measurements used by the editor
		return "<" + value + ">" + name + "</" + value + ">";
	}
});

// TODO: for 2.0, split into FontChoice plugin into three separate classes,
// one for each command (and change registry below)
dojo.declare("dijit._editor.plugins.FontChoice",
	dijit._editor._Plugin,
	{
		//	summary:												 
		//		This plugin provides three drop downs for setting style in the editor
		//		(font, font size, and format block), as controlled by command.
		//
		//	description:
		//		The commands provided by this plugin are:
		//
		//		* fontName
		//	|		Provides a drop down to select from a list of font names
		//		* fontSize
		//	|		Provides a drop down to select from a list of font sizes
		//		* formatBlock
		//	|		Provides a drop down to select from a list of block styles
		//	|
		//
		//		which can easily be added to an editor by including one or more of the above commands
		//		in the `plugins` attribute as follows:
		//
		//	|	plugins="['fontName','fontSize',...]"
		//
		//		It is possible to override the default dropdown list by providing an Array for the `custom` property when
		//		instantiating this plugin, e.g.
		//
		//	|	plugins="[{name:'dijit._editor.plugins.FontChoice', command:'fontName', custom:['Verdana','Myriad','Garamond']},...]"
		//
		//		Alternatively, for `fontName` only, `generic:true` may be specified to provide a dropdown with
		//		[CSS generic font families](http://www.w3.org/TR/REC-CSS2/fonts.html#generic-font-families)
		//
		//		Note that the editor is often unable to properly handle font styling information defined outside
		//		the context of the current editor instance, such as pre-populated HTML.

		// Override _Plugin.useDefaultCommand... processing is handled by this plugin, not by dijit.Editor.
		useDefaultCommand: false,

		_initButton: function(){
			// Overrides _Plugin._initButton(), to initialize the FilteringSelect+label in toolbar,
			// rather than a simple button.

			// Create the widget to go into the toolbar (the so-called "button")
			var clazz =  {
					fontName: dijit._editor.plugins._FontNameDropDown,
					fontSize: dijit._editor.plugins._FontSizeDropDown,
					formatBlock: dijit._editor.plugins._FormatBlockDropDown
				}[this.command],
				params = this.params;

			// For back-compat reasons support setting custom values via "custom" parameter
			// rather than "values" parameter
			if(this.params.custom){
				params.values = this.params.custom;
			}

			this.button = new clazz(params);

			// Reflect changes to the drop down in the editor
			this.connect(this.button.select, "onChange", function(choice){
				if(this.updating){ return; }
				if(dojo.isIE || !this._focusHandle){
					this.editor.focus();
				}else{
					dijit.focus(this._focusHandle);
				}
				if(this.command == "fontName" && choice.indexOf(" ") != -1){ choice = "'" + choice + "'"; }
				this.editor.execCommand(this.editor._normalizeCommand(this.command), choice);
			});
		},

		updateState: function(){
			// Overrides _Plugin.updateState().
			// Set value of drop down in toolbar to reflect font/font size/format block
			// of text at current caret position.

			var _e = this.editor;
			var _c = this.command;
			if(!_e || !_e.isLoaded || !_c.length){ return; }
			if(this.button){
				var value;
				try{
					value = _e.queryCommandValue(_c) || "";
				}catch(e){
					//Firefox may throw error above if the editor is just loaded, ignore it
					value = "";
				}
				// strip off single quotes, if any
				var quoted = dojo.isString(value) && value.match(/'([^']*)'/);
				if(quoted){ value = quoted[1]; }

				this.updating = true;
				this.button.attr('value', value);
				delete this.updating;
			}

			if(this.editor.iframe){
				this._focusHandle = dijit.getFocus(this.editor.iframe);
			}
		}
	}
);

// Register this plugin.
dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	switch(o.args.name){
	case "fontName": case "fontSize": case "formatBlock":
		o.plugin = new dijit._editor.plugins.FontChoice({command: o.args.name});
	}
});
