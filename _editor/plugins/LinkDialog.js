dojo.provide("dijit._editor.plugins.LinkDialog");
dojo.require("dijit._editor._Plugin");
dojo.require("dijit.Dialog");
dojo.require("dijit._Templated");

dojo.declare("dijit._editor.plugins.LinkDialog", 
	[ dijit._editor._Plugin, dijit._Widget ],  
	function(){
		this._linkDialog = new dijit.layout.TooltipDialog({
			title: "link url" // FIxmE: i18n
		});
		// FIXME: this is totally torturned. _Templated should make this easier. *sigh*
		this._linkDialog.containerNode.innerHTML = this.linkDialogTemplate;
		dijit._Templated.prototype._attachTemplateNodes.call(this, this._linkDialog.containerNode);
		this._linkDialog.startup();
		this.connect(this.button, "onClick", "showEditor");
	},
	{
		// FIXME: this is a PITA. There should be a lighter weight way to do this
		urlInput: null,
		buttonClass: dijit.form.ToggleButton,
		linkDialogTemplate: [
			"<span>url: &nbsp;</span>",
			"<input class='dijitComboBoxInput' type='text' dojoAttachPoint='urlInput'>",
			"<br>",
			"<input class='dijitButtonNode' type='button' dojoAttachEvent='onclick: setValue;' value='set'>",
			"<input class='dijitButtonNode' type='button' dojoAttachEvent='onclick: hideEditor;' value='cancel'>"
		].join(""),
		useDefaultCommand: false,
		command: "createlink",
		_linkDialog: null,
		setValue: function(){
			this.editor.execCommand(this.command, this.urlInput.value);
			this.hideEditor();
		},
		hideEditor: function(){
			this._linkDialog.hide();
		},
		showEditor: function(){
			// console.debug("showEditor");
			if(!this.button.selected){
				this.editor.execCommand("unlink");
				this.button.setSelected();
			}else{
				this._linkDialog.show(this.button.domNode);
				this.urlInput.focus();
			}
		},
		updateState: function(){
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
					var enabled = _e.queryCommandEnabled("unlink");
					this.button._setDisabled(!enabled);
					if(this.button.setSelected){
						var selected;
						if(dojo.isSafari){
							selected = !!dojo.withGlobal(this.editor.window, "getAncestorElement",dijit._editor.selection, ['a']);
						}else{
							selected = _e.queryCommandState("createlink");
						}
						this.button.setSelected(selected);
					}
				}catch(e){
					console.debug(e);
				}
			}
			this._lastUpdate = new Date();
		}
	}
);
