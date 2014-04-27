define([
	"dojo/_base/declare", // declare
	"dojo/keys", // keys
	"dojo/text!./templates/Menu.html",
	"./_MenuBase"
], function(declare, keys, template, _MenuBase){

	// module:
	//		dijit/DropDownMenu

	return declare("dijit.DropDownMenu", _MenuBase, {
		// summary:
		//		A menu, without features for context menu (Meaning, drop down menu)

		templateString: template,

		baseClass: "dijitMenu",

		// Arrow key navigation
		_onUpArrow: function(){
			this.focusPrev();
		},
		_onDownArrow: function(){
			this.focusNext();
		},
		_onRightArrow: function(/*Event*/ evt){
			// Bidi Support
			if(!this.isLeftToRight()){
				this._onLeftArrow();
			}else{
				this._moveToPopup(evt);
				evt.stopPropagation();
				evt.preventDefault();
			}
		},
		_onLeftArrow: function(/*Event*/ evt){
			// Bidi Support
			if(!this.isLeftToRight()){
				this._onRightArrow();
			}else{
			if(this.parentMenu){
				if(this.parentMenu._isMenuBar){
					this.parentMenu.focusPrev();
				}else{
					this.onCancel(false);
				}
			}else{
				evt.stopPropagation();
				evt.preventDefault();
			}
		    }
		}
	});
});
