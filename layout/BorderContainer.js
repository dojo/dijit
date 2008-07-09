dojo.provide("dijit.layout.BorderContainer");

dojo.require("dijit.layout._LayoutWidget");
dojo.require("dojo.cookie");

dojo.declare(
	"dijit.layout.BorderContainer",
//	[dijit._Widget, dijit._Container, dijit._Contained],
	dijit.layout._LayoutWidget,
{
	// summary:
	//	Provides layout in 5 regions, a center and borders along its 4 sides.
	//
	// description:
	//	A BorderContainer is a box with a specified size (like style="width: 500px; height: 500px;"),
	//	that contains a child widget marked region="center" and optionally children widgets marked
	//	region equal to "top", "bottom", "leading", "trailing", "left" or "right".
	//	Children along the edges will be laid out according to width or height dimensions.  The remaining
	//	space is designated for the center region.
	//	The outer size must be specified on the BorderContainer node.  Width must be specified for the sides
	//  and height for the top and bottom, respectively.  No dimensions should be specified on the center;
	//	it will fill the remaining space.  Regions named "leading" and "trailing" may be used just like
	//	"left" and "right" except that they will be reversed in right-to-left environments.
	//  Optional splitters may be specified on the edge widgets only to make them resizable by the user.
	//
	// example:
	// |	<style>
	// |		html, body { height: 100%; width: 100%; }
	// |	</style>
	// |	<div dojoType="BorderContainer" design="sidebar" style="width: 100%; height: 100%">
	// |		<div dojoType="ContentPane" region="top">header text</div>
	// |		<div dojoType="ContentPane" region="right" style="width: 200px;">table of contents</div>
	// |		<div dojoType="ContentPane" region="center">client area</div>
	// |	</div>

	// design: String
	//  choose which design is used for the layout: "headline" (default) where the top and bottom extend
	//  the full width of the container, or "sidebar" where the left and right sides extend from top to bottom.
	design: "headline",

	// gutters: Boolean
	//	Give each pane a border and margin.
	//	Margin determined by domNode.paddingLeft.
	//	When false, only resizable panes have a gutter (i.e. draggable splitter) for resizing.
	gutters: true,

	// liveSplitters: Boolean
	//  specifies whether splitters resize as you drag (true) or only upon mouseup (false)
	liveSplitters: true,

	// persist: Boolean
	//		Save splitter positions in a cookie.
	persist: false,	// Boolean

	// class: String
	//	Class name to apply to this.domNode
	"class": "dijitBorderContainer",

	// _splitterClass: String
	// 		Optional hook to override the default Splitter widget used by BorderContainer
	_splitterClass: "dijit.layout._Splitter",

	postMixInProperties: function(){
		// change class name to indicate that BorderContainer is being used purely for
		// layout (like LayoutContainer) rather than for pretty formatting.
		if(!this.gutters && !("class" in this.params)){
			this["class"] += "NoGutter";
		}
	},

	postCreate: function(){
		this.inherited(arguments);

		this._splitters = {};
		this._splitterThickness = {};
	},

	startup: function(){
		if(this._started){ return; }
		dojo.forEach(this.getChildren(), function(child){
			this._setupChild(child);
			var region = child.region;
			if(this._splitters[region]){
				dojo.place(this._splitters[region], child.domNode, "after");
				this._computeSplitterThickness(region); // redundant?
			}
		}, this);
		this.inherited(arguments);
	},

	_setupChild: function(/*Widget*/child){
		var region = child.region;
		if(region){
			this.inherited(arguments);

			// set position directly; we could set a class name like dijitBorderContainerPane with
			// position:absolute but it might be overridden by (for example) a position:relative
			// in the dijitTabContainer class
			child.domNode.style.position = "absolute";

			var ltr = this.isLeftToRight();
			if(region == "leading"){ region = ltr ? "left" : "right"; }
			if(region == "trailing"){ region = ltr ? "right" : "left"; }

			//FIXME: redundant?
			this["_"+region] = child.domNode;
			this["_"+region+"Widget"] = child;

			// Create draggable splitter for resizing pane.
			if(child.splitter && !this._splitters[region]){
				var _Splitter = dojo.getObject(this._splitterClass);
				var flip = {left:'right', right:'left', top:'bottom', bottom:'top', leading:'trailing', trailing:'leading'};
				var oppNodeList = dojo.query('[region=' + flip[child.region] + ']', this.domNode);
				var splitter = new _Splitter({
					container: this,
					child: child,
					region: region,
					oppNode: oppNodeList[0],
					live: this.liveSplitters
				});
				this._splitters[region] = splitter.domNode;
			}
			child.region = region;
		}
	},

	_computeSplitterThickness: function(region){
		var re = new RegExp("top|bottom");
		this._splitterThickness[region] =
			dojo.marginBox(this._splitters[region])[(re.test(region) ? 'h' : 'w')];
	},

	layout: function(){
		this._layoutChildren();
	},

	addChild: function(/*Widget*/ child, /*Integer?*/ insertIndex){
		this.inherited(arguments);
		if(this._started){
			this._layoutChildren(); //OPT
		}
	},

	removeChild: function(/*Widget*/ child){
		var region = child.region;
		var splitter = this._splitters[region];
		if(splitter){
			dijit.byNode(splitter).destroy();
			delete this._splitters[region];
			delete this._splitterThickness[region];
		}
		this.inherited(arguments);
		delete this["_"+region];
		delete this["_" +region+"Widget"];
		if(this._started){
			this._layoutChildren(child.region);
		}
		this.inherited(arguments);
	},

	_layoutChildren: function(/*String?*/changedRegion){
		var sidebarLayout = (this.design == "sidebar");
		var topHeight = 0, bottomHeight = 0, leftWidth = 0, rightWidth = 0;
		var topStyle = {}, leftStyle = {}, rightStyle = {}, bottomStyle = {},
			centerStyle = (this._center && this._center.style) || {};

		var changedSide = /left|right/.test(changedRegion);

		// resetting potential padding to 0px to provide support for 100% width/height + padding
		// TODO: this hack doesn't respect the box model and is a temporary fix
		if (!this.cs || !this.pe){
			this.cs = dojo.getComputedStyle(this.domNode);
			this.pe = dojo._getPadExtents(this.domNode, this.cs);
			this.pe.r = parseFloat(this.cs.paddingRight); this.pe.b = parseFloat(this.cs.paddingBottom);

			dojo.style(this.domNode, "padding", "0px");
		}

		var cs = this.cs;
		var pe = this.pe;

		var layoutSides = !changedRegion || (!changedSide && !sidebarLayout);
		var layoutTopBottom = !changedRegion || (changedSide && sidebarLayout);
		if(this._top){
			topStyle = layoutTopBottom && this._top.style;
			topHeight = dojo.marginBox(this._top).h;
		}
		if(this._left){
			leftStyle = layoutSides && this._left.style;
			leftWidth = dojo.marginBox(this._left).w;
		}
		if(this._right){
			rightStyle = layoutSides && this._right.style;
			rightWidth = dojo.marginBox(this._right).w;
		}
		if(this._bottom){
			bottomStyle = layoutTopBottom && this._bottom.style;
			bottomHeight = dojo.marginBox(this._bottom).h;
		}

		var splitters = this._splitters;
		var topSplitter = splitters.top;
		var bottomSplitter = splitters.bottom;
		var leftSplitter = splitters.left;
		var rightSplitter = splitters.right;
		var splitterThickness = this._splitterThickness;
		var topSplitterThickness = splitterThickness.top || (this.gutters ? pe.t : 0);
		var leftSplitterThickness = splitterThickness.left || (this.gutters ? pe.l : 0);
		var rightSplitterThickness = splitterThickness.right || (this.gutters ? pe.r : 0);
		var bottomSplitterThickness = splitterThickness.bottom || (this.gutters ? pe.b : 0);

		// Check for race condition where CSS hasn't finished loading, so
		// the splitter width == the viewport width (#5824)
		if(leftSplitterThickness > 50 || rightSplitterThickness > 50){
			setTimeout(dojo.hitch(this, function(){
				for(var region in this._splitters){
					this._computeSplitterThickness(region);
				}
				this._layoutChildren();
			}), 50);
			return false;
		}

		var splitterBounds = {
			left: (sidebarLayout ? leftWidth + leftSplitterThickness: 0) + pe.l + "px",
			right: (sidebarLayout ? rightWidth + rightSplitterThickness: 0) + pe.r + "px"
		};

		if(topSplitter){
			dojo.mixin(topSplitter.style, splitterBounds);
			topSplitter.style.top = topHeight + pe.t + "px";
		}

		if(bottomSplitter){
			dojo.mixin(bottomSplitter.style, splitterBounds);
			bottomSplitter.style.bottom = bottomHeight + pe.b + "px";
		}

		splitterBounds = {
			top: (sidebarLayout ? 0 : topHeight + topSplitterThickness) + pe.t + "px",
			bottom: (sidebarLayout ? 0 : bottomHeight + bottomSplitterThickness) + pe.b + "px"
		};

		if(leftSplitter){
			dojo.mixin(leftSplitter.style, splitterBounds);
			leftSplitter.style.left = leftWidth + pe.l + "px";
		}

		if(rightSplitter){
			dojo.mixin(rightSplitter.style, splitterBounds);
			rightSplitter.style.right = rightWidth + pe.r +  "px";
		}

		dojo.mixin(centerStyle, {
			top: pe.t + topHeight + topSplitterThickness + "px",
			left: pe.l + leftWidth + leftSplitterThickness + "px",
			right: pe.r + rightWidth + rightSplitterThickness + "px",
			bottom: pe.b + bottomHeight + bottomSplitterThickness + "px"
		});

		var bounds = {
			top: sidebarLayout ? pe.t + "px" : centerStyle.top,
			bottom: sidebarLayout ? pe.b + "px" : centerStyle.bottom
		};
		dojo.mixin(leftStyle, bounds);
		dojo.mixin(rightStyle, bounds);
		leftStyle.left = pe.l + "px"; rightStyle.right = pe.r + "px"; topStyle.top = pe.t + "px"; bottomStyle.bottom = pe.b + "px";
		if(sidebarLayout){
			topStyle.left = bottomStyle.left = leftWidth + (this.isLeftToRight() ? leftSplitterThickness : 0) + pe.l + "px";
			topStyle.right = bottomStyle.right = rightWidth + (this.isLeftToRight() ? 0 : rightSplitterThickness) + pe.r + "px";
		}else{
			topStyle.left = bottomStyle.left = pe.l + "px";
			topStyle.right = bottomStyle.right = pe.r + "px";
		}

		// Nodes in IE don't respond to t/l/b/r, and TEXTAREA doesn't respond in any browser
		var janky = dojo.isIE || dojo.some(this.getChildren(), function(child){
			return child.domNode.tagName == "TEXTAREA";
		});
		if(janky){
			// Set the size of the children the old fashioned way, by calling
			// childNode.resize({h: int, w: int}) for each child node)

			var borderBox = function(n, b, s){
				n=dojo.byId(n);
				s = s || dojo.getComputedStyle(n);
				if(!b){ return dojo._getBorderBox(n, s); }
				var me = dojo._getMarginExtents(n, s);
				dojo._setMarginBox(n, b.l, b.t, b.w + me.w, b.h + me.h, s);
				return null;
			};

			var resizeWidget = function(widget, dim){
				if(widget){
					(widget.resize ? widget.resize(dim) : dojo.marginBox(widget.domNode, dim));
				}
			};

			// TODO: use dim passed in to resize() (see _LayoutWidget.js resize())
			// Then can make borderBox setBorderBox(), since no longer need to ever get the borderBox() size
			var thisBorderBox = borderBox(this.domNode, null, cs);

			var containerHeight = thisBorderBox.h - pe.t - pe.b;
			var middleHeight = containerHeight;
			if(this._top){ middleHeight -= topHeight; }
			if(this._bottom){ middleHeight -= bottomHeight; }
			if(topSplitter){ middleHeight -= topSplitterThickness; }
			if(bottomSplitter){ middleHeight -= bottomSplitterThickness; }
			var centerDim = { h: middleHeight };

			var sidebarHeight = sidebarLayout ? containerHeight : middleHeight;
			if(leftSplitter){ leftSplitter.style.height = sidebarHeight; }
			if(rightSplitter){ rightSplitter.style.height = sidebarHeight; }
			resizeWidget(this._leftWidget, {h: sidebarHeight});
			resizeWidget(this._rightWidget, {h: sidebarHeight});

			var containerWidth = thisBorderBox.w - pe.l - pe.r;
			var middleWidth = containerWidth;
			if(this._left){ middleWidth -= leftWidth; }
			if(this._right){ middleWidth -= rightWidth; }
			if(leftSplitter){ middleWidth -= leftSplitterThickness; }
			if(rightSplitter){ middleWidth -= rightSplitterThickness; }
			centerDim.w = middleWidth;

			var sidebarWidth = sidebarLayout ? middleWidth : containerWidth;
			if(topSplitter){ topSplitter.style.width = sidebarWidth; }
			if(bottomSplitter){ bottomSplitter.style.width = sidebarWidth; }
			resizeWidget(this._topWidget, {w: sidebarWidth});
			resizeWidget(this._bottomWidget, {w: sidebarWidth});

			resizeWidget(this._centerWidget, centerDim);
		}else{

			// We've already sized the children by setting style.top/bottom/left/right...
			// Now just need to call resize() on those children so they can re-layout themselves

			// TODO: calling child.resize() without an argument is bad, because it forces
			// the child to query it's own size (even though this function already knows
			// the size), plus which querying the size of a node right after setting it
			// is known to cause problems (incorrect answer or an exception).
			// This is a setback from older layout widgets, which
			// don't do that.  See #3399, #2678, #3624 and #2955, #1988

			var resizeList = {};
			if(changedRegion){
				resizeList[changedRegion] = resizeList.center = true;
				if(/top|bottom/.test(changedRegion) && this.design != "sidebar"){
					resizeList.left = resizeList.right = true;
				}else if(/left|right/.test(changedRegion) && this.design == "sidebar"){
					resizeList.top = resizeList.bottom = true;
				}
			}

			dojo.forEach(this.getChildren(), function(child){
				if(child.resize && (!changedRegion || child.region in resizeList)){
	//				console.log(this.id, ": resizing child id=" + child.id + " (region=" + child.region + "), style before resize is " +
	//									 "{ t: " + child.domNode.style.top +
	//									", b: " + child.domNode.style.bottom +
	//									", l: " + child.domNode.style.left +
	//									 ", r: " + child.domNode.style.right +
	//									 ", w: " + child.domNode.style.width +
	//									 ", h: " + child.domNode.style.height +
	//									"}"
	//						);
					child.resize();
	//				console.log(this.id, ": after resize of child id=" + child.id + " (region=" + child.region + ") " +
	//									 "{ t: " + child.domNode.style.top +
	//									", b: " + child.domNode.style.bottom +
	//									", l: " + child.domNode.style.left +
	//									 ", r: " + child.domNode.style.right +
	//									 ", w: " + child.domNode.style.width +
	//									 ", h: " + child.domNode.style.height +
	//									"}"
	//						);
				}
			}, this);
		}
	}
});

