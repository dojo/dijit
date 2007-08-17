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

		_noScript: true,
		widgetClass: "",
		replaceVars: true,
		defaults: null,
		mixins: [],
		buildRendering: function(){
			var src = this.srcNodeRef.parentNode.removeChild(this.srcNodeRef);
			var preambles = dojo.query("> script[type='dojo/method'][event='preamble']", src).orphan();
			var scripts = dojo.query("> script[type^='dojo/']", src).orphan();
			var srcType = src.nodeName;


			this.mixins = this.mixins.length ? 
				dojo.map(this.mixins, dojo.getObject) : 
				[ dijit._Widget, dijit._Templated ];
			this.mixins.push(function(){
				scripts.forEach(dojo.hitch(dojo.parser, "_wireUpMethod", this));
			});

			var propList = this.defaults||{};
			if(preambles.length){
				// we only support one preamble. So be it.
				propList.preamble = dojo.parser._functionFromScript(preambles[0]);
			}
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
