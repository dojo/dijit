dojo.provide("dijit.util.manager");

dijit.util.manager = new function(){
	// summary
	//	manager class for the widgets.

	var widgets = {};
	
	var widgetTypeCtr = {};

	this.getUniqueId = function(widgetType){
		var widgetId;
		do{
			widgetId = widgetType + "_" +
				(widgetTypeCtr[widgetType] != undefined ?
					++widgetTypeCtr[widgetType] : widgetTypeCtr[widgetType] = 0);
		}while(this.byId(widgetId));
		return widgetId;
	}

	this.add = function(widget){
		//console.profile("dojo.widget.manager.add");
		if(!widget.id){
			widget.id = this.getUniqueId(widget.declaredClass.replace("\.","_"));
		}
		widgets[widget.id] = widget;
		//console.profileEnd();
	}

	this.destroyAll = function(){
		dojo.forEach(this.getAllWidgets(), this.remove, this);
	}

	this.remove = function(id){
		//is the try/catch necessary?
		try{
			var widget = widgets[id];
			if(widget){
				widget.destroy(true);
				widgets[id] = null;
				delete widget; // does deleting a local var accomplish anything?
			}
		}catch(e){ /*squelch*/ }
	}

	this.byId = function(id){
		return widgets[id];
	}

	this.getAllWidgets = function(){
		var ary = [];
		for(var widget in widgets){
			ary.push(widgets[widget]);
		}
		return ary;
	}

	this.byNode = function(/* DOMNode */ node){
		return widgets[node.id];
	}
};

dojo.addOnUnload(function(){
	dijit.util.manager.destroyAll();
});

dijit.byId = dijit.util.manager.byId;
