dojo.provide("dijit.Declaration");
dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");

dojo.declare(
	"dijit.Declaration",
	[ dijit.base.Widget ],
	{
		// summary:
		//		The Declaration widget allows a user to declare new widget
		//		classes directly from a snippet of markup.

		widgetClass: "",
		replaceVars: true,
		defaults: null,
		mixins: [],
		buildRendering: function(){
			var src = this.srcNodeRef.parentNode.removeChild(this.srcNodeRef);
			var srcType = src.nodeName;

			if(this.mixins.length){
				this.mixins = dojo.map(this.mixins, dojo.getObject);
			}else{
				this.mixins = [ dijit.base.Widget, dijit.base.TemplatedWidget ];
			}

			var propList = this.defaults||{};
			propList.widgetsInTemplate = true;
			propList.templateString = "<"+srcType+">"+src.innerHTML+"</"+srcType+">";

			// strip things so we don't create stuff under us in the initial setup phase
			dojo.query("[dojoType]", src).forEach(function(node){
				node.removeAttribute("dojoType");
			});

			// create the new widget class
			dojo.declare(
				this.widgetClass,
				this.mixins,
				propList
			);
		}
	}
);