// This argument can be specified for the children of a BorderContainer.
// Since any widget can be specified as a LayoutContainer child, mix it
// into the base widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit._Widget, {
	// region: String
	//		"top", "bottom", "leading", "trailing", "left", "right", "center".
	//		See the BorderContainer description for details on this parameter.
	region: '',

	// splitter: Boolean
	splitter: false,

	// minSize: Number
	minSize: 0,

	// maxSize: Number
	maxSize: Infinity
});

dojo.require("dijit._Templated");

dojo.declare("dijit.layout._Splitter", [ dijit._Widget, dijit._Templated ],
{
/*=====
	container: null,
	child: null,
	region: null,
=====*/

	// live: Boolean
	//		If true, the child's size changes and the child widget is redrawn as you drag the splitter;
	//		otherwise, the size doesn't change until you drop the splitter (by mouse-up)
	live: true,

	// summary: A draggable spacer between two items in a BorderContainer
	templateString: '<div class="dijitSplitter" dojoAttachEvent="onkeypress:_onKeyPress,onmousedown:_startDrag" tabIndex="0" waiRole="separator"><div class="dijitSplitterThumb"></div></div>',

	postCreate: function(){
		this.inherited(arguments);
		this.horizontal = /top|bottom/.test(this.region);
		dojo.addClass(this.domNode, "dijitSplitter" + (this.horizontal ? "H" : "V"));
//		dojo.addClass(this.child.domNode, "dijitSplitterPane");
//		dojo.setSelectable(this.domNode, false); //TODO is this necessary?

		this._factor = /top|left/.test(this.region) ? 1 : -1;
		this._minSize = this.child.minSize;

		this._computeMaxSize();
		//TODO: might be more accurate to recompute constraints on resize?
		this.connect(this.container, "layout", dojo.hitch(this, this._computeMaxSize));

		this._cookieName = this.container.id + "_" + this.region;
		if(this.container.persist){
			// restore old size
			var persistSize = parseInt(dojo.cookie(this._cookieName));
			if(persistSize){
				this.child.domNode.style[this.horizontal ? "height" : "width"] = persistSize;
			}
		}
	},

	_computeMaxSize: function(){
		var dim = this.horizontal ? 'h' : 'w';
		var available = dojo.contentBox(this.container.domNode)[dim] - (this.oppNode ? dojo.marginBox(this.oppNode)[dim] : 0);
		this._maxSize = Math.min(this.child.maxSize, available);
	},

	_startDrag: function(e){
		if(!this.cover){
			this.cover = dojo.doc.createElement('div');
			dojo.addClass(this.cover, "dijitSplitterCover");
			dojo.place(this.cover, this.child.domNode, "after");
		}else{
			this.cover.style.zIndex = 1;
		}

		// Safeguard in case the stop event was missed.  Shouldn't be necessary if we always get the mouse up.
		if(this.fake){ dojo._destroyElement(this.fake); }
		if(!(this._resize = this.live)){ //TODO: disable live for IE6?
			// create fake splitter to display at old position while we drag
			(this.fake = this.domNode.cloneNode(true)).removeAttribute("id");
			dojo.addClass(this.domNode, "dijitSplitterShadow");
			dojo.place(this.fake, this.domNode, "after");
		}
		dojo.addClass(this.domNode, "dijitSplitterActive");

		//Performance: load data info local vars for onmousevent function closure
		var factor = this._factor,
			max = this._maxSize,
			min = this._minSize || 10;
		var axis = this.horizontal ? "pageY" : "pageX";
		var pageStart = e[axis];
		var splitterStyle = this.domNode.style;
		var dim = this.horizontal ? 'h' : 'w';
		var childStart = dojo.marginBox(this.child.domNode)[dim];
		var splitterStart = parseInt(this.domNode.style[this.region]);
		var resize = this._resize;
		var region = this.region;
		var mb = {};
		var childNode = this.child.domNode;
		var layoutFunc = dojo.hitch(this.container, this.container._layoutChildren);

		var de = dojo.doc.body;
		this._handlers = (this._handlers || []).concat([
			dojo.connect(de, "onmousemove", this._drag = function(e, forceResize){
				var delta = e[axis] - pageStart,
					childSize = factor * delta + childStart,
					boundChildSize = Math.max(Math.min(childSize, max), min);

				if(resize || forceResize){
					mb[dim] = boundChildSize;
					// TODO: inefficient; we set the marginBox here and then immediately layoutFunc() needs to query it
					dojo.marginBox(childNode, mb);
					layoutFunc(region);
				}
				splitterStyle[region] = factor * delta + splitterStart + (boundChildSize - childSize) + "px";
			}),
			dojo.connect(de, "onmouseup", this, "_stopDrag")
		]);
		dojo.stopEvent(e);
	},

	_stopDrag: function(e){
		try{
			if(this.cover){ this.cover.style.zIndex = -1; }
			if(this.fake){ dojo._destroyElement(this.fake); }
			dojo.removeClass(this.domNode, "dijitSplitterActive");
			dojo.removeClass(this.domNode, "dijitSplitterShadow");
			this._drag(e); //TODO: redundant with onmousemove?
			this._drag(e, true);
		}finally{
			this._cleanupHandlers();
			delete this._drag;
		}

		if(this.container.persist){
			dojo.cookie(this._cookieName, this.child.domNode.style[this.horizontal ? "height" : "width"]);
		}
	},

	_cleanupHandlers: function(){
		dojo.forEach(this._handlers, dojo.disconnect);
		delete this._handlers;
	},

	_onKeyPress: function(/*Event*/ e){
		// should we apply typematic to this?
		this._resize = true;
		var horizontal = this.horizontal;
		var tick = 1;
		var dk = dojo.keys;
		switch(e.charOrCode){
			case horizontal ? dk.UP_ARROW : dk.LEFT_ARROW:
				tick *= -1;
				break;
			case horizontal ? dk.DOWN_ARROW : dk.RIGHT_ARROW:
				break;
			default:
//				this.inherited(arguments);
				return;
		}
		var childSize = dojo.marginBox(this.child.domNode)[ horizontal ? 'h' : 'w' ] + this._factor * tick;
		var mb = {};
		mb[ this.horizontal ? "h" : "w"] = Math.max(Math.min(childSize, this._maxSize), this._minSize);
		dojo.marginBox(this.child.domNode, mb);
		this.container._layoutChildren(this.region);
		dojo.stopEvent(e);
	},

	destroy: function(){
		this._cleanupHandlers();
		delete this.child;
		delete this.container;
		delete this.fake;
		this.inherited(arguments);
	}
});

