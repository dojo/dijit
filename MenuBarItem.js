define("dijit/MenuBarItem", ["dojo", "dijit", "text!dijit/templates/MenuBarItem.html", "dijit/MenuItem"], function(dojo, dijit) {

dojo.declare("dijit._MenuBarItemMixin", null, {
	templateString: dojo.cache("dijit", "templates/MenuBarItem.html"),

	// Map widget attributes to DOMNode attributes.
	_mapIconClassAttr: null	// overriding MenuItem because we don't have a place for an icon
});

dojo.declare("dijit.MenuBarItem", [dijit.MenuItem, dijit._MenuBarItemMixin], {
	// summary:
	//		Item in a MenuBar that's clickable, and doesn't spawn a submenu when pressed (or hovered)

});


return dijit.MenuBarItem;
});
