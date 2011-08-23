define([
	"require",
	"dojo/_base/declare", // declare
	"dojo/keys", // keys.LEFT_ARROW keys.RIGHT_ARROW
	"./_Widget",
	"./_KeyNavContainer",
	"./_TemplatedMixin"
], function(require, declare, keys, _Widget, _KeyNavContainer, _TemplatedMixin){

/*=====
	var _Widget = dijit._Widget;
	var _KeyNavContainer = dijit._KeyNavContainer;
	var _TemplatedMixin = dijit._TemplatedMixin;
=====*/

	// module:
	//		dijit/Toolbar
	// summary:
	//		A Toolbar widget, used to hold things like `dijit.Editor` buttons


	// Back compat w/1.6, remove for 2.0
	if(dojo && dojo.ready && !dojo.isAsync){
		dojo.ready(0, function(){
			var requires = ["dijit/ToolbarSeparator"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	return declare("dijit.Toolbar", [_Widget, _TemplatedMixin, _KeyNavContainer], {
		// summary:
		//		A Toolbar widget, used to hold things like `dijit.Editor` buttons

		templateString:
			'<div class="dijit" role="toolbar" tabIndex="${tabIndex}" data-dojo-attach-point="containerNode">' +
			'</div>',

		baseClass: "dijitToolbar",

		postCreate: function(){
			this.inherited(arguments);

			this.connectKeyNavHandlers(
				this.isLeftToRight() ? [keys.LEFT_ARROW] : [keys.RIGHT_ARROW],
				this.isLeftToRight() ? [keys.RIGHT_ARROW] : [keys.LEFT_ARROW]
			);
		}
	});
});
