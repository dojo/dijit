dojo.provide("dijit.robot");
dojo.require("dojo.robot");
dojo.require("dijit._base.scroll");

dojo.mixin(doh.robot,{

	// users who use doh+dojo+dijit get the added convenience of scrollIntoView
	// automatically firing when they try to move the mouse to an element

	// TODO: remove post 1.2 when scrollIntoView moves into Dojo core
	_scrollIntoView : dijit.scrollIntoView
});
