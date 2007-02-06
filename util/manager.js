dojo.provide("dijit.util.manager");

dojo.require("dojo.lang.common");
dojo.require("dojo.lang.array");
dojo.require("dojo.lang.func");

dijit.util.manager = new function(){
	// summary
	//	manager class for the widgets.

	this.widgets = {};
	
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
		this.widgets[widget.id] = widget;
		//dojo.profile.end("dojo.widget.manager.add");
	}

	this.destroyAll = function(){
		dojo.lang.forEach(this.getAllWidgets(), this.remove, this);
	}

	this.remove = function(id) {
		try{
			var widget = this.widgets[id];
			widget.destroy(true);
			this.widgets[id] = null;
			delete widget;
		}catch(e){ }
	}

	this.byId = function(id){
		return this.widgets[id];
	}

	this.byType = function(type){
		var lt = type.toLowerCase();
		var getType = (type.indexOf(":") < 0 ? 
			function(x) { return x.widgetType.toLowerCase(); } :
			function(x) { return x.getNamespacedType(); }
		);
		return dojo.lang.filter(this.getAllWidgets(), function(x){ return getType(x) == lt; });
	}

	this.byFilter = function(unaryFunc){
		return dojo.lang.filter(this.getAllWidgets(), unaryFunc);
	}

	this.getAllWidgets = function() {
		var ary = [];
		for(var widget in this.widgets){
			ary.push(this.widgets[widget]);
		}
		return ary;
	}

	this.byNode = function(/* DOMNode */ node){
		return this.widgets[node.id];
	}
};

dojo.addOnUnload(function(){
	dijit.util.manager.destroyAll();
});

dijit.byId = dijit.util.manager.byId;
