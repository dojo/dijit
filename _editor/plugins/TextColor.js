dojo.provide("dijit._editor.plugins.TextColor");

dojo.require("dijit._editor._Plugin");
dojo.require("dijit.ColorPalette");

dojo.declare("dijit._editor.plugins.TextColor",
	dijit._editor._Plugin,
	{
		buttonClass: dijit.form.DropDownButton,

//TODO: set initial focus/selection state?

		constructor: function(){
			this.dropDown = new dijit.ColorPalette();
			this.connect(this.dropDown, "onChange", function(color){
				this.editor.execCommand(this.command, color);
			});
		}
	}
);

dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	switch(o.args.name){
	case "foreColor": case "hiliteColor":
		o.plugin = new dijit._editor.plugins.TextColor({command: o.args.name});
	}
});
