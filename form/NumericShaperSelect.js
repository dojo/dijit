
define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/dom-attr", // domAttr.set
    "dojo/parser", "dojo/ready",
    "dojo/data/ObjectStore",
    "dojo/store/Memory",
    "dijit/form/Select",
    "dojo/data/util/NumericShaperUtility",   // NumericShaping (// Bidi Support)
    "dojo/_base/array",
    "dijit/registry",
    "dojo/dom",
    "dojo/dom-style",
    "dijit/_WidgetBase",
    
], function(declare, domConstruct, domAttr, parser, ready, ObjectStore, Memory, Select, numShaper, array, registry, dom, domStyle, _WidgetBase){
	
		var store = new Memory({
			data: [
			       { id: "Contextual", label: "Contextual" },
			       { id: "National", label: "National" },
			       { id: "Nominal", label: "Nominal" }
			       ]
		});

		var os = new ObjectStore({ objectStore: store });
	  
    	var numericShaperSelect = declare("dijit.form.NumericShaperSelect", [_WidgetBase, Select], {
    		
    		shaperValue: "Nominal",
    		
    		store:os,
    		
    		onChange: function(){
    			this.inherited(arguments);
    			this.applyShaping();
    			
    		},
    		
    		applyShaping: function(){
    			// summary:
    			//		Apply the shaping behavior
    			
    			var ob = new numShaper();
    			var stringToBeShaped = "";
    			var shapedArray = "";
    			var shapedString = "";
    			var widgets = registry.findWidgets(dojo.doc);
    			
    			this.shaperValue = this.value;
    			
    			if(widgets){
    				if(this.shaperValue == "National"){
        				ob.getShaper(ob.ARABIC); // National
        			}else if(this.shaperValue == "Contextual"){
        				ob.getContextualShaper(ob.ARABIC, ob.EUROPEAN); // Contextual Arabic
        			}else{
        				ob.getShaper(ob.EUROPEAN); // Nominal
        			}
    				
    				for(var i = 0; i < widgets.length; i++){
        				widgets[i].set("shaper", this.shaperValue);
        				stringToBeShaped = widgets[i].get("value");
        				if(stringToBeShaped){
        					shapedArray = ob.shapeWith(this.shaperValue ,stringToBeShaped);
                			shapedString = shapedArray.join("");
                			widgets[i].set("value", shapedString);
        				}
    				}
    			}
    		}

    	});
    	return numericShaperSelect;
});