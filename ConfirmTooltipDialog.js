define([
	"../dojo/_base/declare",
	"./TooltipDialog",
	"./_WidgetsInTemplateMixin",
	"dojo/i18n!./nls/common",
	"dojo/text!./templates/ConfirmTooltipDialog.html",
	"./form/Button"		// used by template
], function(declare, TooltipDialog, _WidgetsInTemplateMixin, strings, template) {
	
	return declare("dijit/ConfirmTooltipDialog", [TooltipDialog, _WidgetsInTemplateMixin], {
		// summary:
		//		A TooltipDialog with OK/Cancel buttons.

		templateString: template,

		// buttonOk: String
		//		Label of OK button
		buttonOk: strings.buttonOk,
		_setButtonOkAttr: { node: "okButton", attribute: "label" },

		// buttonCancel: String
		//		Label of cancel button
		buttonCancel: strings.buttonCancel,
		_setButtonCancelAttr: { node: "cancelButton", attribute: "label" }
	});
});
