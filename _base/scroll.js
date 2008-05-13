dojo.provide("dijit._base.scroll");

dijit.scrollIntoView = function(/* DomNode */node){
	//	summary
	//	Scroll the passed node into view, if it is not.

	// don't rely on that node.scrollIntoView works just because the function is there
	// it doesnt work in Konqueror or Opera even though the function is there and probably
	//	not safari either
	// native scrollIntoView() causes FF3's whole window to scroll if there is no scroll bar 
	//	on the immediate parent
	// dont like browser sniffs implementations but sometimes you have to use it
	// #6146: IE scrollIntoView is broken
	// It's not enough just to scroll the menu node into view if
	// node.scrollIntoView hides part of the parent's scrollbar,
	// so just manage the parent scrollbar ourselves

	// all the V/H object members below are to reuse code for both directions
	function addPseudoAttrs(element){
		// use border box for node since margin visibility is least important
		// use content box for parents since we don't care about parent border and padding
		// use HTML size instead of BODY size since that's where the scrollbars are defined
		var parent = element.parentNode;
		var nodeBox = dojo._getBorderBox(element);
		if(element.tagName=="BODY"){
			htmlBox = dojo._getBorderBox(parent);
			// this varies depending on browser and DOCTYPE
			if(htmlBox.w < nodeBox.w){ nodeBox.w = htmlBox.w; }
			if(htmlBox.h < nodeBox.h){ nodeBox.h = htmlBox.h; }
		}
		size = { H: nodeBox.w, V: nodeBox.h };
		var start = { H:element.offsetLeft, V:element.offsetTop };
		// check if this node and its parent share the same offsetParent
		element._startIsRelative = !(parent && parent.tagName && parent.offsetParent == element.offsetParent);
		var bp = dojo._getBorderExtents(element);
		if(element != node){ // parent = skip border
			start.H += bp.l;
			start.V += bp.t;
		}else{ // original node = add border to size
			size.H += bp.w;
			size.V += bp.h;
		}
		// FIXME: _getBorderBox/FF2 workaround
		var fudgeStart = { H:0, V:0 };
		if(dojo.isFF == 2){
			var parent = element.parentNode;
			if(parent && parent.tagName){
				var bp = dojo._getBorderExtents(parent);
				fudgeStart.H += bp.l;
				fudgeStart.V += bp.t;
			}
		}
		element._size = size;
		element._start = start;
		element._fudgeStart = fudgeStart;
	}

	var r2l = !dojo._isBodyLtr();
	node = dojo.byId(node);
	var parent = node.parentNode;
	addPseudoAttrs(node);
	var xy = { V: null, H: null };
	while(parent && parent.tagName){ // tagName check needed for IE since HTML node has a tag-less parent
		addPseudoAttrs(parent);
		// for both x and y directions
		for (var dir in xy){
			var scrollAttr = (dir=="H")? "scrollLeft" : "scrollTop";
			var oldScroll = parent[scrollAttr];
			nodeRelativeOffset = node._start[dir] + node._fudgeStart[dir] - (node._startIsRelative? 0 : parent._start[dir]) - oldScroll;
			if(parent._size[dir] < node._size[dir]){ // see if the node will be clipped
				node._size[dir] = parent._size[dir]; // simplify calculations
			}
			var overflow = nodeRelativeOffset + node._size[dir] - parent._size[dir];
			var underflow = nodeRelativeOffset;
			var scrollAmount;
			// see if we should scroll forward or backward
			if(underflow <= 0){
				scrollAmount = underflow;
			}else if(overflow <= 0){
				scrollAmount = 0;
			}else if(underflow < overflow){
				scrollAmount = underflow;
			}else{
				scrollAmount = overflow;
			}
			var newScroll = scrollAmount + oldScroll;
			if(newScroll < 0 && r2l && dir=="H"){ // safari and IE need an adjustment since inline nodes return the wrong offsetLeft in right-to-left mode
				newScroll += parent.scrollWidth - parent.clientWidth;
			}
			parent[scrollAttr] = newScroll; // actually perform the scroll
			nodeRelativeOffset -= parent[scrollAttr] - oldScroll;
			parent._size[dir] = node._size[dir]; // now we only want to show this portion of the parent
			parent._start[dir] += nodeRelativeOffset; // the new visible portion of the parent may have tweaked coordinates
		}
		node = parent; // now see if the parent needs to be scrolled as well
		parent = parent.parentNode;
	}
};
