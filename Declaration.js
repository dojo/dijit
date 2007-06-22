dojo.provide("dijit.Declaration");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare(
	"dijit.Declaration",
	dijit._Widget,
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
			var scripts = dojo.query("> script[type='dojo/connect']", src).orphan();
			var srcType = src.nodeName;

			if(this.mixins.length){
				this.mixins = dojo.map(this.mixins, dojo.getObject);
			}else{
				this.mixins = [ dijit._Widget, dijit._Templated ];
			}
			this.mixins.push(function(){
				scripts.forEach(function(script){
					dojo.parser._wireUpConnect(this, script);
				});
			});

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
