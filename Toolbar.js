dojo.provide("dijit.Toolbar");

dojo.require("dijit._Widget");
dojo.require("dijit._Container");
dojo.require("dijit._Templated");

dojo.declare(
	"dijit.Toolbar",
	[dijit._Widget, dijit._Templated, dijit._Container],
{
	templateString:
		'<div class="dijit dijitToolbar" waiRole="toolbar" dojoAttachPoint="containerNode">' +
//			'<table style="table-layout: fixed" class="dijitReset dijitToolbarTable">' + // factor out style
//				'<tr class="dijitReset" dojoAttachPoint="containerNode"></tr>'+
//			'</table>' +
		'</div>'
}
);

// Combine with dijit.MenuSeparator??
dojo.declare(
	"dijit.ToolbarSeparator",
	[dijit._Widget, dijit._Templated, dijit._Contained],
{
	// summary
	//	A line between two menu items

	templateString: '<span class="dijiToolbarSeparator"></span>',

	postCreate: function(){
		dijit._disableSelection(this.domNode);
	}
});
