define([
	"dojo/_base/kernel",
	".",
	"./_Widget",
	"./_KeyNavContainer",
	"./_TemplatedMixin",
	"dojo/_base/connect", // dojo.keys.LEFT_ARROW dojo.keys.RIGHT_ARROW
	"dojo/_base/declare" // dojo.declare
], function(dojo, dijit){

	// module:
	//		dijit/Toolbar
	// summary:
	//		A Toolbar widget, used to hold things like `dijit.Editor` buttons

	dojo.declare("dijit.Toolbar", [dijit._Widget, dijit._TemplatedMixin, dijit._KeyNavContainer], {
		// summary:
		//		A Toolbar widget, used to hold things like `dijit.Editor` buttons

		templateString:
			'<div class="dijit" role="toolbar" tabIndex="${tabIndex}" dojoAttachPoint="containerNode">' +
			'</div>',

		baseClass: "dijitToolbar",

		postCreate: function(){
			this.inherited(arguments);

			this.connectKeyNavHandlers(
				this.isLeftToRight() ? [dojo.keys.LEFT_ARROW] : [dojo.keys.RIGHT_ARROW],
				this.isLeftToRight() ? [dojo.keys.RIGHT_ARROW] : [dojo.keys.LEFT_ARROW]
			);
		}
	});

	return dijit.Toolbar;
});

// Back compat w/1.6, remove for 2.0
if(window.dojo && !window.dojo.isAsync){
	require(["dijit/ToolbarSeparator"], function(){});
}