dojo.provide("dijit.tests.layout.module");

try{
	doh.registerUrl("dijit.tests.layout.ContentPane", dojo.moduleUrl("dijit", "tests/layout/ContentPane.html"), 99999999);
	doh.registerUrl("dijit.tests.layout.ContentPaneLayout", dojo.moduleUrl("dijit", "tests/layout/ContentPaneLayout.html"), 99999999);

	doh.registerUrl("dijit.tests.layout.robot.GUI", dojo.moduleUrl("dijit","tests/layout/robot/GUI.html"), 99999999);

	doh.registerUrl("dijit.tests.layout.LayoutContainer", dojo.moduleUrl("dijit", "tests/layout/LayoutContainer.html"), 99999999);

	doh.registerUrl("dijit.tests.layout.NestedStackContainer", dojo.moduleUrl("dijit", "tests/layout/nestedStack.html"), 99999999); 
	doh.registerUrl("dijit.tests.layout.robot.StackContainer_mouse", dojo.moduleUrl("dijit", "tests/layout/robot/StackContainer_mouse.html"), 99999999); 

	doh.registerUrl("dijit.tests.layout.TabContainer", dojo.moduleUrl("dijit", "tests/layout/TabContainer.html"), 99999999);
	doh.registerUrl("dijit.tests.layout.robot.TabContainer_a11y", dojo.moduleUrl("dijit","tests/layout/robot/TabContainer_a11y.html"), 99999999);
	doh.registerUrl("dijit.tests.layout.robot.TabContainer_mouse", dojo.moduleUrl("dijit","tests/layout/robot/TabContainer_mouse.html"), 99999999);
	doh.registerUrl("dijit.tests.layout.robot.TabContainer_noLayout", dojo.moduleUrl("dijit","tests/layout/robot/TabContainer_noLayout.html"), 99999999);
	doh.registerUrl("dijit.tests.layout.TabContainer-remote", dojo.moduleUrl("dijit","tests/layout/TabContainer-remote.html"), 99999999);
	doh.registerUrl("dijit.tests.layout.TabContainerTitlePane", dojo.moduleUrl("dijit","tests/layout/TabContainerTitlePane.html"), 99999999);
	
	doh.registerUrl("dijit.tests.layout.AccordionContainer", dojo.moduleUrl("dijit", "tests/layout/AccordionContainer.html"), 99999999);
	doh.registerUrl("dijit.tests.layout.robot.AccordionContainer_a11y", dojo.moduleUrl("dijit","tests/layout/robot/AccordionContainer_a11y.html"), 99999999);
	doh.registerUrl("dijit.tests.layout.robot.AccordionContainer_mouse", dojo.moduleUrl("dijit","tests/layout/robot/AccordionContainer_mouse.html"), 99999999);

	doh.registerUrl("dijit.tests.layout.robot.BorderContainer", dojo.moduleUrl("dijit", "tests/layout/robot/BorderContainer.html"), 99999999); 
	doh.registerUrl("dijit.tests.layout.robot.BorderContainer_full", dojo.moduleUrl("dijit", "tests/layout/robot/BorderContainer_full.html"), 99999999); 
	doh.registerUrl("dijit.tests.layout.robot.BorderContainer_complex", dojo.moduleUrl("dijit", "tests/layout/robot/BorderContainer_complex.html"), 99999999); 

	doh.registerUrl("dijit.tests.layout.robot.BorderContainer_nested", dojo.moduleUrl("dijit", "tests/layout/robot/BorderContainer_nested.html"), 99999999); 
}catch(e){
	doh.debug(e);
}
