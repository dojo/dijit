define([
	"dojo/_base/connect", // connect.subscribe
	"dojo/_base/declare", // declare
	"dojo/dom-style", // domStyle.getComputedStyle
	"dojo/_base/kernel", // kernel.experimental
	"dojo/_base/lang", // lang.hitch
	"../_Plugin",
	"../../form/ToggleButton",
	"../.."	// dijit._scopeName
], function(connect, declare, domStyle, kernel, lang, _Plugin, ToggleButton, dijit){

/*=====
	var _Plugin = dijit._editor._Plugin;
=====*/

	// module:
	//		dijit/_editor/plugins/ToggleDir
	// summary:
	//		This plugin is used to toggle direction of the edited document,
	//		independent of what direction the whole page is.


	kernel.experimental("dijit._editor.plugins.ToggleDir");

	var ToggleDir = declare("dijit._editor.plugins.ToggleDir", _Plugin, {
		// summary:
		//		This plugin is used to toggle direction of the edited document,
		//		independent of what direction the whole page is.

		// Override _Plugin.useDefaultCommand: processing is done in this plugin
		// rather than by sending commands to the Editor
		useDefaultCommand: false,

		command: "toggleDir",

		// Override _Plugin.buttonClass to use a ToggleButton for this plugin rather than a vanilla Button
		buttonClass: ToggleButton,

		_initButton: function(){
			// Override _Plugin._initButton() to setup handler for button click events.
			this.inherited(arguments);
			this.editor.onLoadDeferred.addCallback(lang.hitch(this, function(){
				var editDoc = this.editor.editorObject.contentWindow.document.documentElement;
				//IE direction has to toggle on the body, not document itself.
				//If you toggle just the document, things get very strange in the
				//view.  But, the nice thing is this works for all supported browsers.
				editDoc = editDoc.getElementsByTagName("body")[0];
				var isLtr = domStyle.getComputedStyle(editDoc).direction == "ltr";
				this.button.set("checked", !isLtr);
				this.connect(this.button, "onChange", "_setRtl");
			}));
		},

		updateState: function(){
			// summary:
			//		Over-ride for button state control for disabled to work.
			this.button.set("disabled", this.get("disabled"));
		},

		_setRtl: function(rtl){
			// summary:
			//		Handler for button click events, to switch the text direction of the editor
			var dir = "ltr";
			if(rtl){
				dir = "rtl";
			}
			var editDoc = this.editor.editorObject.contentWindow.document.documentElement;
			editDoc = editDoc.getElementsByTagName("body")[0];
			editDoc.dir/*html node*/ = dir;
		}
	});

	// Register this plugin.
	connect.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
		if(o.plugin){ return; }
		switch(o.args.name){
		case "toggleDir":
			o.plugin = new ToggleDir({command: o.args.name});
		}
	});


	return ToggleDir;
});
