dojo.provide("dijit._editor.plugins.LinkDialog");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._editor._Plugin");
dojo.require("dijit.Dialog");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.ValidationTextbox");

dojo.declare("dijit._editor.plugins.DualStateDropDownButton",
	dijit.form.DropDownButton,
	{
		// summary: a DropDownButton but button can be displayed in two states (checked or unchecked)
		setChecked: dijit.form.ToggleButton.prototype.setChecked
	}
);

dojo.declare("dijit._editor.plugins.LinkDialog", 
	[ dijit._editor._Plugin, dijit._Widget ],  
	function(){
		var _this = this;
		this.dropDown = new dijit.TooltipDialog({
			title: "link url", // FIxmE: i18n
			execute: dojo.hitch(this, "setValue"),
			onOpen: function(){
				dijit.TooltipDialog.prototype.onOpen.apply(this, arguments);
				_this._onOpenDialog();
			},
			onClose: dojo.hitch(this, "_onCloseDialog")
		});
		this.dropDown.setContent(this.linkDialogTemplate);
		this.dropDown.startup();
	},
	{
		buttonClass: dijit._editor.plugins.DualStateDropDownButton,

		linkDialogTemplate: [
			"<label for='urlInput'>url:&nbsp;</label><input dojoType=dijit.form.ValidationTextbox name='urlInput' id='urlInput' required=true>",
			"<br>",
			"<button dojoType=dijit.form.Button type='submit'>Set</button>"
		].join(""),

		useDefaultCommand: false,

		command: "createLink",

		dropDown: null,

		setValue: function(args){
			// summary: callback from the dialog when user hits "set" button
			this._onCloseDialog();
			this.editor.execCommand(this.command, args.urlInput);
		},

		_savedSelection: null,
		_onCloseDialog: function(){
			// FIXME: IE is really messed up here!!
			if(dojo.isIE){
				this.editor.focus();
				var range = this.editor.document.selection.createRange();
				range.moveToBookmark(this._savedSelection);
				range.select();
				this._savedSelection = null;
			}
		},
		_onOpenDialog: function(){
			// FIXME: IE is *really* b0rken
			if(dojo.isIE){
				var range = this.editor.document.selection.createRange();
				this._savedSelection = range.getBookmark();
			}
			//dijit.focus(this.urlInput);
			// TODO: if there's an existing link when we click this, should suck the
			// information about that link and prepopulate the dialog
		},

		updateState: function(){
			// summary: change shading on button if we are over a link (or not)
			if(!this._lastUpdate){
				this._lastUpdate = new Date();
			}else{
				if(((new Date())-this._lastUpdate) < this.updateInterval){
					return;
				}
			}
			var _e = this.editor;
			if(!_e){ return; }
			if(!_e.isLoaded){ return; }
			if(this.button){
				try{
					var enabled = _e.queryCommandEnabled("createlink");
					//this.button.setDisabled(!enabled);
					if(this.button.setChecked){
						// display button differently if there is an existing link associated with the current selection
						var checked = !!dojo.withGlobal(this.editor.window, "getAncestorElement",dijit._editor.selection, ['a']);
						this.button.setChecked(checked);
					}
				}catch(e){
					console.debug(e);
				}
			}
			this._lastUpdate = new Date();
		}
	}
);
