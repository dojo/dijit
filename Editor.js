dojo.provide("dijit.Editor");
dojo.require("dijit._editor.RichText");
dojo.require("dijit.Toolbar");
dojo.require("dijit._editor._Plugin");
dojo.require("dijit._Container");
dojo.require("dojo.i18n");
dojo.requireLocalization("dijit._editor", "commands");

dojo.declare(
	"dijit.Editor",
	[ dijit._editor.RichText, dijit._Container ],
	{
		// plugins:
		//		a list of plugin names (as strings) or instances (as objects)
		//		for this widget.
//		plugins: [ "dijit._editor.plugins.DefaultToolbar" ],
		plugins: null,
		preamble: function(){
			if(this.plugins){
				this.plugins=this.plugins.slice(0);
			}else{
				this.plugins=["cut","copy","paste","|","bold","italic","underline","strikethrough","|",
			"insertOrderedList","insertUnorderedList","indent","outdent"/*,"|","createlink"*/];
			}
			this._plugins=[];
		},
		toolbar: null,
		postCreate: function(){
//			try{
			dijit.Editor.superclass.postCreate.apply(this, arguments);

			this.commands = dojo.i18n.getLocalization("dijit._editor", "commands", this.lang);

			if(!this.toolbar){
				// if we haven't been assigned a toolbar, create one
				this.toolbar = new dijit.Toolbar();
				dojo.place(this.toolbar.domNode, this.editingArea, "before");
			}

			dojo.forEach(this.plugins, this.addPlugin, this);
//			}catch(e){ console.debug(e); }
		},

		addPlugin: function(/*String||Object*/plugin, /*Integer?*/index){
			//	summary:
			//		takes a plugin name as a string or a plugin instance and
			//		adds it to the toolbar and associates it with this editor
			//		instance. The resulting plugin is added to the Editor's
			//		plugins array. If index is passed, it's placed in the plugins
			//		array at that index. No big magic, but a nice helper for
			//		passing in plugin names via markup. 
			//	plugin: String, args object or plugin instance. Required.
			//	args: This object will be passed to the plugin constructor.
			//	index:	
			//		Integer, optional. Used when creating an instance from
			//		something already in this.plugins. Ensures that the new
			//		instance is assigned to this.plugins at that index.
			var args=dojo.isString(plugin)?{name:plugin}:plugin;
			if(!args.setEditor){
				var o={"args":args,"plugin":null};
				dojo.publish("dijit.Editor.getPlugin",[o]);
				if(!o.plugin){
					var pc = dojo.getObject(args.name);
					if(pc){
						o.plugin=new pc(args);
					}
				}
				if(!o.plugin){
					console.debug('Can not find plugin',plugin);
					return;
				}
				plugin=o.plugin;
			}
			if(arguments.length > 1){
				this._plugins[index] = plugin;
			}else{
				this._plugins.push(plugin);
			}
			plugin.setEditor(this);
			if(dojo.isFunction(plugin.setToolbar)){
				plugin.setToolbar(this.toolbar);
			}
		}
	}
);

dojo.subscribe("dijit.Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	var args=o.args, p;
	var _p = dijit._editor._Plugin;
	switch(args.name){
		case "cut": case "copy": case "paste": case "insertOrderedList":
		case "insertUnorderedList": case "indent": case "outdent":
			p = new _p({ command: args.name });
			break;
		case "bold": case "italic": case "underline": case "strikethrough":
			//shall we try to auto require here? or require user to worry about it?
//					dojo['require']('dijit.form.Button');
			p = new _p({ buttonClass: dijit.form.ToggleButton, command: args.name });
			break;
		case "|":
			p = new _p({ button: new dijit.ToolbarSeparator() });
			break;
		case "createlink":
//					dojo['require']('dijit._editor.plugins.LinkDialog');
			p = new dijit._editor.plugins.LinkDialog();
			break;
	}
//	console.log('args.name',args.name,p);
	o.plugin=p;
});