dojo.provide("dijit._editor.plugins.DefaultToolbar");
dojo.require("dijit._editor._Plugin");
dojo.require("dijit._editor.plugins.LinkDialog");
dojo.require("dijit._Widget");
dojo.require("dijit._Container");

dojo.declare("dijit._editor.plugins.DefaultToolbar", null,
	// NOTE: we duck-type to dijit._editor._Plugin
	function(){
		// console.debug("creating...");
		// the dead-simple way:
		var _p = dijit._editor._Plugin;
		var _tb = dijit.form.ToggleButton;
		this.plugins = [
			new _p({ command: "cut" }),
			new _p({ command: "copy" }),
			new _p({ command: "paste" }),
			new _p({ button: new dijit.ToolbarSeparator() }),
			new _p({ buttonClass: _tb, command: "bold" }),
			new _p({ buttonClass: _tb, command: "italic" }),
			new _p({ buttonClass: _tb, command: "underline" }),
			new _p({ buttonClass: _tb, command: "strikethrough" }),
			new _p({ button: new dijit.ToolbarSeparator() }),
			new _p({ command: "insertorderedlist" }),
			// new _p({ command: "sep" }), // test for disabled command hiding
			new _p({ command: "insertunorderedlist" }),
			new _p({ command: "indent" }),
			new _p({ command: "outdent" }),
			new _p({ button: new dijit.ToolbarSeparator() }),
			new dijit._editor.plugins.LinkDialog() //,
			// new _p({ command: "unlink" })
			// new _p({ button: new dijit.ToolbarSeparator() }),
		];
		// console.debug("...created");
	},
	{
		plugins: [],
		setEditor: function(editor){
			dojo.forEach(this.plugins, function(i){ i.setEditor(editor); });
		},
		setToolbar: function(toolbar){
			dojo.forEach(this.plugins, function(i){ i.setToolbar(toolbar); });
		}
	}
);
