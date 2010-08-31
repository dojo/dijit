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
