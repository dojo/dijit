define(["dojo", "..", "dojo/window"], function(dojo, dijit) {
	// module:
	//		dijit/_base/scroll
	// summary:
	//		TODOC

dijit.scrollIntoView = function(/*DomNode*/ node, /*Object?*/ pos){
	// summary:
	//		Scroll the passed node into view, if it is not already.
	//		Deprecated, use `dojo.window.scrollIntoView` instead.

	dojo.window.scrollIntoView(node, pos);
};


return dijit.scrollIntoView;
});
