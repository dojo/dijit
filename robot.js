dojo.provide("dijit.robot");
dojo.require("dojo.robot");
dojo.provide("dijit._base.place");
dojo.require("dijit._base.scroll");
dojo.require("dijit._base.window");

dojo.mixin(doh.robot,{

	// users who use doh+dojo+dijit get the added convenience of scrollIntoView
	// automatically firing when they try to move the mouse to an element

	_position: function(/*Node*/ n){
		// Returns the dojo.position of the passed node wrt the passed window's viewport,
		// following any parent iframes containing the node and clipping the node to each iframe.
		// precondition: _scrollIntoView already called
		var d = dojo, p = null, M = Math.max, m = Math.min;
		// p: the returned position of the node
		d.forEach(doh.robot._getWindowChain(n), function(w){
			d.withGlobal(w, function(){
				// get the position of the node wrt its parent window
				// if it is a parent frame, its padding and border extents will get added in
				var p2 = d.position(n, false), b = d._getPadBorderExtents(n);
				// if p2 is the position of the original passed node, store the position away as p
				// otherwise, node is actually an iframe. in this case, add the iframe's position wrt its parent window and also the iframe's padding and border extents
				if(!p){
					p = p2;
				}else{
					var view;
					d.withGlobal(n.contentWindow,function(){
						view=dijit.getViewport();
					});
					p2.r = p2.x+view.w;
					p2.b = p2.y+view.h;
					p = {x: M(p.x+p2.x,p2.x)+b.l, // clip left edge of node wrt the iframe
						y: M(p.y+p2.y,p2.y)+b.t,	// top edge
						r: m(p.x+p2.x+p.w,p2.r)+b.l,	// right edge (to compute width)
						b: m(p.y+p2.y+p.h,p2.b)+b.t}; // bottom edge (to compute height)
					// save a few bytes by computing width and height from r and b
					p.w = p.r-p.x;
					p.h = p.b-p.y;
				}
				// the new node is now the old node's parent iframe
				n=w.frameElement;
			});
		});
		return p;
	},

	_scrollIntoView: function(/*Node*/ n){
		// scrolls the passed node into view, scrolling all ancester frames/windows as well.
		// Assumes parent iframes can be made fully visible given the current browser window size
		var d = dojo,
			dr = doh.robot,
			p = null;
		d.forEach(dr._getWindowChain(n), function(w){
			d.withGlobal(w, function(){
				// get the position of the node wrt its parent window
				// if it is a parent frame, its padding and border extents will get added in
				var p2 = d.position(n, false),
					b = d._getPadBorderExtents(n),
					oldp = null;
				// if p2 is the position of the original passed node, store the position away as p
				// otherwise, node is actually an iframe. in this case, add the iframe's position wrt its parent window and also the iframe's padding and border extents
				if(!p){
					p = p2;
				}else{
					oldp = p;
					p = {x: p.x+p2.x+b.l,
						y: p.y+p2.y+b.t,
						w: p.w,
						h: p.h};

				}
				// scroll the parent window so that the node translated into the parent window's coordinate space is in view
				dijit.scrollIntoView(n,p);
				// adjust position for the new scroll offsets
				p2 = d.position(n, false);
				if(!oldp){
					p = p2;
				}else{
					p = {x: oldp.x+p2.x+b.l,
						y: oldp.y+p2.y+b.t,
						w: p.w,
						h: p.h};
				}
				// get the parent iframe so it can be scrolled too
				n = w.frameElement;
			});
		});
	},

	_getWindowChain : function(/*Node*/ n){
		// Returns an array of windows starting from the passed node's parent window and ending at dojo's window
		var cW = dijit.getDocumentWindow(n.ownerDocument);
		var arr=[cW];
		var f = cW.frameElement;
		return (cW == dojo.global || f == null)? arr : arr.concat(doh.robot._getWindowChain(f));
	}
});
