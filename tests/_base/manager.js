dojo.provide("dijit.tests._base.manager");

dojo.require("dijit._Widget");

dojo.declare(
	"foo",
	dijit._Widget,
	null,
	{
		name: "",
		attr1: 0,
		attr2: 0
	}
);

dojo.declare(
	"bar",
	dijit._Widget,
	null,
	{
		name: "",
		attr1: 0,
		attr2: 0
	}
);

doh.register("t",
	[
		function setUp(t){
			new foo({id: "one", name: "bob", attr1: 10, attr2: 10});
			new foo({id: "two", name: "is", attr1: 5, attr2: 10});
			new bar({id: "three", name: "your", attr1: 5, attr2: 5});
			new bar({id: "four", name: "uncle", attr1: 10, attr2: 5});
		},
		function forEachTest(t){
			var names=[];
			dijit.registry.forEach(function(widget){ names.push(widget.name); });
			t.is(names.join(" "), "bob is your uncle");
		},
		function filterTest(t){
			var names=[];
			dijit.registry.
				filter(function(widget){ return widget.attr1==10; }).
				forEach(function(widget){ names.push(widget.name); });
			t.is(names.join(" "), "bob uncle");
		},
		function byId(t){
			t.is(dijit.byId("three").name, "your");
		},
		function byClass(t){
			var names=[];
			dijit.registry.
				byClass("bar").
				forEach(function(widget){ names.push(widget.name); });
			t.is(names.join(" "), "your uncle");
		},
		function deleteTest(t){
			var names=[];
			dijit.registry.remove("two");
			dijit.registry.remove("four");
			var names=[];
			dijit.registry.forEach(function(widget){ names.push(widget.name); });
			t.is(names.join(" "), "bob your");
		}
	]
);
