define([
	"dojo/_base/kernel", // kernel.deprecated
	"..",
	"./ContentPane",
	"dojo/_base/declare" // declare
], function(kernel, dijit, ContentPane, declare){

/*=====
	var declare = dojo.declare;
	var ContentPane = dijit.layout.ContentPane;
=====*/

	// module:
	//		dijit/layout/AccordionPane
	// summary:
	//		Deprecated widget.   Use `dijit.layout.ContentPane` instead.

	return declare("dijit.layout.AccordionPane", ContentPane, {
		// summary:
		//		Deprecated widget.   Use `dijit.layout.ContentPane` instead.
		// tags:
		//		deprecated

		constructor: function(){
			kernel.deprecated("dijit.layout.AccordionPane deprecated, use ContentPane instead", "", "2.0");
		},

		onSelected: function(){
			// summary:
			//		called when this pane is selected
		}
	});
});
