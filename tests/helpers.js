// Helper methods for automated testing

define([
	"dojo/_base/array", "dojo/_base/Deferred",// "dojo/promise/all",
	"dojo/dom-attr", "dojo/dom-class", "dojo/dom-geometry", "dojo/dom-style",
	"dojo/_base/kernel", "dojo/_base/lang", "dojo/on", "dojo/query", "dojo/ready", "dojo/_base/sniff",
	"dijit/a11y"	// isTabNavigable, dijit._isElementShown
], function(array,  Deferred,// all,
			domAttr, domClass, domGeometry, domStyle,
			kernel, lang, on, query, ready, has, a11y){

	// 1.8 promises - so this is why DOH should be decoupled from Dojo
	function all(objectOrArray){
		// summary:
		//		Takes multiple promises and returns a new promise that is fulfilled
		//		when all promises have been fulfilled.
		// description:
		//		Takes multiple promises and returns a new promise that is fulfilled
		//		when all promises have been fulfilled. If one of the promises is rejected,
		//		the returned promise is also rejected. Canceling the returned promise will
		//		*not* cancel any passed promises.
		// objectOrArray: Object|Array?
		//		The promise will be fulfilled with a list of results if invoked with an
		//		array, or an object of results when passed an object (using the same
		//		keys). If passed neither an object or array it is resolved with an
		//		undefined value.
		// returns: dojo/promise/Promise

		var object, _array;
		if(objectOrArray instanceof Array){
			_array = objectOrArray;
		}else if(objectOrArray && typeof objectOrArray === "object"){
			object = objectOrArray;
		}

		var results;
		var keyLookup = [];
		if(object){
			_array = [];
			for(var key in object){
				if(Object.hasOwnProperty.call(object, key)){
					keyLookup.push(key);
					_array.push(object[key]);
				}
			}
			results = {};
		}else if(_array){
			results = [];
		}

		if(!_array || !_array.length){
			return new Deferred().resolve(results);
		}

		var deferred = new Deferred();
		// no sugar coating like always in 1.7 - stick to the basics
		/*deferred.promise.always(function(){
			results = keyLookup = null;
		});*/
		var f=function(){
			results = keyLookup = null;
		};
		deferred.promise.then(f,f);
		
		// cleaner impl of crazy some/when/always/otherwise nonsense
		var waiting = _array.length;
		for(var i=0; i<_array.length; i++){
			var nextPromise=_array[i];
			nextPromise.then(function(){
				waiting--;
				console.log("WAITIG: "+waiting);
				if(waiting==0){
					deferred.resolve(results);
				}
			});
		}
		return deferred.promise;	// dojo/promise/Promise
	};
	function when(valueOrPromise, callback, errback, progback){
		// summary:
		//		Transparently applies callbacks to values and/or promises.
		// description:
		//		Accepts promises but also transparently handles non-promises. If no
		//		callbacks are provided returns a promise, regardless of the initial
		//		value. Foreign promises are converted.
		//
		//		If callbacks are provided and the initial value is not a promise,
		//		the callback is executed immediately with no error handling. Returns
		//		a promise if the initial value is a promise, or the result of the
		//		callback otherwise.
		// valueOrPromise:
		//		Either a regular value or an object with a `then()` method that
		//		follows the Promises/A specification.
		// callback: Function?
		//		Callback to be invoked when the promise is resolved, or a non-promise
		//		is received.
		// errback: Function?
		//		Callback to be invoked when the promise is rejected.
		// progback: Function?
		//		Callback to be invoked when the promise emits a progress update.
		// returns: dojo/promise/Promise
		//		Promise, or if a callback is provided, the result of the callback.

		var receivedPromise = valueOrPromise && typeof valueOrPromise.then === "function";
		var nativePromise = false;//receivedPromise && valueOrPromise instanceof Promise;

		if(!receivedPromise){
			if(arguments.length > 1){
				return callback ? callback(valueOrPromise) : valueOrPromise;
			}else{
				return new Deferred().resolve(valueOrPromise);
			}
		}else if(!nativePromise){
			var deferred = new Deferred(valueOrPromise.cancel);
			valueOrPromise.then(deferred.resolve, deferred.reject, deferred.progress);
			valueOrPromise = deferred.promise;
		}

		if(callback || errback || progback){
			return valueOrPromise.then(callback, errback, progback);
		}
		return valueOrPromise;
	};
			
// Globals used by onFocus()
var curFocusNode, focusListener, focusCallback, focusCallbackDelay;

var exports = {

all:all,
when:when,

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
			if((has("ie") <= 8 && child.scopeName !== "HTML") || !a11y._isElementShown(child)){
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
	return array.map(elems, function(elem){ return elem.elem; });
},


onFocus: function onFocus(func, delay){
	// summary:
	//		Wait for the next change of focus, and then delay ms (so widget has time to react to focus event),
	//		then call func(node) with the currently focused node.  Note that if focus changes again during delay,
	//		newest focused node is passed to func.

	if(!focusListener){
		focusListener = on(dojo.doc, "focusin", function(evt){
			// Track most recently focused node; note it may change again before delay completes
			curFocusNode = evt.target;

			// If a handler was specified to fire after the next focus event (plus delay), set timeout to run it.
			if(focusCallback){
				var callback = focusCallback;
				focusCallback = null;
				setTimeout(function(){
					callback(curFocusNode);		// return current focus, may be different than 10ms earlier
				}, focusCallbackDelay);	// allow time for focus to change again, see #8285
			}
		});
	}

	focusCallback = func;
	focusCallbackDelay = delay || 10;
},

waitForLoad: function(){
	// summary:
	//		Return Deferred that fires when all widgets have finished initializing

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

	return d;
}

};

// All the old tests expect these symbols to be global
lang.mixin(kernel.global, exports);

return exports;

});
