dojo.provide("dijit.tests.robotTests");

try{
if(dojo.isBrowser){
	var userArgs = window.location.search.replace(/[\?&](dojoUrl|testUrl|testModule)=[^&]*/g,"").replace(/^&/,"?");
	
	// form widget tests
	doh.registerUrl("dijit/tests/form/robot/test_ComboBox.html", dojo.moduleUrl("dijit","tests/form/robot/_autoComplete.html"+(userArgs+"&testWidget=dijit.form.ComboBox").replace(/^&/,"?")), 99999999);
	doh.registerUrl("dijit/tests/form/robot/test_FilteringSelect.html", dojo.moduleUrl("dijit","tests/form/robot/_autoComplete.html"+(userArgs+"&testWidget=dijit.form.FilteringSelect").replace(/^&/,"?")), 99999999);
	doh.registerUrl("dijit/tests/form/robot/test_Slider.html", dojo.moduleUrl("dijit","tests/form/robot/test_Slider.html"+userArgs), 99999999);
	doh.registerUrl("dijit/tests/form/robot/test_Spinner.html", dojo.moduleUrl("dijit","tests/form/robot/test_Spinner.html"+userArgs), 99999999);
	doh.registerUrl("dijit/tests/form/robot/test_validate.html", dojo.moduleUrl("dijit","tests/form/robot/test_validate.html"+userArgs), 99999999);
	
	// top level widget tests
	doh.registerUrl("dijit/tests/robot/test_Tree.html", dojo.moduleUrl("dijit","tests/robot/test_Tree.html"+userArgs), 99999999);
	doh.registerUrl("dijit/tests/robot/test_Menu.html", dojo.moduleUrl("dijit","tests/robot/test_Menu.html"+userArgs), 99999999);
}
}catch(e){
	doh.debug(e);
}
