dojo.provide("dijit.tests.layout.module");

try{
	doh.registerUrl("dijit.tests.layout.ContentPane", dojo.moduleUrl("dijit", "tests/layout/ContentPane.html"), 300000);
	doh.registerUrl("dijit.tests.layout.ContentPaneLayout", dojo.moduleUrl("dijit", "tests/layout/ContentPaneLayout.html"), 300000);
	doh.registerUrl("dijit.tests.layout.AccordionContainer", dojo.moduleUrl("dijit", "tests/layout/AccordionContainer.html"), 300000);
	doh.registerUrl("dijit.tests.layout.TabContainer", dojo.moduleUrl("dijit", "tests/layout/TabContainer.html"), 300000);
	doh.registerUrl("dijit.tests.layout.StackContainer", dojo.moduleUrl("dijit", "tests/layout/nestedStack.html"), 300000);
}catch(e){
	doh.debug(e);
}
