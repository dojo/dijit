dojo.provide("dijit.tests.module");

try{
	dojo.require("dijit.tests._base.manager");
	doh.registerUrl("dijit.tests._base.sniffQuirks", dojo.moduleUrl("dijit", "tests/_base/sniffQuirks.html"));
	doh.registerUrl("dijit.tests._base.sniffStandards", dojo.moduleUrl("dijit", "tests/_base/sniffStandards.html"));
	dojo.require("dijit.tests._base.viewport");
	dojo.require("dijit.tests._base.wai");

	dojo.require("dijit.tests._Templated");
	dojo.require("dijit.tests.widgetsInTemplate");
	dojo.require("dijit.tests.Container");
	dojo.require("dijit.tests.layout.ContentPane");
	dojo.require("dijit.tests.ondijitclick");
	dojo.require("dijit.tests.form.Form");
}catch(e){
	doh.debug(e);
}


