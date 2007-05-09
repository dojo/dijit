dojo.provide("dijit.layout.SplitContainer");

//
// TODO
// make it prettier
// active dragging upwards doesn't always shift other bars (direction calculation is wrong in this case)
//

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.Showable");
dojo.require("dijit.base.Layout");

dojo.declare(
	"dijit.layout.SplitContainer",
	[dijit.base.Widget, dijit.base.Layout, dijit.base.Showable],
{
	// summary
	//		Contains multiple children widgets, all of which are displayed side by side
	//		(either horizontally or vertically); there's a bar between each of the children,
	//		and you can adjust the relative size of each child by dragging the bars.
	//
	//		You must specify a size (width and height) for the SplitContainer.

	// activeSizing: Boolean
	//		If true, the children's size changes as you drag the bar;
	//		otherwise, the sizes don't change until you drop the bar (by mouse-up)
	activeSizing: false,
	
	// sizerWidget: Integer
	//		Size in pixels of the bar between each child
	sizerWidth: 15,
	
	// orientation: String
	//		either 'horizontal' or vertical; indicates whether the children are
	//		arranged side-by-side or up/down.
	orientation: 'horizontal',
	
	// persist: Boolean
	//		Save splitter positions in a cookie
	persist: true,

	postMixInProperties: function(){
		dijit.layout.SplitContainer.superclass.postMixInProperties.apply(this, arguments);
		this.isHorizontal = (this.orientation == 'horizontal');
	},
	
	onResized: function(e){
		var content = dojo.contentBox(this.domNode);
		this.paneWidth = content.w;
		this.paneHeight = content.h;
		this._layoutPanels();
	},

	postCreate: function(){
		dijit.layout.SplitContainer.superclass.postCreate.apply(this, arguments);
		this.sizers = [];
		dojo.addClass(this.domNode, "dojoSplitContainer");
		// overflow has to be explicitly hidden for splitContainers using gekko (trac #1435)
		// to keep other combined css classes from inadvertantly making the overflow visible
		if(dojo.isMozilla){
			this.domNode.style.overflow = '-moz-scrollbars-none'; // hidden doesn't work
		}

		var content = dojo.contentBox(this.domNode);
		
		this.paneWidth = content.w;
		this.paneHeight = content.h;
		// create the fake dragger
		if(typeof this.sizerWidth == "object"){ 
			try{
				this.sizerWidth = parseInt(this.sizerWidth.toString()); 
			}catch(e){ this.sizerWidth = 15; }
		}
		this.virtualSizer = document.createElement('div');
		this.virtualSizer.style.position = 'relative';

		// #1681: work around the dreaded 'quirky percentages in IE' layout bug
		// If the splitcontainer's dimensions are specified in percentages, it
		// will be resized when the virtualsizer is displayed in _showSizingLine
		// (typically expanding its bounds unnecessarily). This happens because
		// we use position: relative for .dojoSplitContainer.
		// The workaround: instead of changing the display style attribute,
		// switch to changing the zIndex (bring to front/move to back)

		this.virtualSizer.style.zIndex = 10;
		this.virtualSizer.className = this.isHorizontal ? 'dojoSplitContainerVirtualSizerH' : 'dojoSplitContainerVirtualSizerV';
		this.domNode.appendChild(this.virtualSizer);

		dijit._disableSelection(this.virtualSizer);

	},
	
	layout: function(){
		var children = this.getChildren();
		// attach the children and create the draggers
		for(var i = 0; i < children.length; i++){
			with(children[i].domNode.style){
				position = "absolute";
			}
			dojo.addClass(children[i].domNode, "dojoSplitPane");

			if(i == children.length-1){
				break;
			}
			this._addSizer();
		}

		if(this.persist){
			this._restoreState();
		}
		// size the panels once the browser has caught up
		this.startup();
	},

	_injectChild: function(child){
		with(child.domNode.style){
			position = "absolute";
		}
		dojo.addClass(child.domNode, "dojoSplitPane");
	},

	_addSizer: function(){
		var i = this.sizers.length;

		this.sizers[i] = document.createElement('div');
		this.sizers[i].style.position = 'absolute';
		this.sizers[i].className = this.isHorizontal ? 'dojoSplitContainerSizerH' : 'dojoSplitContainerSizerV';

		var self = this;
		var handler = (function(){ var sizer_i = i; return function(e){ self.beginSizing(e, sizer_i); } })();
		dojo.connect(this.sizers[i], "onmousedown", handler);

		this.domNode.appendChild(this.sizers[i]);
		dijit._disableSelection(this.sizers[i]);
	},

	removeChild: function(widget){
		// Remove sizer, but only if widget is really our child and
		// we have at least one sizer to throw away
		if(this.sizers.length > 0){
			var children = this.getChildren();
			for(var x = 0; x < children.length; x++){
				if(children[x] === widget){
					var i = this.sizers.length - 1;
					this.domNode.removeChild(this.sizers[i]);
					this.sizers.length = i;
					break;
				}
			}
		}

		// Remove widget and repaint
		dijit.base.Container.prototype.removeChild.apply(this, arguments);
		this.onResized();
   },

	addChild: function(child, insertIndex){
		dijit.base.Container.prototype.addChild.apply(this, arguments);
		this._injectChild(child);
		
		var children = this.getChildren();
		if(children.length > 1){
			this._addSizer();
		}
		this._layoutPanels();
	},

	_layoutPanels: function(){
		var children = this.getChildren();
		if(children.length == 0){ return; }

		//
		// calculate space
		//

		var space = this.isHorizontal ? this.paneWidth : this.paneHeight;
		if(children.length > 1){
			space -= this.sizerWidth * (children.length - 1);
		}

		//
		// calculate total of SizeShare values
		//
		var out_of = 0;
		for(var i=0; i<children.length; i++){
			out_of += children[i].sizeShare;
		}

		//
		// work out actual pixels per sizeshare unit
		//
		var pix_per_unit = space / out_of;


		//
		// set the SizeActual member of each pane
		//
		var total_size = 0;
		for(var i = 0; i< children.length-1; i++){
			var size = Math.round(pix_per_unit * children[i].sizeShare);
			children[i].sizeActual = size;
			total_size += size;
		}
		children[children.length-1].sizeActual = space - total_size;

		//
		// make sure the sizes are ok
		//
		this._checkSizes();

		//
		// now loop, positioning each pane and letting children resize themselves
		//

		var pos = 0;
		var size = children[0].sizeActual;
		this._movePanel(children[0], pos, size);
		children[0].position = pos;
		pos += size;

		// if we don't have any sizers, our layout method hasn't been called yet
		// so bail until we are called..TODO: REVISIT: need to change the startup
		// algorithm to guaranteed the ordering of calls to layout method
		if(!this.sizers)
			return;
		
		for(var i=1; i<children.length; i++){
			// error-checking
			if(!this.sizers[i-1])
				break;
			// first we position the sizing handle before this pane
			this._moveSlider(this.sizers[i-1], pos, this.sizerWidth);
			this.sizers[i-1].position = pos;
			pos += this.sizerWidth;

			size = children[i].sizeActual;
			this._movePanel(children[i], pos, size);
			children[i].position = pos;
			pos += size;
		}
	},

	_movePanel: function(panel, pos, size){
		if(this.isHorizontal){
			panel.domNode.style.left = pos + 'px';
			panel.domNode.style.top = 0;
			var box = {w: size, h: this.paneHeight};
			if(panel.resize){
				panel.resize(box);
			}else{
				dojo.marginBox(panel.domNode, box);
			}
		}else{
			panel.domNode.style.left = 0;
			panel.domNode.style.top = pos + 'px';
			var box = {w: this.paneWidth, h: size}; 
			if(panel.resize){
				panel.resize(box);
			}else{
				dojo.marginBox(panel.domNode, box);
			}
		}
	},

	_moveSlider: function(slider, pos, size){
		if(this.isHorizontal){
			slider.style.left = pos + 'px';
			slider.style.top = 0;
			dojo.marginBox(slider, { w: size, h: this.paneHeight });
		}else{
			slider.style.left = 0;
			slider.style.top = pos + 'px';
			dojo.marginBox(slider, { w: this.paneWidth, h: size });
		}
	},

	_growPane: function(growth, pane){
		if(growth > 0){
			if(pane.sizeActual > pane.sizeMin){
				if((pane.sizeActual - pane.sizeMin) > growth){

					// stick all the growth in this pane
					pane.sizeActual = pane.sizeActual - growth;
					growth = 0;
				}else{
					// put as much growth in here as we can
					growth -= pane.sizeActual - pane.sizeMin;
					pane.sizeActual = pane.sizeMin;
				}
			}
		}
		return growth;
	},

	_checkSizes: function(){

		var total_min_size = 0;
		var total_size = 0;
		var children = this.getChildren();

		for(var i=0; i<children.length; i++){
			total_size += children[i].sizeActual;
			total_min_size += children[i].sizeMin;
		}

		// only make adjustments if we have enough space for all the minimums

		if(total_min_size <= total_size){

			var growth = 0;

			for(var i=0; i<children.length; i++){

				if(children[i].sizeActual < children[i].sizeMin){

					growth += children[i].sizeMin - children[i].sizeActual;
					children[i].sizeActual = children[i].sizeMin;
				}
			}

			if(growth > 0){
				if(this.isDraggingLeft){
					for(var i=children.length-1; i>=0; i--){
						growth = this._growPane(growth, children[i]);
					}
				}else{
					for(var i=0; i<children.length; i++){
						growth = this._growPane(growth, children[i]);
					}
				}
			}
		}else{

			for(var i=0; i<children.length; i++){
				children[i].sizeActual = Math.round(total_size * (children[i].sizeMin / total_min_size));
			}
		}
	},

	beginSizing: function(e, i){
		var children = this.getChildren();
		this.paneBefore = children[i];
		this.paneAfter = children[i+1];

		this.isSizing = true;
		this.sizingSplitter = this.sizers[i];

		if(!this.cover){
			this.cover = dojo.doc.createElement('div');
			this.domNode.appendChild(this.cover);
			var s = this.cover.style;
			s.position='absolute';
			s.zIndex=1;
			s.top=0;
			s.left=0;
			s.width="100%";
			s.height="100%";
		}else{
			this.cover.style.zIndex=1;
		}
		this.sizingSplitter.style.zIndex=2;

		// TODO: REVISIT - we want MARGIN_BOX and core hasn't exposed that yet
		this.originPos = dojo.coords(children[0].domNode, true);
		if(this.isHorizontal){
			var client = (e.layerX ? e.layerX : e.offsetX);
			var screen = e.pageX;
			this.originPos = this.originPos.x;
		}else{
			var client = (e.layerY ? e.layerY : e.offsetY);
			var screen = e.pageY;
			this.originPos = this.originPos.y;
		}
		this.startPoint = this.lastPoint = screen;
		this.screenToClientOffset = screen - client;
		this.dragOffset = this.lastPoint - this.paneBefore.sizeActual - this.originPos - this.paneBefore.position;

		if(!this.activeSizing){
			this._showSizingLine();
		}

		//					 
		// attach mouse events
		//
		this.connect(document.documentElement, "onmousemove", "changeSizing");
		this.connect(document.documentElement, "onmouseup", "endSizing");

		dojo.stopEvent(e);
	},

	changeSizing: function(e){
		this.lastPoint = this.isHorizontal ? e.pageX : e.pageY;
		if(this.activeSizing){
			this.movePoint();
			this._updateSize();
		}else{
			this.movePoint();
			this._moveSizingLine();
		}
		dojo.stopEvent(e);
	},

	endSizing: function(e){
		if(!this.isSizing){ return; }
		if(this.cover){
			this.cover.style.zIndex=-1;
		}
		if(!this.activeSizing){
			this._hideSizingLine();
		}

		this._updateSize();

		this.isSizing = false;

		if(this.persist){
			this._saveState(this);
		}
	},

	movePoint: function(){

		// make sure lastPoint is a legal point to drag to
		var p = this.lastPoint - this.screenToClientOffset;

		var a = p - this.dragOffset;
		a = this.legaliseSplitPoint(a);
		p = a + this.dragOffset;

		this.lastPoint = p + this.screenToClientOffset;
	},

	legaliseSplitPoint: function(a){

		a += this.sizingSplitter.position;

		this.isDraggingLeft = (a > 0) ? true : false;

		if(!this.activeSizing){

			if(a < this.paneBefore.position + this.paneBefore.sizeMin){

				a = this.paneBefore.position + this.paneBefore.sizeMin;
			}

			if(a > this.paneAfter.position + (this.paneAfter.sizeActual - (this.sizerWidth + this.paneAfter.sizeMin))){

				a = this.paneAfter.position + (this.paneAfter.sizeActual - (this.sizerWidth + this.paneAfter.sizeMin));
			}
		}

		a -= this.sizingSplitter.position;

		this._checkSizes();

		return a;
	},

	_updateSize: function(){
		var pos = this.lastPoint - this.dragOffset - this.originPos;

		var start_region = this.paneBefore.position;
		var end_region   = this.paneAfter.position + this.paneAfter.sizeActual;

		this.paneBefore.sizeActual = pos - start_region;
		this.paneAfter.position	= pos + this.sizerWidth;
		this.paneAfter.sizeActual  = end_region - this.paneAfter.position;

		var children = this.getChildren();
		for(var i=0; i<children.length; i++){

			children[i].sizeShare = children[i].sizeActual;
		}

		this._layoutPanels();
	},

	_showSizingLine: function(){

		this._moveSizingLine();

		if(this.isHorizontal){
			dojo.marginBox(this.virtualSizer, { w: this.sizerWidth, h: this.paneHeight });
		}else{
			dojo.marginBox(this.virtualSizer, { w: this.paneWidth, h: this.sizerWidth });
		}

		this.virtualSizer.style.display = 'block';
	},

	_hideSizingLine: function(){
		this.virtualSizer.style.display = 'none';
	},

	_moveSizingLine: function(){
		var pos = this.lastPoint - this.startPoint + this.sizingSplitter.position;
		if(this.isHorizontal){
			this.virtualSizer.style.left = pos + 'px';
		}else{
			var pos = (this.lastPoint - this.startPoint) + this.sizingSplitter.position;
			this.virtualSizer.style.top = pos + 'px';
		}

	},
	
	_getCookieName: function(i){
		return this.id + "_" + i;
	},

	_restoreState: function (){
		var children = this.getChildren();
		for(var i = 0; i < children.length; i++){
			var cookieName = this._getCookieName(i);
			var cookieValue = dijit.base.cookie.getCookie(cookieName);
			if(cookieValue != null){
				var pos = parseInt(cookieValue);
				if(typeof pos == "number"){
					children[i].sizeShare=pos;
				}
			}
		}
	},

	_saveState: function (){
		var children = this.getChildren();
		for(var i = 0; i < children.length; i++){
			var cookieName = this._getCookieName(i);
			dijit.base.cookie.setCookie(cookieName, children[i].sizeShare, null, null, null, null);
		}
	}
});

