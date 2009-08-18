dojo.provide("dijit._base.scroll");

dijit.scrollIntoView = function(/* DomNode */node){
	// summary:
	//		Scroll the passed node into view, if it is not.

	// don't rely on that node.scrollIntoView works just because the function is there
	// it doesnt work in Konqueror or Opera even though the function is there

	try{ // catch unexpected/unrecreatable errors (#7808) since we can recover using a semi-acceptable native method
	node = dojo.byId(node);
	var doc = node.ownerDocument || dojo.doc,
		body = doc.body || dojo.body(),
		html = doc.documentElement || body.parentNode,
		isIE = dojo.isIE, isWK = dojo.isWebKit;
	// if FF2 (which is perfect) or an untested browser, then use the native method
	if((!(dojo.isFF >= 3 || isIE || isWK) || node == body || node == html) && (typeof node.scrollIntoView != "undefined")){
		node.scrollIntoView(false); // short-circuit to native if possible
		return;
	}
	var backCompat = doc.compatMode == 'BackCompat',
		clientAreaRoot = backCompat? body : html,
		scrollRoot = isWK ? body : clientAreaRoot,
		rootWidth = clientAreaRoot.clientWidth,
		rootHeight = clientAreaRoot.clientHeight,
		rtl = !dojo._isBodyLtr(),
		nodePos = dojo.position(node),
		el = node.parentNode,
		isFixed = function(el){
			return ((isIE <= 6 || (isIE && backCompat))? false : (dojo.style(el, 'position').toLowerCase() == "fixed"));
		};
	if(isFixed(node)){ return; } // nothing to do
	while(el){
		if(el == body){ el = scrollRoot; }
		var pb = dojo._getPadBorderExtents(el),
			elPos = el == scrollRoot? { x:0, y:0, w:rootWidth, h:rootHeight } : dojo.position(el),
			fixedPos = isFixed(el);
		with(elPos){
			w -= pb.w; h -= pb.h; x += pb.l; y += pb.t;
			with(el){
				if(el != scrollRoot){ // body, html sizes already have the scrollbar removed
					var clientSize = clientWidth,
						scrollBarSize = w - clientSize;
					if(clientSize > 0 && scrollBarSize > 0){
						w = clientSize;
						if(isIE && rtl){ x += scrollBarSize; }
					}
					clientSize = clientHeight;
					scrollBarSize = h - clientSize;
					if(clientSize > 0 && scrollBarSize > 0){
						h = clientSize;
					}
					if(isWK < 526){ // workaround older WebKit bugs - REMOVE when Safari 3.2 and Chrome 1.0 users are toast
						if(rtl){
							nodePos.x += scrollWidth - w - dojo._getBorderExtents(el).w;
						}
						if(fixedPos){
							x += scrollRoot.scrollLeft;
							y += scrollRoot.scrollTop;
							nodePos.x -= scrollLeft;
							nodePos.y -= scrollTop;
						}
					}
				}else if(isIE && backCompat && rtl){
					x += clientAreaRoot.offsetWidth - rootWidth - pb.w;
				}
				if(fixedPos){ // bounded by viewport, not parents
					if(y < 0){
						h += y, y = 0;
					}
					if(x < 0){
						w += x, x = 0;
					}
					if(y + h > rootHeight){
						h = rootHeight - y;
					}
					if(x + w > rootWidth){
						w = rootWidth - x;
					}
				}
				// calculate overflow in all 4 directions
				var l = nodePos.x - x, // beyond left: < 0
					t = nodePos.y - Math.max(y, 0), // beyond top: < 0
					r = l + nodePos.w - w, // beyond right: > 0
					b = t + nodePos.h - h; // beyond bottom: > 0
				if(r * l > 0){
					var s = Math[l < 0? "max" : "min"](l, r);
					nodePos.x += scrollLeft;
					scrollLeft += (isIE >= 8 && !backCompat && rtl)? -s : s;
					nodePos.x -= scrollLeft;
				}
				if(b * t > 0){
					nodePos.y += scrollTop;
					scrollTop += Math[t < 0? "max" : "min"](t, b);
					nodePos.y -= scrollTop;
				}
			}
		}
		el = el == scrollRoot? null : (fixedPos? null : el.parentNode);
	}
	}catch(error){
		console.error('scrollIntoView: ' + error);
		node.scrollIntoView(false);
	}
};
