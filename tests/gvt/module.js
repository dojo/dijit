dojo.provide("dijit.tests.gvt.module");

try{
	if(dojo.isBrowser){
		doh.registerUrl("dijit.tests.gvt.currency", dojo.moduleUrl("dijit", "tests/gvt/currency.html"));
		doh.registerUrl("dijit.tests.gvt.date", dojo.moduleUrl("dijit", "tests/gvt/date.html"));
		doh.registerUrl("dijit.tests.gvt.number", dojo.moduleUrl("dijit", "tests/gvt/number.html"));
		doh.registerUrl("dijit.tests.gvt.textbox", dojo.moduleUrl("dijit", "tests/gvt/textbox.html"));
		doh.registerUrl("dijit.tests.gvt.time", dojo.moduleUrl("dijit", "tests/gvt/time.html"));
	}
}catch(e){
	doh.debug(e);
}
