// Helper methods for automated testing

function isVisible(/*dijit._Widget || DomNode*/ node){
	// summary:
	//		Return true if node/widget is visible
	var p;
	if(node.domNode){ node = node.domNode; }
	return (dojo.style(node, "display") != "none") &&
		(dojo.style(node, "visibility") != "hidden") &&
		(p = dojo.position(node, true), p.y + p.h >= 0 && p.x + p.w >= 0 && p.h && p.w);
}

function isHidden(/*dijit._Widget || DomNode*/ node){
	// summary:
	//		Return true if node/widget is hidden
	var p;
	if(node.domNode){ node = node.domNode; }
	return (dojo.style(node, "display") == "none") ||
		(dojo.style(node, "visibility") == "hidden") ||
		(p = dojo.position(node, true), p.y + p.h < 0 || p.x + p.w < 0 || p.h <= 0 || p.w <= 0);
}

function innerText(/*DomNode*/ node){
	// summary:
	//		Browser portable function to get the innerText of specified DOMNode
	return node.textContent || node.innerText || "";
}

function tabOrder(/*DomNode?*/ root){
	// summary:
	//		Return all tab-navigable elements under specified node in the order that
	//		they will be visited (by repeated presses of the tab key)

	var elems = [];

	function walkTree(/*DOMNode*/parent){
		dojo.query("> *", parent).forEach(function(child){
			// Skip hidden elements, and also non-HTML elements (those in custom namespaces) in IE,
			// since show() invokes getAttribute("type"), which crash on VML nodes in IE.
			if((dojo.isIE <= 8 && child.scopeName!=="HTML") || !dijit._isElementShown(child)){
				return;
			}

			if(dijit.isTabNavigable(child)){
				elems.push({
					elem: child,
					tabIndex: dojo.hasAttr(child, "tabIndex") ? dojo.attr(child, "tabIndex") : 0,
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
}


var focusListener, curFocusNode, focusCallback, focusCallbackDelay;

function onFocus(func, delay){
	// summary:
	//		Wait for the next change of focus, and then delay ms (so widget has time to react to focus event),
	//		then call func(node) with the currently focused node.  Note that if focus changes again during delay,
	//		newest focused node is passed to func.

	if(!focusListener){
		focusListener = dojo.connect(dojo.doc, "focusin", function(evt){
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
}
