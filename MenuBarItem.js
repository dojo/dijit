define([
  "dojo",
  ".",
  "dojo/text!./templates/MenuBarItem.html",
  "./MenuItem"], function(dojo, dijit) {
	// module:
	//		dijit/MenuBarItem
	// summary:
	//		TODOC


dojo.declare("dijit._MenuBarItemMixin", null, {
	templateString: dojo.cache("dijit", "templates/MenuBarItem.html"),

	// Map widget attributes to DOMNode attributes.
	_setIconClassAttr: null	// cancel MenuItem setter because we don't have a place for an icon
});

dojo.declare("dijit.MenuBarItem", [dijit.MenuItem, dijit._MenuBarItemMixin], {
	// summary:
	//		Item in a MenuBar that's clickable, and doesn't spawn a submenu when pressed (or hovered)

});


return dijit.MenuBarItem;
});
