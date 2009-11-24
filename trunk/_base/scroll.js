dojo.provide("dijit._base.scroll");

dijit.scrollIntoView = function(/*DomNode*/ node, /*Object?*/ pos){
	// summary:
	//		Scroll the passed node into view, if it is not already.
	
	// don't rely on that node.scrollIntoView works just because the function is there

	try{ // catch unexpected/unrecreatable errors (#7808) since we can recover using a semi-acceptable native method
	node = dojo.byId(node);
	var doc = node.ownerDocument || dojo.doc,
		body = doc.body || dojo.body(),
		html = doc.documentElement || body.parentNode,
		isIE = dojo.isIE, isWK = dojo.isWebKit;
	// if an untested browser, then use the native method
	if((!(dojo.isMoz || isIE || isWK) || node == body || node == html) && (typeof node.scrollIntoView != "undefined")){
		node.scrollIntoView(false); // short-circuit to native if possible
		return;
	}
	var backCompat = doc.compatMode == 'BackCompat',
		clientAreaRoot = backCompat? body : html,
		scrollRoot = isWK ? body : clientAreaRoot,
		rootWidth = clientAreaRoot.clientWidth,
		rootHeight = clientAreaRoot.clientHeight,
		rtl = !dojo._isBodyLtr(),
		nodePos = pos || dojo.position(node),
		el = node.parentNode,
		isFixed = function(el){
			return ((isIE <= 6 || (isIE && backCompat))? false : (dojo.style(el, 'position').toLowerCase() == "fixed"));
		};
	if(isFixed(node)){ return; } // nothing to do
	while(el){
		if(el == body){ el = scrollRoot; }
		var elPos = dojo.position(el),
			fixedPos = isFixed(el);
		with(elPos){
			if(el == scrollRoot){
				w = rootWidth, h = rootHeight;
				if(scrollRoot == html && isIE && rtl){ x += scrollRoot.offsetWidth-w; } // IE workaround where scrollbar causes negative x
				if(x < 0 || !isIE){ x = 0; } // IE can have values > 0
				if(y < 0 || !isIE){ y = 0; }
			}else{
				var pb = dojo._getPadBorderExtents(el);
				w -= pb.w; h -= pb.h; x += pb.l; y += pb.t;
			}
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
					bot = t + nodePos.h - h; // beyond bottom: > 0
				if(r * l > 0){
					var s = Math[l < 0? "max" : "min"](l, r);
					nodePos.x += scrollLeft;
					scrollLeft += (isIE >= 8 && !backCompat && rtl)? -s : s;
					nodePos.x -= scrollLeft;
				}
				if(bot * t > 0){
					nodePos.y += scrollTop;
					scrollTop += Math[t < 0? "max" : "min"](t, bot);
					nodePos.y -= scrollTop;
				}
			}
		}
		el = (el != scrollRoot) && !fixedPos && el.parentNode;
	}
	}catch(error){
		console.error('scrollIntoView: ' + error);
		node.scrollIntoView(false);
	}
};
