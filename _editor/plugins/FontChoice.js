dojo.provide("dijit._editor.plugins.FontChoice");

dojo.require("dijit._editor._Plugin");
dojo.require("dijit.form.ComboBox");
dojo.require("dojo.data.ItemFileReadStore");

dojo.declare("dijit._editor.plugins.FontChoice",
	dijit._editor._Plugin,
	{
		buttonClass: dijit.form.ComboBox,

//TODO: set initial focus/selection state?

		_initButton: function(){
			this.inherited("_initButton", arguments);

			//TODO: do we need nls for font names and sizes? or otherwise configurable?
			var names = this.command == "fontName" ?
				["serif", "sans-serif", "monospaced", "cursive", "fantasy"] : [1,2,3,4,5,6,7];
			this.button.store = new dojo.data.ItemFileReadStore(
				{  data: { items: dojo.map(names, function(x){ return { name: x }; }) } });

			dojo.connect(this.button, "onChange", this, function(choice){
				this.editor.execCommand(this.command, choice);
			});
		}
	}
);
