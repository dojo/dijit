define([
	"dojo",
	".",
	"dojo/text!./templates/MenuSeparator.html",
	"./_WidgetBase",
	"./_TemplatedMixin",
	"./_Contained"], function(dojo, dijit){

	// module:
	//		dijit/MenuSeparator
	// summary:
	//		A line between two menu items

	dojo.declare("dijit.MenuSeparator", [dijit._WidgetBase, dijit._TemplatedMixin, dijit._Contained], {
		// summary:
		//		A line between two menu items

		templateString: dojo.cache("dijit", "templates/MenuSeparator.html"),

		buildRendering: function(){
			this.inherited(arguments);
			dojo.setSelectable(this.domNode, false);
		},

		isFocusable: function(){
			// summary:
			//		Override to always return false
			// tags:
			//		protected

			return false; // Boolean
		}
	});

	return dijit.MenuSeparator;
});
