dojo.provide("dijit.form.VerticalRule");

dojo.require("dijit.form.HorizontalRule");

dojo.declare("dijit.form.VerticalRule", dijit.form.HorizontalRule,
{
	// summary:
	//		Hash marks for the VerticalSlider

	templateString: '<div class="dijitRuleContainer dijitRuleContainerV"></div>',
	_positionPrefix: '<div class="dijitRuleMark dijitRuleMarkV" style="top:',
	
	_isHorizontal: false
});

