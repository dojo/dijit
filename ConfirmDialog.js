define([
	"../dojo/_base/declare",
	"./Dialog",
	"./_WidgetsInTemplateMixin",
	"dojo/i18n!./nls/common",
	"dojo/text!./templates/ConfirmDialog.html",
	"./form/Button"		// used by template
], function(declare, Dialog, _WidgetsInTemplateMixin, strings, template) {

	return declare("dijit/ConfirmDialog", [Dialog, _WidgetsInTemplateMixin], {
		// summary:
		//		A Dialog with OK/Cancel buttons.

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
