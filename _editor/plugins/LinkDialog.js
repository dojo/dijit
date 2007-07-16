dojo.provide("dijit._editor.plugins.LinkDialog");
dojo.require("dijit._editor._Plugin");
dojo.require("dijit.Dialog");
dojo.require("dijit._Templated");

dojo.declare("dijit._editor.plugins.LinkDialog", 
	[ dijit._editor._Plugin, dijit._Widget ],  
	function(){
		this._linkDialog = new dijit.TooltipDialog({
			title: "link url" // FIxmE: i18n
		});
		// FIXME: this is totally torturned. _Templated should make this easier. *sigh*
		this._linkDialog.containerNode.innerHTML = this.linkDialogTemplate;
		// dojo.body().appendChild(this._linkDialog.domNode);
		dijit._Templated.prototype._attachTemplateNodes.call(this, this._linkDialog.containerNode);
		this._linkDialog.startup();

		dojo.connect(this, "_initButton", this, function(){
			this.connect(this.button, "onClick", "showEditor");
		});
	},
	{
		// FIXME: this is a PITA. There should be a lighter weight way to do this
		urlInput: null,
		buttonClass: dijit.form.ToggleButton,
		linkDialogTemplate: [
			"<span>url: &nbsp;</span>",
			"<input class='dijitComboBoxInput' type='text' dojoAttachPoint='urlInput'>",
			"<br>",
			"<input class='dijitButtonNode' type='button' dojoAttachEvent='onclick: setValue' value='set'>",
			"<input class='dijitButtonNode' type='button' dojoAttachEvent='onclick: hideEditor' value='cancel'>"
		].join(""),
		useDefaultCommand: false,
		command: "createLink",
		_linkDialog: null,
		setValue: function(){
			var val = this.urlInput.value;
			this.hideEditor();
			this.editor.execCommand(this.command, val);
		},
		_savedSelection: null,
		hideEditor: function(){
			this._linkDialog.hide();
			// FIXME: IE is really messed up here!!
			if(dojo.isIE){
				this.editor.focus();
				var range = this.editor.document.selection.createRange();
				range.moveToBookmark(this._savedSelection);
				range.select();
				this._savedSelection = null;
			}
		},
		showEditor: function(){
			if(!this.button.selected){
				console.debug("selected");
				this.editor.execCommand("unlink");
				// this.button.setSelected();
			}else{

				// FIXME: IE is *really* b0rken
				if(dojo.isIE){
					var range = this.editor.document.selection.createRange();
					this._savedSelection = range.getBookmark();
				}
				dojo.coords(this.button.domNode);
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
					// var enabled = _e.queryCommandEnabled("unlink");
					var enabled = _e.queryCommandEnabled("createlink");
					// this.button.setDisabled(!enabled);
					if(this.button.setSelected){
						var selected = !!dojo.withGlobal(this.editor.window, "getAncestorElement",dijit._editor.selection, ['a']);
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
