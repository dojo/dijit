dojo.provide("dijit.tests.form.module");

try{
	var userArgs = window.location.search.replace(/[\?&](dojoUrl|testUrl|testModule)=[^&]*/g,"").replace(/^&/,"?");

	doh.registerUrl("dijit.tests.form.robot.Button_mouse", dojo.moduleUrl("dijit","tests/form/robot/Button_mouse.html"+userArgs), 99999999);
	doh.registerUrl("dijit.tests.form.robot.Button_a11y", dojo.moduleUrl("dijit","tests/form/robot/Button_a11y.html"+userArgs), 99999999);

	doh.registerUrl("dijit.tests.form.robot.test_validate", dojo.moduleUrl("dijit","tests/form/robot/test_validate.html"+userArgs), 99999999);

	doh.registerUrl("dijit.tests.form.robot.DateTextBox", dojo.moduleUrl("dijit","tests/form/robot/DateTextBox.html"+userArgs), 99999999);
	doh.registerUrl("dijit.tests.form.robot.TimeTextBox", dojo.moduleUrl("dijit","tests/form/robot/TimeTextBox.html"+userArgs), 99999999);

	doh.registerUrl("dijit.tests.form.Form", dojo.moduleUrl("dijit", "tests/form/Form.html"), 99999999);
	doh.registerUrl("dijit.tests.form.robot.Form", dojo.moduleUrl("dijit","tests/form/robot/Form.html"+userArgs), 99999999);

	doh.registerUrl("dijit.tests.form.Select", dojo.moduleUrl("dijit", "tests/form/test_Select.html"));

	doh.registerUrl("dijit.tests.form.robot.ComboBox_mouse", dojo.moduleUrl("dijit","tests/form/robot/_autoComplete_mouse.html"+(userArgs+"&testWidget=dijit.form.ComboBox").replace(/^&/,"?")), 99999999);
	doh.registerUrl("dijit.tests.form.robot.ComboBox_a11y", dojo.moduleUrl("dijit","tests/form/robot/_autoComplete_a11y.html"+(userArgs+"&testWidget=dijit.form.ComboBox").replace(/^&/,"?")), 99999999);

	doh.registerUrl("dijit.tests.form.robot.FilteringSelect_mouse", dojo.moduleUrl("dijit","tests/form/robot/_autoComplete_mouse.html"+(userArgs+"&testWidget=dijit.form.FilteringSelect").replace(/^&/,"?")), 99999999);
	doh.registerUrl("dijit.tests.form.robot.FilteringSelect_a11y", dojo.moduleUrl("dijit","tests/form/robot/_autoComplete_a11y.html"+(userArgs+"&testWidget=dijit.form.FilteringSelect").replace(/^&/,"?")), 99999999);

	doh.registerUrl("dijit.tests.form.robot.Slider_mouse", dojo.moduleUrl("dijit","tests/form/robot/Slider_mouse.html"+userArgs), 99999999);
	doh.registerUrl("dijit.tests.form.robot.Slider_a11y", dojo.moduleUrl("dijit","tests/form/robot/Slider_a11y.html"+userArgs), 99999999);

	doh.registerUrl("dijit.tests.form.robot.Spinner_mouse", dojo.moduleUrl("dijit","tests/form/robot/Spinner_mouse.html"+userArgs), 99999999);
	doh.registerUrl("dijit.tests.form.robot.Spinner_a11y", dojo.moduleUrl("dijit","tests/form/robot/Spinner_a11y.html"+userArgs), 99999999);

	doh.registerUrl("dijit.tests.form.CheckBox", dojo.moduleUrl("dijit", "tests/form/test_CheckBox.html"));

	doh.registerUrl("dijit.tests.form.robot.validationMessages", dojo.moduleUrl("dijit","tests/form/robot/validationMessages.html"+userArgs), 99999999);

	doh.registerUrl("dijit.tests.form.TextBox.tundra.ltr", dojo.moduleUrl("dijit", "tests/form/TextBox_sizes.html?theme=tundra&dir=ltr"));
	doh.registerUrl("dijit.tests.form.TextBox.tundra.rtl", dojo.moduleUrl("dijit", "tests/form/TextBox_sizes.html?theme=tundra&dir=rtl"));
	doh.registerUrl("dijit.tests.form.TextBox.tundra.quirks", dojo.moduleUrl("dijit", "tests/quirks.html?file=form/TextBox_sizes.html&theme=tundra&dir=ltr"));
	doh.registerUrl("dijit.tests.form.TextBox.claro.ltr", dojo.moduleUrl("dijit", "tests/form/TextBox_sizes.html?theme=claro&dir=ltr"));
	doh.registerUrl("dijit.tests.form.TextBox.claro.rtl", dojo.moduleUrl("dijit", "tests/form/TextBox_sizes.html?theme=claro&dir=rtl"));
	doh.registerUrl("dijit.tests.form.TextBox.claro.quirks", dojo.moduleUrl("dijit", "tests/quirks.html?file=form/TextBox_sizes.html&theme=claro&dir=ltr"));
	doh.registerUrl("dijit.tests.form.TextBox.soria.ltr", dojo.moduleUrl("dijit", "tests/form/TextBox_sizes.html?theme=soria&dir=ltr"));
	doh.registerUrl("dijit.tests.form.TextBox.soria.rtl", dojo.moduleUrl("dijit", "tests/form/TextBox_sizes.html?theme=soria&dir=rtl"));
	doh.registerUrl("dijit.tests.form.TextBox.soria.quirks", dojo.moduleUrl("dijit", "tests/quirks.html?file=form/TextBox_sizes.html&theme=soria&dir=ltr"));
	doh.registerUrl("dijit.tests.form.TextBox.nihilo.ltr", dojo.moduleUrl("dijit", "tests/form/TextBox_sizes.html?theme=nihilo&dir=ltr"));
	doh.registerUrl("dijit.tests.form.TextBox.nihilo.rtl", dojo.moduleUrl("dijit", "tests/form/TextBox_sizes.html?theme=nihilo&dir=rtl"));
	doh.registerUrl("dijit.tests.form.TextBox.nihilo.quirks", dojo.moduleUrl("dijit", "tests/quirks.html?file=form/TextBox_sizes.html&theme=nihilo&dir=ltr"));
	/* is there a UI contract that a11y textbox widgets have consistent heights and widths?
	doh.registerUrl("dijit.tests.form.TextBox.a11y.ltr", dojo.moduleUrl("dijit", "tests/form/TextBox_sizes.html?a11y=1&dir=ltr"));
	doh.registerUrl("dijit.tests.form.TextBox.a11y.rtl", dojo.moduleUrl("dijit", "tests/form/TextBox_sizes.html?a11y=1&dir=rtl"));
	doh.registerUrl("dijit.tests.form.TextBox.a11y.quirks", dojo.moduleUrl("dijit", "tests/quirks.html?file=form/TextBox_sizes.html&a11y=1&dir=ltr"));
	*/
}catch(e){
	doh.debug(e);
}
