dojo.provide("dijit.util.manager");

dojo.require("dojo.lang.common");
dojo.require("dojo.lang.array");
dojo.require("dojo.lang.func");

dijit.util.manager = new function(){
	// summary
	//	manager class for the widgets.

	var widgets = {};
	
	var widgetTypeCtr = {};

	this.getUniqueId = function (widgetType) {
		var widgetId;
		do{
			widgetId = widgetType + "_" + (widgetTypeCtr[widgetType] != undefined ?
			++widgetTypeCtr[widgetType] : widgetTypeCtr[widgetType] = 0);
		}while(this.byId(widgetId));
		return widgetId;
	}

	this.add = function(widget){
		//dojo.profile.start("dojo.widget.manager.add");
		if(!widget.id){
			widget.id = this.getUniqueId(widget.declaredClass.replace("\.","_"));
		}
		widgets[widget.id] = widget;
		//dojo.profile.end("dojo.widget.manager.add");
	}

	this.destroyAll = function(){
		dojo.lang.forEach(this.getAllWidgets(), this.remove, this);
	}

	this.remove = function(id) {
		try{
			var widget = widgets[id];
			widget.destroy(true);
			widgets[id] = null;
			delete widget;
		}catch(e){ }
	}

	this.byId = function(id){
		return widgets[id];
	}

	this.getAllWidgets = function() {
		var ary = [];
		for(var widget in widgets){
			ary.push(widgets[widget]);
		}
		return ary;
	}

	this.byNode = function(/* DOMNode */ node){
		return widgets[node.widgetId];
	}
};

dojo.addOnUnload(function(){
	dijit.util.manager.destroyAll();
});

dijit.byId = dijit.util.manager.byId;
