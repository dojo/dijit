dojo.provide("dijit.tests.module");

try{
	var userArgs = window.location.search.replace(/[\?&](dojoUrl|testUrl|testModule)=[^&]*/g,"").replace(/^&/,"?");

	// Safari 3 doesn't support focus on nodes like <div>, so keyboard isn't supported there...
	// Safari 4 almost works, but has problems with shift-tab (#8987) and ESC (#9506).
	// Enable tests when those bugs are fixed.
	var test_a11y = dojo.isFF || dojo.isIE;
	
	var test_robot = true;

	// _base tests
	doh.registerUrl("dijit.tests._base.manager", dojo.moduleUrl("dijit", "tests/_base/manager.html"));
	doh.registerUrl("dijit.tests._base.tabindex", dojo.moduleUrl("dijit", "tests/_base/tabindex.html"));
	doh.registerUrl("dijit.tests._base.sniffQuirks", dojo.moduleUrl("dijit", "tests/_base/sniffQuirks.html"));
	doh.registerUrl("dijit.tests._base.sniffStandards", dojo.moduleUrl("dijit", "tests/_base/sniffStandards.html"));
	doh.registerUrl("dijit.tests._base.viewport", dojo.moduleUrl("dijit", "tests/_base/viewport.html"));
	doh.registerUrl("dijit.tests._base.viewportQuirks", dojo.moduleUrl("dijit", "tests/_base/viewportQuirks.html"));
	doh.registerUrl("dijit.tests._base.scroll", dojo.moduleUrl("dijit", "tests/_base/test_scroll.html"), 20000);
	doh.registerUrl("dijit.tests._base.wai", dojo.moduleUrl("dijit", "tests/_base/wai.html"));
	doh.registerUrl("dijit.tests._base.place", dojo.moduleUrl("dijit", "tests/_base/place.html"));
	if(test_robot){
		doh.registerUrl("dijit.tests._base.robot.FocusManager", dojo.moduleUrl("dijit","tests/_base/robot/FocusManager.html"), 99999999);
		doh.registerUrl("dijit.tests._base.robot.focus_mouse", dojo.moduleUrl("dijit","tests/_base/robot/focus_mouse.html"), 99999999);
	}

	// _Widget
	doh.registerUrl("dijit.tests._Widget-lifecycle", dojo.moduleUrl("dijit", "tests/_Widget-lifecycle.html"));
	doh.registerUrl("dijit.tests._Widget-attr", dojo.moduleUrl("dijit", "tests/_Widget-attr.html"));
	doh.registerUrl("dijit.tests._Widget-subscribe", dojo.moduleUrl("dijit", "tests/_Widget-subscribe.html"));
	doh.registerUrl("dijit.tests.Widget-placeAt", dojo.moduleUrl("dijit", "tests/Widget-placeAt.html"));
	if(test_robot){
		doh.registerUrl("dijit.tests.robot._Widget-deferredConnect", dojo.moduleUrl("dijit","tests/robot/_Widget-deferredConnect.html"), 99999999);
		doh.registerUrl("dijit.tests.robot._Widget-ondijitclick_mouse", dojo.moduleUrl("dijit","tests/robot/_Widget-ondijitclick_mouse.html"), 99999999);
	}
	if(test_a11y){
		doh.registerUrl("dijit.tests.robot._Widget-ondijitclick_a11y", dojo.moduleUrl("dijit","tests/robot/_Widget-ondijitclick_a11y.html"), 99999999);
	}

	// _Templated and other base classes
	doh.registerUrl("dijit.tests._Templated", dojo.moduleUrl("dijit", "tests/_Templated.html"));
	doh.registerUrl("dijit.tests._Templated-widgetsInTemplate", dojo.moduleUrl("dijit", "tests/_Templated-widgetsInTemplate.html"));
	doh.registerUrl("dijit.tests._Container", dojo.moduleUrl("dijit", "tests/_Container.html"));

	// top level widget tests
	if(test_robot){
		doh.registerUrl("dijit.tests.robot.Menu_mouse", dojo.moduleUrl("dijit","tests/robot/Menu_mouse.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.robot.Dialog_mouse", dojo.moduleUrl("dijit","tests/robot/Dialog_mouse.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.robot.Tooltip_mouse", dojo.moduleUrl("dijit","tests/robot/Tooltip_mouse.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.robot.InlineEditBox_mouse", dojo.moduleUrl("dijit","tests/robot/InlineEditBox_mouse.html"+userArgs), 99999999);
		if(test_a11y){
			doh.registerUrl("dijit.tests.robot.Menu_a11y", dojo.moduleUrl("dijit","tests/robot/Menu_a11y.html"+userArgs), 99999999);
			doh.registerUrl("dijit.tests.robot.Dialog_a11y", dojo.moduleUrl("dijit","tests/robot/Dialog_a11y.html"+userArgs), 99999999);
			doh.registerUrl("dijit.tests.robot.Tooltip_a11y", dojo.moduleUrl("dijit","tests/robot/Tooltip_a11y.html"+userArgs), 99999999);
		}
	}

	// tree tests
	doh.registerUrl("dijit.tests.Tree", dojo.moduleUrl("dijit", "tests/Tree.html"));
	doh.registerUrl("dijit.tests.Tree_with_JRS", dojo.moduleUrl("dijit", "tests/Tree_with_JRS.html"));
	if(test_robot){
		doh.registerUrl("dijit.tests.robot.Tree_DnD", dojo.moduleUrl("dijit","tests/robot/Tree_dnd.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.robot.Tree_DnD_multiParent", dojo.moduleUrl("dijit","tests/robot/Tree_dnd_multiParent.html"+userArgs), 99999999);
		if(test_a11y){
			doh.registerUrl("dijit.tests.robot.Tree_a11y", dojo.moduleUrl("dijit","tests/robot/Tree_a11y.html"+userArgs), 99999999);
		}
	}

	// editor tests
	if(test_robot){
		doh.registerUrl("dijit.tests.editor.robot.Editor_mouse", dojo.moduleUrl("dijit","tests/editor/robot/Editor_mouse.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.editor.robot.EnterKeyHandling", dojo.moduleUrl("dijit","tests/editor/robot/EnterKeyHandling.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.editor.robot.FullScreen", dojo.moduleUrl("dijit","tests/editor/robot/Editor_FullScreen.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.editor.robot.ViewSource", dojo.moduleUrl("dijit","tests/editor/robot/Editor_ViewSource.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.editor.robot.NewPage", dojo.moduleUrl("dijit","tests/editor/robot/Editor_NewPage.html"+userArgs), 99999999);
		if(!dojo.isWebKit){
			// The back button on webkit is URL for the browser itself, restarting the entire test suite,
			// rather than just for the iframe holding the test file (BackForwardState.html and BackForwardStateHelper.html)
			doh.registerUrl("dijit.tests.editor.robot.BackForwardState", dojo.moduleUrl("dijit","tests/editor/robot/BackForwardState.html"+userArgs), 99999999);
		}
		if(test_a11y){
			doh.registerUrl("dijit.tests.editor.robot.Editor_a11y", dojo.moduleUrl("dijit","tests/editor/robot/Editor_a11y.html"+userArgs), 99999999);
		}
	}

	// form tests
	doh.registerUrl("dijit.tests.form.Form", dojo.moduleUrl("dijit", "tests/form/Form.html"));
	doh.registerUrl("dijit.tests.form.DropDownSelect", dojo.moduleUrl("dijit", "tests/form/test_DropDownSelect.html"));
	if(test_robot){
		doh.registerUrl("dijit.tests.form.robot.Button_mouse", dojo.moduleUrl("dijit","tests/form/robot/Button_mouse.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.form.robot.ComboBox_mouse", dojo.moduleUrl("dijit","tests/form/robot/_autoComplete_mouse.html"+(userArgs+"&testWidget=dijit.form.ComboBox").replace(/^&/,"?")), 99999999);
		doh.registerUrl("dijit.tests.form.robot.FilteringSelect_mouse", dojo.moduleUrl("dijit","tests/form/robot/_autoComplete_mouse.html"+(userArgs+"&testWidget=dijit.form.FilteringSelect").replace(/^&/,"?")), 99999999);
		doh.registerUrl("dijit.tests.form.robot.Slider_mouse", dojo.moduleUrl("dijit","tests/form/robot/Slider_mouse.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.form.robot.Spinner_mouse", dojo.moduleUrl("dijit","tests/form/robot/Spinner_mouse.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.form.robot.test_validate", dojo.moduleUrl("dijit","tests/form/robot/test_validate.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.form.robot.DateTextBox", dojo.moduleUrl("dijit","tests/form/robot/DateTextBox.html"+userArgs), 99999999);
		doh.registerUrl("dijit.tests.form.robot.Form", dojo.moduleUrl("dijit","tests/form/robot/Form.html"+userArgs), 99999999);
		if(test_a11y){
			doh.registerUrl("dijit.tests.form.robot.Button_a11y", dojo.moduleUrl("dijit","tests/form/robot/Button_a11y.html"+userArgs), 99999999);
			doh.registerUrl("dijit.tests.form.robot.ComboBox_a11y", dojo.moduleUrl("dijit","tests/form/robot/_autoComplete_a11y.html"+(userArgs+"&testWidget=dijit.form.ComboBox").replace(/^&/,"?")), 99999999);
			doh.registerUrl("dijit.tests.form.robot.FilteringSelect_a11y", dojo.moduleUrl("dijit","tests/form/robot/_autoComplete_a11y.html"+(userArgs+"&testWidget=dijit.form.FilteringSelect").replace(/^&/,"?")), 99999999);
			doh.registerUrl("dijit.tests.form.robot.Slider_a11y", dojo.moduleUrl("dijit","tests/form/robot/Slider_a11y.html"+userArgs), 99999999);
			doh.registerUrl("dijit.tests.form.robot.Spinner_a11y", dojo.moduleUrl("dijit","tests/form/robot/Spinner_a11y.html"+userArgs), 99999999);
		}
	}

	// layout tests
	doh.registerUrl("dijit.tests.layout.ContentPane", dojo.moduleUrl("dijit", "tests/layout/ContentPane.html"), 30000);
	doh.registerUrl("dijit.tests.layout.ContentPaneLayout", dojo.moduleUrl("dijit", "tests/layout/ContentPaneLayout.html"), 30000);
	doh.registerUrl("dijit.tests.layout.AccordionContainer", dojo.moduleUrl("dijit", "tests/layout/AccordionContainer.html"), 30000);
	doh.registerUrl("dijit.tests.layout.StackContainer", dojo.moduleUrl("dijit", "tests/layout/nestedStack.html"));
}catch(e){
	doh.debug(e);
}


