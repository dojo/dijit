// Helper methods for automated testing

function isVisible(node){
	var p;
	if(node.domNode){ node = node.domNode; }
	return (dojo.style(node, "display") != "none") &&
		(dojo.style(node, "visibility") != "hidden") &&
		(p = dojo.position(node), p.y + p.h >= 0 && p.x + p.w >= 0 && p.h && p.w);
}

function isHidden(node){
	var p;
	if(node.domNode){ node = node.domNode; }
	return (dojo.style(node, "display") == "none") ||
		(dojo.style(node, "visibility") == "hidden") ||
		(p = dojo.position(node), p.y + p.h < 0 || p.x + p.w < 0 || p.h <= 0 || p.w <= 0);
}

function innerText(node){
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
			if((dojo.isIE && child.scopeName!=="HTML") || !dijit._isElementShown(child)){
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
	};

	walkTree(root || dojo.body());

	elems.sort(function(a, b){
		return a.tabIndex != b.tabIndex ? a.tabIndex - b.tabIndex : a.pos - b.pos;
	});
	return dojo.map(elems, function(elem){ return elem.elem; });
}
