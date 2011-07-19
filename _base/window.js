define([
	"..",
	"dojo/window" // dojo.window.get
], function(dijit, window){
	// module:
	//		dijit/_base/window
	// summary:
	//		Back compatibility module, new code should use dojo/window directly instead of using this module.

	dijit.getDocumentWindow = function(doc){
		return window.get(doc);
	};
});
