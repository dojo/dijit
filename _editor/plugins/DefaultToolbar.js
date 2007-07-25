dojo.provide("dijit._editor.plugins.DefaultToolbar");
dojo.require("dijit._editor._Plugin");
dojo.require("dijit._Widget");
dojo.require("dijit._Container");

dojo.declare("dijit._editor.plugins.DefaultToolbar", null,
	// NOTE: we duck-type to dijit._editor._Plugin
	function(args){
		this.plugins=this.plugins.slice(0);
		if(args){
			dojo.mixin(this, args);
		}
		dojo.forEach(this.items,this._getPlugin,this);
	},
	{
		items: ["cut","copy","paste","|","bold","italic","underline","strikethrough","|",
			"insertOrderedList","insertUnorderedList","indent","outdent","|","createlink"],
		plugins: [],
		_getPlugin: function(name){
			var p;
			var _p = dijit._editor._Plugin;
			switch(name){
				case "cut": case "copy": case "paste": case "insertOrderedList":
				case "insertUnorderedList": case "indent": case "outdent":
					p = new _p({ command: name });
					break;
				case "bold": case "italic": case "underline": case "strikethrough":
					//shall we try to auto require here? or require user to worry about it?
//					dojo['require']('dijit.form.Button');
					p = new _p({ buttonClass: dijit.form.ToggleButton, command: name });
					break;
				case "|":
					p = new _p({ button: new dijit.ToolbarSeparator() });
					break;
				case "createlink":
//					dojo['require']('dijit._editor.plugins.LinkDialog');
					p = new dijit._editor.plugins.LinkDialog();
					break;
				default:
					if(dojo.isString(name)){
						name=dojo.getObject(name);
					}
					if(dojo.isFunction(name)){
						p = name();
					}else if(dojo.isFunction(name['constructor'])){
						p = new name();
					}else{
						console.debug('dijit._editor.plugins.DefaultToolbar: Can\'t find plugin '+item);
					}
			}
			if(p){
				this.plugins.push(p);
			}
			return p;
		},
		setEditor: function(editor){
			dojo.forEach(this.plugins, function(i){ i.setEditor(editor); });
		},
		setToolbar: function(toolbar){
			dojo.forEach(this.plugins, function(i){ i.setToolbar(toolbar); });
		}
	}
);
