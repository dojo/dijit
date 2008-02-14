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
	//	<style>
	//		html, body { height: 100%; width: 100%; }
	//	</style>
	//	<div dojoType="BorderContainer" design="sidebar" style="width: 100%; height: 100%">
	//		<div dojoType="ContentPane" region="top">header text</div>
	//		<div dojoType="ContentPane" region="right" style="width: 200px;">table of contents</div>
	//		<div dojoType="ContentPane" region="center">client area</div>
	//	</div>

	// design: String
	//  choose which design is used for the layout: "headline" (default) where the top and bottom extend
	//  the full width of the container, or "sidebar" where the left and right sides extend from top to bottom.
	design: "headline",

	// liveSplitters: Boolean
	//  specifies whether splitters resize as you drag (true) or only upon mouseup (false)
	liveSplitters: true,

	// persist: Boolean
	//		Save splitter positions in a cookie.
	persist: false,	// Boolean

	postCreate: function(){
		this.inherited(arguments);

		this._splitters = {};
		this.domNode.style.position = "relative";
		dojo.addClass(this.domNode, "dijitBorderContainer");
	},

	startup: function(){
		if(this._started){ return; }
		dojo.forEach(this.getChildren(), this._setupChild, this);
		this.inherited(arguments);
	},

	_setupChild: function(/*Widget*/child){
		var region = child.region;
		if(region){
			dojo.addClass(child.domNode, "dijitBorderContainerPane");
			child.domNode.style.position = "absolute"; //FIXME: for some reason, setting this in CSS isn't good enough?

			var ltr = dojo._isBodyLtr();
			if(region == "leading"){ region = ltr ? "left" : "right"; }
			if(region == "trailing"){ region = ltr ? "right" : "left"; }

			this["_"+region] = child.domNode;

			if(child.splitter){
				var flip = {left:'right', right:'left', top:'bottom', bottom:'top'};
				var oppNodeList = dojo.query('[region=' + flip[child.region] + ']', this.domNode);
				var splitter = new dijit.layout._Splitter({ container: this, child: child, region: region, oppNode: oppNodeList[0], live: this.liveSplitters });
				this._splitters[region] = splitter.domNode;
				dojo.place(splitter.domNode, child.domNode, "after");
			}
		}
	},

	layout: function(){
		this._layoutChildren();
	},

	addChild: function(/*Widget*/ child, /*Integer?*/ insertIndex){
		this.inherited(arguments);
		this._setupChild(child);
		if(this._started){
			this._layoutChildren();
		}
	},

	removeChild: function(/*Widget*/ child){
		var region = child.region;
		var splitter = this._splitters[region];
		if(splitter){
			dijit.byNode(splitter).destroy();
			delete this._splitters[region];
		}
		this.inherited(arguments);
		delete this["_"+region];
		if(this._started){
			this._layoutChildren();
		}
	},

	_layoutChildren: function(){
		var sidebarLayout = (this.design == "sidebar");
		var topHeight = 0, bottomHeight = 0, leftWidth = 0, rightWidth = 0;
		var topStyle = {}, leftStyle = {}, rightStyle = {}, bottomStyle = {},
			centerStyle = (this._center && this._center.style) || {};

		if(this._top){
			topStyle = this._top.style;
			topHeight = dojo.marginBox(this._top).h;
		}
		if(this._left){
			leftStyle = this._left.style;
			leftWidth = dojo.marginBox(this._left).w;
		}
		if(this._right){
			rightStyle = this._right.style;
			rightWidth = dojo.marginBox(this._right).w;
		}
		if(this._bottom){
			bottomStyle = this._bottom.style;
			bottomHeight = dojo.marginBox(this._bottom).h;
		}

		var topSplitter = this._splitters.top;
		var bottomSplitter = this._splitters.bottom;
		var leftSplitter = this._splitters.left;
		var rightSplitter = this._splitters.right;
		var topSplitterSize = topSplitter ? dojo.marginBox(topSplitter).h : 0;
		var leftSplitterSize = leftSplitter ? dojo.marginBox(leftSplitter).w : 0;
		var rightSplitterSize = rightSplitter ? leftSplitterSize || dojo.marginBox(rightSplitter).w: 0;
		var bottomSplitterSize = bottomSplitter ? topSplitterSize || dojo.marginBox(bottomSplitter).h: 0;

		// Check for race condition where CSS hasn't finished loading, so
		// the splitter width == the viewport width (#5824)
		if(leftSplitterSize > 50 || rightSplitterSize > 50){
			setTimeout(dojo.hitch(this, "_layoutChildren"), 50);
			return false;
		}

		var splitterBounds = {
			left: (sidebarLayout ? leftWidth + leftSplitterSize: "0") + "px",
			right: (sidebarLayout ? rightWidth + rightSplitterSize: "0") + "px"
		};

		if(topSplitter){
			dojo.mixin(topSplitter.style, splitterBounds);
			topSplitter.style.top = topHeight + "px";
		}

		if(bottomSplitter){
			dojo.mixin(bottomSplitter.style, splitterBounds);
			bottomSplitter.style.bottom = bottomHeight + "px";
		}

		splitterBounds = {
			top: (sidebarLayout ? "0" : topHeight + topSplitterSize) + "px",
			bottom: (sidebarLayout ? "0" : bottomHeight + bottomSplitterSize) + "px"
		};

		if(leftSplitter){
			dojo.mixin(leftSplitter.style, splitterBounds);
			leftSplitter.style.left = leftWidth + "px";
		}

		if(rightSplitter){
			dojo.mixin(rightSplitter.style, splitterBounds);
			rightSplitter.style.right = rightWidth + "px";
		}

		dojo.mixin(centerStyle, {
			top: topHeight + topSplitterSize + "px",
			left: leftWidth + leftSplitterSize + "px",
			right:  rightWidth + rightSplitterSize + "px",
			bottom: bottomHeight + bottomSplitterSize + "px"
		});

		var bounds = {
			top: sidebarLayout ? "0" : centerStyle.top,
			bottom: sidebarLayout ? "0" : centerStyle.bottom
		};
		dojo.mixin(leftStyle, bounds);
		dojo.mixin(rightStyle, bounds);
		leftStyle.left = rightStyle.right = topStyle.top = bottomStyle.bottom = "0";
		if(sidebarLayout){
			topStyle.left = bottomStyle.left = leftWidth + (dojo._isBodyLtr() ? leftSplitterSize : 0) + "px";
			topStyle.right = bottomStyle.right = rightWidth + (dojo._isBodyLtr() ? 0 : rightSplitterSize) + "px";
		}else{
			topStyle.left = topStyle.right = bottomStyle.left = bottomStyle.right = "0";
		}

		// TEXTAREA elements in Gecko or Safari don't respond to t/l/b/r
		var janky = dojo.some(this.getChildren(), function(child){
			return child.domNode.tagName == "TEXTAREA";
		});
		if(janky || dojo.isIE){
			var borderBox = function(n, b){
				n=dojo.byId(n);
				var s = dojo.getComputedStyle(n);
				if(!b){ return dojo._getBorderBox(n, s); }
				var me = dojo._getMarginExtents(n, s);
				dojo._setMarginBox(n, b.l, b.t, b.w + me.w, b.h + me.h, s);
				return null;
			}

//TODO: use dim passed in? and make borderBox setBorderBox?
			var thisBorderBox = borderBox(this.domNode);

			var containerHeight = thisBorderBox.h;
			var middleHeight = containerHeight;
			if(this._top){ middleHeight -= topHeight; }
			if(this._bottom){ middleHeight -= bottomHeight; }
			if(topSplitter){ middleHeight -= topSplitterSize; }
			if(bottomSplitter){ middleHeight -= bottomSplitterSize; }
			var centerDim = { h: middleHeight };
			var sidebarHeight = sidebarLayout ? containerHeight : middleHeight;
			if(leftSplitter){ leftSplitter.style.height = sidebarHeight; }
			if(rightSplitter){ rightSplitter.style.height = sidebarHeight; }
			if(this._left){ borderBox(this._left, {h: sidebarHeight}); }
			if(this._right){ borderBox(this._right, {h: sidebarHeight}); }

			if(janky || (dojo.isIE && (dojo.doc.compatMode == "BackCompat" || dojo.isIE < 7))){
//TODO: use dojo.marginBox instead of dojo.style?
				var containerWidth = thisBorderBox.w;
				var middleWidth = containerWidth;
				if(this._left){ middleWidth -= leftWidth; }
				if(this._right){ middleWidth -= rightWidth; }
				if(leftSplitter){ middleWidth -= leftSplitterSize; }
				if(rightSplitter){ middleWidth -= rightSplitterSize; }
				centerDim.w = middleWidth;
				var sidebarWidth = sidebarLayout ? middleWidth : containerWidth;
				if(topSplitter){ topSplitter.style.width = sidebarWidth; }
				if(bottomSplitter){ bottomSplitter.style.width = sidebarWidth; }
				if(this._top){ borderBox(this._top, {w: sidebarWidth}); }
				if(this._bottom){ borderBox(this._bottom, {w: sidebarWidth}); }
			}
			if(this._center){ borderBox(this._center, centerDim); }
		}

/*
TODO bill says: you call child.resize() without an
argument, which means that right after the BorderContainer sets the size
of a child widget, the child will have to query it's own size, which was
known to cause problems (ie, give an incorrect answer or an exception)
in the past.  This is a setback from the current layout widgets, which
don't do that.  See #3399, #2678, #3624 and #2955, #1988
*/
		dojo.forEach(this.getChildren(), function(child){
			if(child.resize){
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
});

// This argument can be specified for the children of a BorderContainer.
// Since any widget can be specified as a LayoutContainer child, mix it
// into the base widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit._Widget, {
	// region: String
	//		"top", "bottom", "leading", "trailing", "left", "right", "center".
	//		See the BorderContainer description for details on this parameter.
	region: 'none',

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
		dojo.addClass(this.domNode, "dijitSplitter" + (this.horizontal ? "Horizontal" : "Vertical"));
//		dojo.addClass(this.child.domNode, "dijitSplitterPane");
//		dojo.setSelectable(this.domNode, false); //TODO is this necessary?

		this._factor = /top|left/.test(this.region) ? 1 : -1;
		this._minSize = this.child.minSize;

		this._cookieName = this.container.id + "_" + this.region;
		if(this.container.persist){
			// restore old size
			var persistSize = dojo.cookie(this._cookieName);
			if(persistSize){
				this.child.domNode.style[this.horizontal ? "height" : "width"] = persistSize;
			}
		}
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
		var horizontal = this.horizontal;
		this._pageStart = horizontal ? e.pageY : e.pageX;
		var dim = horizontal ? 'h' : 'w';
		this._childStart = dojo.marginBox(this.child.domNode)[dim];
		this._splitterStart = parseInt(this.domNode.style[this.region]);
		var de = dojo.doc.body;
		this._handlers = (this._handlers || []).concat([
			dojo.connect(de, "onmousemove", this, "_drag"),
			dojo.connect(de, "onmouseup", this, "_stopDrag")
		]);
		this._computeMaxSize();
		dojo.stopEvent(e);
	},

	_computeMaxSize: function(){
		var dim = this.horizontal ? 'h' : 'w';
		var available = dojo.contentBox(this.container.domNode)[dim] - (this.oppNode ? dojo.marginBox(this.oppNode)[dim] : 0); //FIXME: what if this.oppNode is undefined?
		this._maxSize = Math.min(this.child.maxSize, available);
	},

	_drag: function(e){
		var delta = (this.horizontal ? e.pageY : e.pageX) - this._pageStart;
		if(this._resize){
			this._move(delta, this._childStart);
		}else{
			var splitterEdge = this._factor * delta + this._splitterStart;
			var childSize = this._factor * delta + this._childStart;
			splitterEdge -= this._factor * (Math.max(Math.min(childSize, this._maxSize), this._minSize) - childSize);
			this.domNode.style[this.region] = splitterEdge + "px";
		}
		dojo.stopEvent(e);
	},

	_stopDrag: function(e){
		try{
			if(this.cover){ this.cover.style.zIndex = -1; }
			if(this.fake){ dojo._destroyElement(this.fake); }
			dojo.removeClass(this.domNode, "dijitSplitterActive");
			dojo.removeClass(this.domNode, "dijitSplitterShadow");
			this._drag(e);
			this._resize = true;
			this._drag(e);
		}finally{
			this._cleanupHandlers();
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
		switch(e.keyCode){
			case horizontal ? dk.UP_ARROW : dk.LEFT_ARROW:
				tick *= -1;
				break;
			case horizontal ? dk.DOWN_ARROW : dk.RIGHT_ARROW:
				break;
			default:
//				this.inherited(arguments);
				return;
		}
		this._computeMaxSize();
		this._move(tick, dojo.marginBox(this.child.domNode)[ horizontal ? 'h' : 'w' ]);
		dojo.stopEvent(e);
	},

	_move: function(/*Number*/delta, oldChildSize){
		var childSize = this._factor * delta + oldChildSize,
			mb = {};
		mb[ this.horizontal ? "h" : "w"] = Math.max(Math.min(childSize, this._maxSize), this._minSize);
		dojo.marginBox(this.child.domNode, mb);
		this.container.layout();
	},

	destroy: function(){
		this._cleanupHandlers();
		delete this.child;
		delete this.container;
		delete this.fake;
		this.inherited(arguments);
	}
});