// These arguments can be specified for the children of a SplitContainer.
// Since any widget can be specified as a SplitContainer child, mix them
// into the base widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit.base.Widget, {
	// sizeMin: Integer
	//	Minimum size (width or height) of a child of a SplitContainer.
	//	The value is relative to other children's sizeShare properties.
	sizeMin: 10,

	// sizeShare: Integer
	//	Size (width or height) of a child of a SplitContainer.
	//	The value is relative to other children's sizeShare properties.
	//	For example, if there are two children and each has sizeShare=10, then
	//	each takes up 50% of the available space.
	sizeShare: 10
});

// ported from dojo.io.cookie - should probably go to dijit.util but only splitcon
dojo.declare("dijit.base.cookie");

dijit.base.cookie.setCookie = function(/*String*/name, /*String*/value, 
									/*Number?*/days, /*String?*/path, 
									/*String?*/domain, /*boolean?*/secure){
	//summary: sets a cookie.
	var expires = -1;
	if((typeof days == "number")&&(days >= 0)){
		var d = new Date();
		d.setTime(d.getTime()+(days*24*60*60*1000));
		expires = d.toGMTString();
	}
	value = escape(value);
	document.cookie = name + "=" + value + ";"
		+ (expires != -1 ? " expires=" + expires + ";" : "")
		+ (path ? "path=" + path : "")
		+ (domain ? "; domain=" + domain : "")
		+ (secure ? "; secure" : "");
}

dijit.base.cookie.getCookie = function(/*String*/name){
	//summary: Gets a cookie with the given name.

	// FIXME: Which cookie should we return?
	// If there are cookies set for different sub domains in the current
	// scope there could be more than one cookie with the same name.
	// I think taking the last one in the list takes the one from the
	// deepest subdomain, which is what we're doing here.
	var idx = document.cookie.lastIndexOf(name+'=');
	if(idx == -1){ return null; }
	var value = document.cookie.substring(idx+name.length+1);
	var end = value.indexOf(';');
	if(end == -1){ end = value.length; }
	value = value.substring(0, end);
	value = unescape(value);
	return value; //String
}




