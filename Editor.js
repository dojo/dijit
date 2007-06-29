dojo.provide("dijit.Editor");
dojo.require("dijit._editor.RichText");
dojo.require("dijit.Toolbar");
dojo.require("dijit._Container");
dojo.require("dijit._editor.plugins.DefaultToolbar");
dojo.require("dojo.i18n");
dojo.requireLocalization("dijit._editor", "commands");

dojo.declare(
	"dijit.Editor",
	[ dijit._editor.RichText, dijit._Container ],
	{
		// plugins:
		//		a list of plugin names (as strings) or instances (as objects)
		//		for this widget.
		plugins: [ "dijit._editor.plugins.DefaultToolbar" ],
		preamble: function(){
			this.plugins = [].concat(this.plugins);
		},
		toolbar: null,
		postCreate: function(){
			try{
			dijit.Editor.superclass.postCreate.apply(this, arguments);

			this.commands = dojo.i18n.getLocalization("dijit._editor", "commands", this.lang);

			if(!this.toolbar){
				// if we haven't been assigned a toolbar, create one
				this.toolbar = new dijit.Toolbar();
				dojo.place(this.toolbar.domNode, this.domNode, "before");
			}

			dojo.forEach(this.plugins, this.addPlugin, this);
			}catch(e){ console.debug(e); }
		},

		addPlugin: function(/*String||Object*/plugin, /*Integer?*/index){
			//	summary:
			//		takes a plugin name as a string or a plugin instance and
			//		adds it to the toolbar and associates it with this editor
			//		instance. The resulting plugin is added to the Editor's
			//		plugins array. If index is passed, it's placed in the plugins
			//		array at that index. No big magic, but a nice helper for
			//		passing in plugin names via markup. 
			//	plugin: String or plugin instance. Required.
			//	index:	
			//		Integer, optional. Used when creating an instance from
			//		something already in this.plugins. Ensures that the new
			//		instance is assigned to this.plugins at that index.
			if(dojo.isString(plugin)){
				var pc = dojo.getObject(plugin);
				plugin = new pc();
				if(arguments.length > 1){
					this.plugins[index] = plugin;
				}else{
					this.plugins.push(plugin);
				}
			}
			if(dojo.isFunction(plugin.setEditor)){
				plugin.setEditor(this);
			}
			if(dojo.isFunction(plugin.setToolbar)){
				plugin.setToolbar(this.toolbar);
			}
			if(plugin.button){
				this.toolbar.addChild(plugin.button);
			}
		}
	}
);
