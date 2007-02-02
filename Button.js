// Dummy test widget, for testing instantiation of widgets from a template

dojo.provide("dijit.Button");


dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");

dojo.declare(
	"dijit.Button",
	[dijit.base.Widget, dijit.base.TemplatedWidget],
	function(){  },
	{
		caption: "",

		templateString: "<button dojoAttachEvent='onClick'>${this.caption}</button>",

		onClick: function(){
			this.domNode.style.backgroundColor="green";
		},
		postCreate: function(){
		}
	}
);


dojo.declare(
	"dijit.ComboButton",
	[dijit.base.Widget, dijit.base.TemplatedWidget],
	function(){  },
	{
		caption: "",

		templateString: "<table border=1><tr>" +
						"<td dojoAttachPoint='one' dojoAttachEvent='onClick: leftClick' dojoAttachPoint=containerNode>${this.caption}</td>" +
						"<td dojoAttachEvent='onClick: rightClick'>V</td>" +
						"</tr></table>",

		leftClick: function(){
			this.one.style.backgroundColor="green";
		},
		rightClick: function(){
			this.containerNode.style.backgroundColor="blue";
		},
		postCreate: function(){
		}
	}
);