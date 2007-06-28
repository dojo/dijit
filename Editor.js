dojo.provide("dijit.Editor");
dojo.require("dijit._editor.RichText");
dojo.require("dijit.Toolbar");
dojo.require("dijit._Container");
dojo.require("dijit._editor.plugins.DefaultToolbar");

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
			
			if(!this.toolbar){
				// if we haven't been assigned a toolbar, create one
				this.toolbar = new dijit.Toolbar();
				dojo.place(this.toolbar.domNode, this.domNode, "before");
			}

			dojo.forEach(this.plugins, this.addPlugin, this);
			}catch(e){ console.debug(e); }
		},

		addPlugin: function(/*String||Object*/plugin, /*Integer?*/idx){
			//	summary:
			//		takes a plugin name as a string or a plugin instance and
			//		adds it to the toolbar and associates it with this editor
			//		instance. The resulting plugin is added to the Editor's
			//		plugins array. If idx is passed, it's placed in the plugins
			//		array at that index. No big magic, but a nice helper for
			//		passing in plugin names via markup. 
			//	plugin: String or plugin instance. Required.
			//	idx:	
			//		Integer, optional. Used when creating an instance from
			//		something already in this.plugins. Ensures that the new
			//		instance is assigned to this.plugins at that index.
			if(dojo.isString(plugin)){
				var pc = dojo.getObject(plugin);
				plugin = new pc();
				if(arguments.length > 1){
					this.plugins[idx] = plugin;
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

dijit.Editor.commandNames = {
			"bold": "Bold",
			"copy": "Copy",
			"cut": "Cut",
			"Delete": "Delete",
			"indent": "Indent",
			"inserthorizontalrule": "Horizental Rule",
			"insertorderedlist": "Numbered List",
			"insertunorderedlist": "Bullet List",
			"italic": "Italic",
			"justifycenter": "Align Center",
			"justifyfull": "Justify",
			"justifyleft": "Align Left",
			"justifyright": "Align Right",
			"outdent": "Outdent",
			"paste": "Paste",
			"redo": "Redo",
			"removeformat": "Remove Format",
			"selectall": "Select All",
			"strikethrough": "Strikethrough",
			"subscript": "Subscript",
			"superscript": "Superscript",
			"underline": "Underline",
			"undo": "Undo",
			"unlink": "Remove Link",
			"createlink": "Create Link",
			"insertimage": "Insert Image",
			"htmltoggle": "HTML Source",
			"forecolor": "Foreground Color",
			"hilitecolor": "Background Color",
			"plainformatblock": "Paragraph Style",
			"formatblock": "Paragraph Style",
			"fontsize": "Font Size",
			"fontname": "Font Name" //,
//			"inserttable": "Insert Table",
//			"insertcell":
//			"insertcol":
//			"insertrow":
//			"deletecells":
//			"deletecols":
//			"deleterows":
//			"mergecells":
//			"splitcell":
//			"inserthtml":
//			"blockdirltr":
//			"blockdirrtl":
//			"dirltr":
//			"dirrtl":
//			"inlinedirltr":
//			"inlinedirrtl":
};
