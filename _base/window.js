define([
	"..",
	"dojo/window" // windowUtils.get
], function(dijit, windowUtils){
	// module:
	//		dijit/_base/window
	// summary:
	//		Back compatibility module, new code should use windowUtils directly instead of using this module.

	dijit.getDocumentWindow = function(doc){
		return windowUtils.get(doc);
	};
});
