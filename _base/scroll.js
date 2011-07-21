define([
	"..",
	"dojo/window" // windowUtils.scrollIntoView
], function(dijit, windowUtils){
	// module:
	//		dijit/_base/scroll
	// summary:
	//		Back compatibility module, new code should use windowUtils directly instead of using this module.

	dijit.scrollIntoView = function(/*DomNode*/ node, /*Object?*/ pos){
		// summary:
		//		Scroll the passed node into view, if it is not already.
		//		Deprecated, use `windowUtils.scrollIntoView` instead.

		windowUtils.scrollIntoView(node, pos);
	};

	return dijit.scrollIntoView;
});
