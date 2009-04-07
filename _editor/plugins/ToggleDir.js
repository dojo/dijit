dojo.provide("dijit._editor.plugins.ToggleDir");
dojo.experimental("dijit._editor.plugins.ToggleDir");

dojo.require("dijit._editor._Plugin");
dojo.require("dijit.form.ToggleButton");

dojo.declare("dijit._editor.plugins.ToggleDir",
	dijit._editor._Plugin,
	{
		// summary:
		//		This plugin is used to toggle direction of the edited document,
		//		independent of what direction the whole page is.

		// Override _Plugin.useDefaultCommand: processing is done in this plugin
		// rather than by sending commands to the Editor
		useDefaultCommand: false,

		command: "toggleDir",

		// Override _Plugin.buttonClass to use a ToggleButton for this plugin rather than a vanilla Button
		buttonClass: dijit.form.ToggleButton,

		_initButton: function(){
			// Override _Plugin._initButton() to setup handler for button click events.
			this.inherited(arguments);

			this.connect(this.button, "onChange", "_toggleDir");

			// Set initial checked state of button based on which direction editor is
			var editDoc = this.editor.editorObject.contentWindow.document.documentElement;
			var isLtr = dojo.getComputedStyle(editDoc).direction == "ltr";
			this.button.attr("checked", !isLtr);
		},

		updateState: function(){
			// Override _Plugin.updateState() to do nothing, since we don't need to react to changes in the
			// editor like arrow keys etc.
		},

		_toggleDir: function(){
			// summary:
			//		Handler for button click events, to switch the text direction of the editor
			var editDoc = this.editor.editorObject.contentWindow.document.documentElement;
			var isLtr = dojo.getComputedStyle(editDoc).direction == "ltr";
			editDoc.dir/*html node*/ = isLtr ? "rtl" : "ltr";
		}
	}
);

// Register this plugin.
dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	switch(o.args.name){
	case "toggleDir":
		o.plugin = new dijit._editor.plugins.ToggleDir({command: o.args.name});
	}
});
