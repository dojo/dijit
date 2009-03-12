dojo.provide("dijit.tests.module");

try{
	// _base tests
	doh.registerUrl("dijit.tests._base.manager", dojo.moduleUrl("dijit", "tests/_base/manager.html"));
	doh.registerUrl("dijit.tests._base.sniffQuirks", dojo.moduleUrl("dijit", "tests/_base/sniffQuirks.html"));
	doh.registerUrl("dijit.tests._base.sniffStandards", dojo.moduleUrl("dijit", "tests/_base/sniffStandards.html"));
	doh.registerUrl("dijit.tests._base.viewport", dojo.moduleUrl("dijit", "tests/_base/viewport.html"));
	doh.registerUrl("dijit.tests._base.viewportStrict", dojo.moduleUrl("dijit", "tests/_base/viewportStrict.html"));
	doh.registerUrl("dijit.tests._base.scroll", dojo.moduleUrl("dijit", "tests/_base/test_scroll.html"), 20000);
	doh.registerUrl("dijit.tests._base.wai", dojo.moduleUrl("dijit", "tests/_base/wai.html"));
	doh.registerUrl("dijit.tests._base.place", dojo.moduleUrl("dijit", "tests/_base/place.html"));

	// _Widget
	doh.registerUrl("dijit.tests.ondijitclick", dojo.moduleUrl("dijit", "tests/ondijitclick.html"));
	doh.registerUrl("dijit.tests.attr", dojo.moduleUrl("dijit", "tests/attr.html"));
	doh.registerUrl("dijit.tests.Widget-placeAt", dojo.moduleUrl("dijit", "tests/Widget-placeAt.html"));

	// other infrastructure tests
	doh.registerUrl("dijit.tests._Templated", dojo.moduleUrl("dijit", "tests/_Templated.html"));
	doh.registerUrl("dijit.tests.widgetsInTemplate", dojo.moduleUrl("dijit", "tests/widgetsInTemplate.html"));
	doh.registerUrl("dijit.tests.Container", dojo.moduleUrl("dijit", "tests/Container.html"));

	// form tests
	doh.registerUrl("dijit.tests.form.Form", dojo.moduleUrl("dijit", "tests/form/Form.html"));

	// layout tests
	doh.registerUrl("dijit.tests.layout.ContentPane", dojo.moduleUrl("dijit", "tests/layout/ContentPane.html"), 30000);
	doh.registerUrl("dijit.tests.layout.AccordionContainer", dojo.moduleUrl("dijit", "tests/layout/AccordionContainer.html"), 30000);
	doh.registerUrl("dijit.tests.layout.StackContainer", dojo.moduleUrl("dijit", "tests/layout/nestedStack.html"));
}catch(e){
	doh.debug(e);
}


