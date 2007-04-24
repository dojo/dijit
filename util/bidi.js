dojo.provide("dijit.util.bidi");

// ported from dojo.html.util
dijit.util.bidi.isLeftToRight = function(/*HtmlElement*/node){
	// summary
	// Walks the DOM parent chain looking for a dir attribute to determine direction of text (BiDi)
	// Stops if a value is found and returns true if the attribute is set to "ltr".  If none is found,
	// the default direction is left-to-right, so true is returned.
	for(; node; node = node.parentNode){
		if(node.dir){
			return node.dir == "ltr";
		}
	}
	return dojo.doc.dir; // Boolean
}

