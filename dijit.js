define([
  "dojo",
  ".",
  "./_base",
  "dojo/parser",
  "./_Widget",
  "./_TemplatedMixin",
  "./_Container",
  "./layout/_LayoutWidget",
  "./form/_FormWidget"], function(dojo, dijit) {
	//  module:
	//    dijit/dijit
	//  summary:
	//		TODOC
	// 


/*=====
dijit.dijit = {
	// summary:
	//		A roll-up for common dijit methods
	// description:
	//	A rollup file for the build system including the core and common
	//	dijit files.
	//
	// example:
	// | <script type="text/javascript" src="js/dojo/dijit/dijit.js"></script>
	//
};
=====*/

// All the stuff in _base (these are the function that are guaranteed available without an explicit dojo.require)

// And some other stuff that we tend to pull in all the time anyway


return dijit;
});
