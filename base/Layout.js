dojo.provide("dijit.base.Layout");

dojo.require("dijit.base.Container");

dojo.declare("dijit.base.Sizable", 
	null,
	{
		// summary
		//		Helper mixin for widgets that can have their size adjusted,
		//		and that need to do some processing when their size changes (like SplitContainer)

		resize: function(param){
			// summary:
			//		explicitly set this widget's size (in pixels).
			//		called if our parent is a layout widget.
			//	
			// param: Object
			//		{w: int, h: int}

			param =	dojo.marginBox(this.domNode, param);
			this.onResized(param);
		},
	
		onResized: function(param){
			//	summary
			//		Layout widgets will override this method to size & position their children
			//	
			// param: Object
			//		{w: int, h: int}
		},
		
		startup: function(){
			// summary:
			//		Called after all the widgets have been instantiated and their
			//		dom nodes have been inserted somewhere under document.body

			// if my parent is a layout container then it will resize me; just wait for it's call
			if(this.getParent){
				var parent = this.getParent();
				if(parent && parent.isLayoutContainer){
					return;
				}
			}

			// if my parent isn't a layout container, and my style is width=height=100% (or something similar),
			// then I need to watch when the window resizes, and size myself accordingly
			dojo.addListener(window, 'onresize', this, this._onWindowResize); // window resize

			this._onWindowResize();
		},
		
		_onWindowResize: function(){
			// summary:
			//		Called when my size has been changed to an unknown value.
			//		If the size is explicitly changed by calling resize() this
			//		function is not called.
			// Size my children based on my size
			var size = dojo.marginBox(this.domNode);
			this.onResized(size);
		}
	}
);

dojo.declare("dijit.base.Layout", 
	[dijit.base.Container, dijit.base.Sizable],
	{
		// summary
		//		Mixin for widgets that contain a list of children like SplitContainer.
		//		Widgets which mixin this code must define onResized() to lay out the children

		isLayoutContainer: true
	}
);

dijit.base.Layout.layoutChildren = function(/*DomNode*/ container, /*Object[]*/ children, /*String*/ layoutPriority){
	/**
	 * summary
	 *		Layout a bunch of child dom nodes within a parent dom node
	 *		Returns true if successful, returns false if any of the children would 
	 * 		have been calculated to be hidden (typically if browser hasn't flowed the nodes)
	 *		In the latter case, a best-effort of the layout is done and the caller can
	 *		reschedule a layout at a later time - when the browser has more accurate metrics
	 * container:
	 *		parent node
	 * layoutPriority:
	 *		"top-bottom" or "left-right"
	 * children:
	 *		an array like [ {domNode: foo, layoutAlign: "bottom" }, {domNode: bar, layoutAlign: "client"} ]
	 */

	dojo.addClass(container, "dojoLayoutContainer");

	// Copy children array and remove elements w/out layout.
	// Also record each child's position in the input array, for sorting purposes.
	children = dojo.filter(children, function(child, idx){
		child.idx = idx;
		return dojo.indexOf(["top","bottom","left","right","client","flood"], child.layoutAlign) > -1;
	});

	// Order the children according to layoutPriority.
	// Multiple children w/the same layoutPriority will be sorted by their position in the input array.
	if(layoutPriority && layoutPriority!="none"){
		var rank = function(child){
			switch(child.layoutAlign){
				case "flood":
					return 1;
				case "left":
				case "right":
					return (layoutPriority=="left-right") ? 2 : 3;
				case "top":
				case "bottom":
					return (layoutPriority=="left-right") ? 3 : 2;
				default:
					return 4;
			}
		};
		children.sort(function(a,b){
			return (rank(a)-rank(b)) || (a.idx - b.idx);
		});
	}

	// REVISIT: we need getPixelValue to be public
	var _toPixelValue = function(element, value){
		// parseInt or parseFloat? (style values can be floats)
		return parseFloat(value) || 0; 
	}
	var px = _toPixelValue;
	
	// remaining space (blank area where nothing has been written)
	var f={
		top: px(container, dojo.getComputedStyle(container, "padding-top")),
		left: px(container, dojo.getComputedStyle(container, "padding-left"))
	};
	dojo.mixin(f, dojo.contentBox(container));

	var ret = true;
	// set positions/sizes
	dojo.forEach(children, function(child){
		var elm=child.domNode;
		var pos=child.layoutAlign;
		// set elem to upper left corner of unused space; may move it later
		var elmStyle = elm.style;
		elmStyle.left = f.left+"px";
		elmStyle.top = f.top+"px";
		elmStyle.bottom = elmStyle.right = "auto";

		var capitalize = function(word){
			return word.substring(0,1).toUpperCase() + word.substring(1);
		};
		
		dojo.addClass(elm, "dojoAlign" + capitalize(pos));

		// set size && adjust record of remaining space.
		// note that setting the width of a <div> may affect it's height.
		// TODO: same is true for widgets but need to implement API to support that
		if (pos=="top" || pos=="bottom"){
			// filter for zero widths (almost always invalid #1635)
			if(f.w != 0){
				dojo.marginBox(elm, { w: f.w });
			}
			var h = dojo.marginBox(elm).h;
			f.h -= h;
			if(pos=="top"){
				f.top += h;
			}else{
				elmStyle.top = f.top + f.h + "px";
			}
			// TODO: for widgets I want to call resizeTo(), but I can't because
			// I only want to set the width, and have the height determined
			// dynamically.  (The thinner you make a div, the more height it consumes.)
			if(child.onResized){
				child.onResized();
			}
		}else if(pos=="left" || pos=="right"){
			var w = dojo.marginBox(elm).w;

			// TODO: I only want to set the height, not the width, but see bug#941 (FF),
			// and also the resizeTo() function demands both height and width arguments
			// place the child, make sure to filter for zero widths and height
			var hasZero = dijit.base.Layout._sizeChild(child, elm, w, f.h);
			if(hasZero){
				ret = false;
			}
			f.w -= w;
			if(pos=="left"){
				f.left += w;
			}else{
				elmStyle.left = f.left + f.w + "px";
			}
		} else if(pos=="flood" || pos=="client"){
			// #1635 - filter for zero dimensions (see below)
			var hasZero = dijit.base.Layout._sizeChild(child, elm, f.w, f.h);
			if(hasZero){
				ret = false;
			}
		}
	});
	return ret;
};

dijit.base.Layout._sizeChild = function (child, elm, w, h){
	// Note: zero dimensions can occur if we are called before the browser
	// don't allow such values for width and height, let the browser adjust the
	// layout itself when it reflows and report if any dimension is zero
	var box = {};
	var hasZero = (w == 0 || h == 0);
	if(!hasZero){
		if(w != 0){
			box.w = w;
		}
		if(h != 0){
			box.h = h;
		}
		if(child.resize){
			child.resize(box);
		}else{
			dojo.marginBox(elm, box);
		}
	}
	return hasZero;
}


