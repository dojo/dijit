dojo.provide("dijit._editor._Plugin");
dojo.require("dijit._Widget");
dojo.require("dijit.Editor");
dojo.require("dijit.form.Button");

dojo.declare("dijit._editor._Plugin", null, 
	function(/*Object*/args, /*DomNode?*/node){
		if(args){
			dojo.mixin(this, args);
		}
		// FIXME: prevent creating this if we don't need to (i.e., editor can't handle our command)
		this.initButton();
	},
	{
		editor: null,
		// iconClass: "dijitEditorIcon"+label
		iconClass: "dijitEditorIcon",
		button: null,
		queryCommand: null,
		command: "",
		commandArg: null,
		useDefaultCommand: true,
		buttonClass: dijit.form.Button,
		updateInterval: 200, // only allow updates every two tenths of a second
		initButton: function(){
			if(this.command.length){
				// FIXME: 
				//		this is a grotty hack to deal w/ CSS classes being used
				//		to set most icon images now. *sigh*
				var ctag = (dijit.Editor.commandNames[this.command]||"");
				// FIXME: not working for orderedlist!!
				var ic = this.iconClass+ctag.replace(/\s*/g, "");
				// console.debug(ic);
				if(!this.button){
					var props = {
						alt: ctag,
						iconClass: ic
					};
					this.button = new this.buttonClass(props);
				}
			}
		},
		updateState: function(){
			if(!this._lastUpdate){
				this._lateUpdate = new Date();
			}else{
				if(((new Date())-this._lastUpdate) < this.updateInterval){
					return;
				}
			}
			var _e = this.editor;
			var _c = this.command;
			if(!_e){ return; }
			if(!_e.isLoaded){ return; }
			if(!_c.length){ return; }
			if(this.button){
				try{
					var enabled = _e.queryCommandEnabled(_c);
					this.button._setDisabled(!enabled);
					if(this.button.setSelected){
						this.button.setSelected(_e.queryCommandState(_c));
					}
				}catch(e){
					console.debug(e);
				}
			}
			this._lateUpdate = new Date();
		},
		setEditor: function(/*Widget*/editor){
			// FIXME: detatch from previous editor!!
			this.editor = editor;
			// FIXME: wire up editor to button here!
			if(	(this.command.length) && 
				(!this.editor.queryCommandAvailable(this.command))
			){
				// console.debug("hiding:", this.command);
				if(this.button){ 
					this.button.domNode.style.display = "none";
				}
			}
			if(this.button && this.useDefaultCommand){
				dojo.connect(this.button, "onClick",
					dojo.hitch(this.editor, "execCommand", this.command, this.commandArg)
				);
			}
			dojo.connect(this.editor, "onDisplayChanged", this, "updateState");
		},
		setToolbar: function(/*Widget*/toolbar){
			if(this.button){
				toolbar.addChild(this.button);
			}
			// console.debug("adding", this.button, "to:", toolbar);
		}
	}
);
