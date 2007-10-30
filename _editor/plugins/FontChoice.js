dojo.provide("dijit._editor.plugins.FontChoice");

dojo.require("dijit._editor._Plugin");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojo.i18n");

dojo.requireLocalization("dijit._editor", "FontChoice");

dojo.declare("dijit._editor.plugins.FontChoice",
	dijit._editor._Plugin,
	{
		buttonClass: dijit.form.FilteringSelect,

		_initButton: function(){
			this.inherited("_initButton", arguments);

			//TODO: do we need nls for font names?  provide css font lists? or otherwise make this more configurable?
			var names = {
				fontName: ["serif", "sans-serif", "monospaced", "cursive", "fantasy"],
				fontSize: [1,2,3,4,5,6,7],
				formatBlock: ["p", "h1", "h2", "h3", "pre"] }[this.command];
			var strings = dojo.i18n.getLocalization("dijit._editor", "FontChoice");
			var items = dojo.map(names, function(x){ return { name: strings[x], value: x }; });
			items.push({name:"", value:""}); // FilteringSelect doesn't like unmatched blank strings
			this.button.store = new dojo.data.ItemFileReadStore(
				{ data: { identifier: "value",
					items: items }
				});
			this.button.setValue("");

			dojo.connect(this.button, "onChange", this, function(choice){
				this.editor.execCommand(this.command, choice);
			});
		},

		updateState: function(){
			this.inherited("updateState", arguments);
			var _e = this.editor;
			var _c = this.command;
			if(!_e || !_e.isLoaded || !_c.length){ return; }
			if(this.button){
				var value = _e.queryCommandValue(_c);
				this.button.setValue(value);
			}
		},

		setToolbar: function(){
			this.inherited("setToolbar", arguments);

			var label = dojo.doc.createElement("label");
			var forRef = "dijitEditor"+this.command; // TODO: add unique id?
			label.setAttribute("for", forRef);
			this.button.name = forRef;
			var strings = dojo.i18n.getLocalization("dijit._editor", "FontChoice");
			label.appendChild(dojo.doc.createTextNode(strings[this.command]+"\xa0"));
			dojo.place(label, this.button.domNode, "before");
		}
	}
);
