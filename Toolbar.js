dojo.provide("dijit.Toolbar");

dojo.require("dijit._Widget");
dojo.require("dijit._Container");
dojo.require("dijit._Templated");

dojo.declare(
	"dijit.Toolbar",
	[dijit._Widget, dijit._Templated, dijit._KeyNavContainer],
{
	templateString:
		'<div class="dijit dijitToolbar" waiRole="toolbar" tabIndex="${tabIndex}" dojoAttachPoint="containerNode">' +
//			'<table style="table-layout: fixed" class="dijitReset dijitToolbarTable">' + // factor out style
//				'<tr class="dijitReset" dojoAttachPoint="containerNode"></tr>'+
//			'</table>' +
		'</div>',

	tabIndex: "0",

	postCreate: function(){
		this.connectKeyNavHandlers([dojo.keys.LEFT_ARROW], [dojo.keys.RIGHT_ARROW]);
	},

	startup: function(){
		this.connectKeyNavChildren();
	}
}
);

// Combine with dijit.MenuSeparator??
dojo.declare(
	"dijit.ToolbarSeparator",
	[ dijit._Widget, dijit._Templated ],
{
	// summary
	//	A line between two menu items
	templateString: '<div class="dijitToolbarSeparator dijitInline"></div>',
	postCreate: function(){ dojo.setSelectable(this.domNode, false); }
});
