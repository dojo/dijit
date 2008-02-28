dojo.provide("dijit._editor.plugins.FontChoice");

dojo.require("dijit._editor._Plugin");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojo.i18n");

dojo.requireLocalization("dijit._editor", "FontChoice");

dojo.declare("dijit._editor.plugins.FontChoice",
	dijit._editor._Plugin,
	{
		_uniqueId: 0,

		buttonClass: dijit.form.FilteringSelect,

		_initButton: function(){
			//TODO: do we need nls for font names?  provide css font lists? or otherwise make this more configurable?
			var cmd = this.command;
			var names = {
				fontName: ["serif", "sans-serif", "monospaced", "cursive", "fantasy"],
				fontSize: [1,2,3,4,5,6,7],
				formatBlock: ["p", "h1", "h2", "h3", "pre"] }[cmd];
			var strings = dojo.i18n.getLocalization("dijit._editor", "FontChoice");
			var items = dojo.map(names, function(value){
				var name = strings[value];
				var label = name;
				switch(cmd){
				case "fontName":
					label = "<div style='font-family: "+value+"'>"+name+"</div>";
					break;
				case "fontSize":
					// we're stuck using the deprecated FONT tag to correspond with the size measurements used by the editor
					label = "<font size="+value+"'>"+name+"</font>";
				}
				return { label: label, name: name, value: value };
			});
			items.push({label: "", name:"", value:""}); // FilteringSelect doesn't like unmatched blank strings

			dijit._editor.plugins.FontChoice.superclass._initButton.apply(this,
				[{ labelType: "html", labelAttr: "label", searchAttr: "name", store: new dojo.data.ItemFileReadStore(
					{ data: { identifier: "value", items: items } })}]);

			this.button.setValue("");

			this.connect(this.button, "onChange", function(choice){
				// FIXME: IE is really messed up here!!
				if(dojo.isIE){
					if("_savedSelection" in this){
						var b = this._savedSelection;
						delete this._savedSelection;
						this.editor.focus();
						this.editor._moveToBookmark(b);
					}
				}else{
//					this.editor.focus();
					dijit.focus(this._focusHandle);
				}
console.log("onChange");
				this.editor.execCommand(this.command, choice);
			});
		},

		updateState: function(){
			this.inherited(arguments);
			var _e = this.editor;
			var _c = this.command;
			if(!_e || !_e.isLoaded || !_c.length){ return; }
			if(this.button){
				var value = _e.queryCommandValue(_c);
				this.button.setValue(value);
			}

			// FIXME: IE is *really* b0rken
			if(dojo.isIE){
				this._savedSelection = this.editor._getBookmark();
			}
			this._focusHandle = dijit.getFocus(this.editor.iframe);
		},

		setToolbar: function(){
			this.inherited(arguments);

			var forRef = this.button;
			if(!forRef.id){ forRef.id = "dijitEditorButton-"+this.command+(this._uniqueId++); } //TODO: is this necessary?  FilteringSelects always seem to have an id?
			var label = dojo.doc.createElement("label");
			label.setAttribute("for", forRef.id);
			var strings = dojo.i18n.getLocalization("dijit._editor", "FontChoice");
			label.appendChild(dojo.doc.createTextNode(strings[this.command]));
			dojo.place(label, this.button.domNode, "before");
		}
	}
);

dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	switch(o.args.name){
	case "fontName": case "fontSize": case "formatBlock":
		o.plugin = new dijit._editor.plugins.FontChoice({command: o.args.name});
	}
});
