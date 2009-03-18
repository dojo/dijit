// Helper methods for automated testing

function isVisible(node){
		if(node.domNode){ node = node.domNode; }
		return (dojo.style(node, "display") != "none") &&
				(dojo.style(node, "visibility") != "hidden");
}

function isHidden(node){
		if(node.domNode){ node = node.domNode; }
		return (dojo.style(node, "display") == "none") ||
				(dojo.style(node, "visibility") == "hidden");
}

function innerText(node){
	return node.textContent || node.innerText || "";
}
