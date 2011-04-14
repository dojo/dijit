define(["dojo", "..", "dojo/window"], function(dojo, dijit) {
	//  module:
	//    dijit/_base/window
	//  summary:
	//		TODOC


dijit.getDocumentWindow = function(doc){
	return dojo.window.get(doc);
};


return dijit;
});
