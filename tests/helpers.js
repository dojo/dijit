// Helper methods for automated testing

define([
	"dojo/_base/array", "dojo/Deferred", "dojo/promise/all",
	"dojo/dom-attr", "dojo/dom-class", "dojo/dom-geometry", "dojo/dom-style",
	"dojo/_base/kernel", "dojo/_base/lang", "dojo/query", "dojo/ready", "dojo/sniff",
	"dijit/a11y"	// isTabNavigable, dijit._isElementShown (latter only avail. via global; not part of module return value)
], function(array, Deferred, all,
			domAttr, domClass, domGeometry, domStyle,
			kernel, lang, query, ready, has, a11y){


var exports = {

isVisible: function isVisible(/*dijit/_WidgetBase|DomNode*/ node){
	// summary:
	//		Return true if node/widget is visible
	var p;
	if(node.domNode){ node = node.domNode; }
	return (domStyle.get(node, "display") != "none") &&
		(domStyle.get(node, "visibility") != "hidden") &&
		(p = domGeometry.position(node, true), p.y + p.h >= 0 && p.x + p.w >= 0 && p.h && p.w);
},

isHidden: function isHidden(/*dijit/_WidgetBase|DomNode*/ node){
	// summary:
	//		Return true if node/widget is hidden
	var p;
	if(node.domNode){ node = node.domNode; }
	return (domStyle.get(node, "display") == "none") ||
		(domStyle.get(node, "visibility") == "hidden") ||
		(p = domGeometry.position(node, true), p.y + p.h < 0 || p.x + p.w < 0 || p.h <= 0 || p.w <= 0);
},

innerText: function innerText(/*DomNode*/ node){
	// summary:
	//		Browser portable function to get the innerText of specified DOMNode
	return lang.trim(node.textContent || node.innerText || "");
},

tabOrder: function tabOrder(/*DomNode?*/ root){
	// summary:
	//		Return all tab-navigable elements under specified node in the order that
	//		they will be visited (by repeated presses of the tab key)

	var elems = [];

	function walkTree(/*DOMNode*/ parent){
		query("> *", parent).forEach(function(child){
			// Skip hidden elements, and also non-HTML elements (those in custom namespaces) in IE,
			// since show() invokes getAttribute("type"), which crashes on VML nodes in IE.
			if((has("ie") <= 8 && child.scopeName !== "HTML") || !dijit._isElementShown(child)){
				return;
			}

			if(a11y.isTabNavigable(child)){
				elems.push({
					elem: child,
					tabIndex: domClass.contains(child, "tabIndex") ? domAttr.get(child, "tabIndex") : 0,
					pos: elems.length
				});
			}
			if(child.nodeName.toUpperCase() != 'SELECT'){
				walkTree(child);
			}
		});
	}

	walkTree(root || dojo.body());

	elems.sort(function(a, b){
		return a.tabIndex != b.tabIndex ? a.tabIndex - b.tabIndex : a.pos - b.pos;
	});
	return dojo.map(elems, function(elem){ return elem.elem; });
},


onFocus: function onFocus(func){
	// summary:
	//		On the next change of focus, and after widget has had time to react to focus event,
	//		call func(node) with the newly focused node

	// This is still using global dojo so it works with robot... it needs to get
	// notifications from the iframe dojo, not the outer dojo running doh.
	var handle = dojo.subscribe("focusNode", function(node){
		dojo.unsubscribe(handle);
		setTimeout(function(){ func(node); }, 0);
	});
},

waitForLoad: function(){
	// summary:
	//		Returns Promise that fires when all widgets have finished initializing

	var d = new Deferred();

	dojo.global.require(["dojo/ready", "dijit/registry"], function(ready, registry){
		ready(function(){
			// Deferred fires when all widgets with an onLoadDeferred have fired
			var widgets = array.filter(registry.toArray(), function(w){ return w.onLoadDeferred; }),
				deferreds = array.map(widgets, function(w){ return w.onLoadDeferred; });
			console.log("Waiting for " + widgets.length + " widgets: " +
				array.map(widgets, function(w){ return w.id; }).join(", "));
			new all(deferreds).then(function(){
				console.log("All widgets loaded.");
				d.resolve(widgets);
			});
		});
	});

	return d.promise;
}

};

// All the old tests expect these symbols to be global
lang.mixin(kernel.global, exports);

return exports;

});
