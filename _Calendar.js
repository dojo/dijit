define([
	"dojo/_base/kernel", // kernel.deprecated
	".",
	"./Calendar"
], function(kernel, dijit){

	// module:
	//		dijit/_Calendar
	// summary:
	//		Deprecated widget, used dijit/Calendar instead

	kernel.deprecated("dijit._Calendar is deprecated", "dijit._Calendar moved to dijit.Calendar", 1.5);

	// dijit._Calendar had an underscore all this time merely because it did
	// not satisfy dijit's a11y policy.
	dijit._Calendar = dijit.Calendar;

	return dijit._Calendar;
});
