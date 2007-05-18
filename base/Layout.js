dojo.provide("dijit.base.Layout");

dojo.require("dijit.base.Container");

dojo.declare("dijit.base.Sizable", 
	null,
	{
		// summary
		//		Helper mixin for widgets that can have their size adjusted,
		//		and that need to do some processing when their size changes (like SplitContainer)

		resize: function(mb){
			// summary:
			//		Explicitly set this widget's size (in pixels), 
			//		and then call layout() to resize contents (and maybe adjust child widgets)
			//	
			// mb: Object?
			//		{w: int, h: int, l: int, t: int}

			// set margin box size, unless it wasn't specified, in which case use current size
			if(mb){
				dojo.marginBox(this.domNode, mb);
			}
			mb = dojo.marginBox(this.domNode);

			// set offset of the node
			with(this.domNode.style){
				if(mb.t){ top = mb.t + "px"; }
				if(mb.l){ left = mb.l + "px"; }
			}

			// Save the size of my content box.
			// TODO: this calculation is wrong; need to include borders, etc.
			// I could just call dojo.contentBox() except that it might return 0, if the pane is hidden
			// or the browser hasn't had time to do calculations; this is more reliable.
			var cs = dojo.getComputedStyle(this.domNode);
			var me=dojo._getMarginExtents(this.domNode, cs);
			var pb=dojo._getPadBounds(this.domNode, cs);
			this._contentBox = { l: pb.l, t: pb.t, w: mb.w - me.w - pb.w, h: mb.h - me.h - pb.h };
			
			// Callback for widget to adjust size of it's children
			this.layout();
		},
	
		layout: function(){
			//	summary
			//		Widgets override this method to size & position their contents/children.
			//		When this is called this._contentBox is guaranteed to be set (see resize()).
			//
			//		This is called after startup(), and also when the widget's size has been
			//		changed.
		}
	}
);

dojo.declare("dijit.base.Layout", 
	[dijit.base.Sizable, dijit.base.Container, dijit.base.Contained, dijit.base.Showable],
	{
		// summary
		//		Mixin for widgets that contain a list of children like SplitContainer.
		//		Widgets which mixin this code must define layout() to lay out the children

		isLayoutContainer: true,

		startup: function(){
			// summary:
			//		Called after all the widgets have been instantiated and their
			//		dom nodes have been inserted somewhere under document.body.
			//
			//		Widgets should override this method to do any initialization
			//		dependent on other widgets existing, and then call
			//		this superclass method to finish things off.
			//
			//		startup() in subclasses shouldn't do anything
			//		size related because the size of the widget hasn't been set yet.

			if(this._started){
				return;
			}
			this._started=true;

			if(this.getChildren){
				dojo.forEach(this.getChildren(), function(child){ child.startup(); });
			}

			// If I am a top level widget
			if(!this.getParent || !this.getParent()){
				// Do recursive sizing and layout of all my descendants
				this.resize();

				// since my parent isn't a layout container, and my style is width=height=100% (or something similar),
				// then I need to watch when the window resizes, and size myself accordingly
				this.connect(window, 'onresize', "resize");
			}
		}
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
		
	// contentBox gives you the whole box (l, t, w, h)
	f = dojo.contentBox(container);

	var ret = true;
	// set positions/sizes
	dojo.forEach(children, function(child){
		var elm=child.domNode;
		var pos=child.layoutAlign;
		// set elem to upper left corner of unused space; may move it later
		var elmStyle = elm.style;
		elmStyle.left = f.l+"px";
		elmStyle.top = f.t+"px";
		elmStyle.bottom = elmStyle.right = "auto";

		var capitalize = function(word){
			return word.substring(0,1).toUpperCase() + word.substring(1);
		};
		
		dojo.addClass(elm, "dojoAlign" + capitalize(pos));

		// set size && adjust record of remaining space.
		// note that setting the width of a <div> may affect it's height.
		// TODO: same is true for widgets but need to implement API to support that
		if (pos=="top" || pos=="bottom"){
			if(child.resize){
				child.resize({w: f.w});
			}else{
				dojo.marginBox(elm, { w: f.w });
			}
			var h = dojo.marginBox(elm).h;
			f.h -= h;
			if(pos=="top"){
				f.t += h;
			}else{
				elmStyle.top = f.t + f.h + "px";
			}
		}else if(pos=="left" || pos=="right"){
			var w = dojo.marginBox(elm).w;

			// TODO: this zero stuff shouldn't be necessary anymore
			var hasZero = dijit.base.Layout._sizeChild(child, elm, w, f.h);
			if(hasZero){
				ret = false;
			}
			f.w -= w;
			if(pos=="left"){
				f.l += w;
			}else{
				elmStyle.left = f.l + f.w + "px";
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


