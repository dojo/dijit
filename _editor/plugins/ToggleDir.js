dojo.provide("dijit._editor.plugins.ToggleDir");
dojo.experimental("dijit._editor.plugins.ToggleDir");

dojo.require("dijit._editor._Plugin");

dojo.declare("dijit._editor.plugins.ToggleDir",
	dijit._editor._Plugin,
	{
		//summary: This plugin is used to toggle direction of the edited document only,
		//		   no matter what direction the whole page is.
				
		useDefaultCommand: false,
		command: "toggleDir",

		_initButton: function(){
			this.inherited("_initButton", arguments);
			dojo.connect(this.button, "onClick", this, this._toggleDir);		
		},

		updateState: function(){},//overwrite

		_toggleDir: function(){
			var editDoc = this.editor.editorObject.contentWindow.document.documentElement;
			var isLtr = dojo.getComputedStyle(editDoc).direction == "ltr";
			editDoc.dir/*html node*/ = isLtr ? "rtl" : "ltr";
		}
	}
);