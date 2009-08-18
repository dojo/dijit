dojo.provide("dijit.layout.ScrollingTabController");

dojo.require("dijit.layout.TabController");
dojo.require("dijit.Menu");

dojo.declare("dijit.layout.ScrollingTabController",
	dijit.layout.TabController,
	{
	// summary:
	//		Set of tabs with left/right arrow keys and a menu to switch between tabs not
	//		all fitting on a single row.
	//		Works only for horizontal tabs (either above or below the content, not to the left
	//		or right).
	// tags:
	//		private

	templateString: null,
	templatePath: dojo.moduleUrl("dijit.layout", "templates/ScrollingTabController.html"),

	// useMenu: Boolean
	//		True if a menu should be used to select tabs when they are too
	//		wide to fit the TabContainer, false otherwise.
	useMenu: true,
	
	// useSlider: Boolean
	//		True if a slider should be used to select tabs when they are too
	//		wide to fit the TabContainer, false otherwise.
	useSlider: true,
	
	// tabStripClass: String
	//		The css class to apply to the tab strip, if it is visible.
	tabStripClass: "",

	widgetsInTemplate: true,
	
	// _minScroll: Number
	//		The distance in pixels from the edge of the tab strip which,
	//		if a scroll animation is less than, forces the scroll to
	//		go all the way to the left/right.
	_minScroll: 5,
	
	attributeMap: dojo.delegate(dijit._Widget.prototype.attributeMap, {
		"class": "containerNode"
	}),
	
	postCreate: function(){
		this.inherited(arguments);
		var n = this.domNode;
		
		this.tabContainer = dijit.byId(this.containerId);
		this.scrollNode = this.tablistWrapper;
		this._initButtons();
		
		// TODO: isn't this done automatically by attributeMap?
		dojo.addClass(this.containerNode, this["class"]);
		
		if(!this.tabStripClass){
			this.tabStripClass = "dijitTabContainer" +
			this.tabPosition.charAt(0).toUpperCase() +
			this.tabPosition.substr(1).replace(/-.*/, "") +
			"None";
			dojo.addClass(n, "tabStrip-disabled")
		}else{
			this.useTabStrip = true;
		}
		
		dojo.addClass(this.tablistWrapper, this.tabStripClass);
		
		this.connect(this._leftBtn.domNode, "click", "doSlideLeft");
		this.connect(this._rightBtn.domNode, "click", "doSlideRight");
	},
	
	onStartup: function(){
		this.inherited(arguments);
		
		// Do not show the TabController until the related
		// StackController has added it's children.  This gives
		// a less visually jumpy instantiation.
		dojo.style(this.domNode, "visibility", "visible");
	},
	
	onAddChild: function(page, insertIndex){
		this.inherited(arguments);
		
		if(this.useMenu){
			var menuItem = new dijit.MenuItem({
				label: page.title,
				onClick: dojo.hitch(this, function(){
					this.onSelectChild(page);
				})
			});
			this._menuChildren[page.id] = menuItem;
			this._menu.addChild(menuItem, insertIndex);
		}
		
		// Increment the width of the wrapper when a tab is added
		// This makes sure that the buttons never wrap.
		// The value 200 is chosen as it should be bigger than most
		// Tab button widths.
		dojo.style(this.containerNode, "width", 
			(dojo.style(this.containerNode, "width") + 200) + "px");
	},
	
	onRemoveChild: function(page, insertIndex){
		// summary: 
		//		Removes a child from the menu that is used to select tabs.
		this.inherited(arguments);
		if(this.useMenu && page && page.id && this._menuChildren[page.id]){
			this._menu.removeChild(this._menuChildren[page.id]);
		}
	},

	_initButtons: function(){
		// summary: 
		//		Creates the buttons used to scroll to view tabs that
		//		may not be visible if the TabContainer is too narrow. 
		this._menuChildren = {};
		
		// Hide all the button initially
		// TODO: couldn't this be replaced by three simple calls to dojo.style()?
		this._buttons = dojo.query("> .tabStripButton", this.domNode)
			.filter(dojo.hitch(this, function(btn){
				var r = true;
				if(!this.useMenu && btn == this._menuBtn.domNode){
					r = false;
				}else if(!this.useSlider && (btn == this._rightBtn.domNode || btn == this._leftBtn.domNode)){
					r = false;
				}
				if(!r){
					dojo.style(btn, "display", "none")
				}
				return r;
			}
		));
		var totalWidth = 0;
		this._buttons.forEach(function(n){
			totalWidth += dojo.marginBox(n).w;
			
		});
		this._btnWidth = totalWidth;
		
		if(!this.nested && this.useMenu){	
			// Create the menu that is used to select tabs.
			this._menu = new dijit.Menu({
				id: this.id + "_menu",
				targetNodeIds: [this._menuBtn.domNode],
				leftClickToOpen: true
			});
		}else{
			dojo.style(this._menuBtn.domNode, "display", "none");
		}
	},
	
	_getTabsWidth: function(){
		var children = this.getChildren();
		if(children.length){
			var leftTab = children[this.isLeftToRight() ? 0 : children.length - 1].domNode,
				rightTab = children[this.isLeftToRight() ? children.length - 1 : 0].domNode;
			return rightTab.offsetLeft + dojo.style(rightTab, "width") - leftTab.offsetLeft;
		}else{
			return 0;
		}
	},
	
	_enableBtn: function(width){
		// summary: 
		//		Determines if the tabs are wider than the width of the TabContainer.
		var tabsWidth = this._getTabsWidth();
		width = width || dojo.style(this.scrollNode, "width");
		return tabsWidth > 0 && width < tabsWidth;
	},
	
	resize: function(dim){
		// summary: 
		//		Hides or displays the buttons used to scroll the tab list and launch the menu
		//		that selects tabs.
		if(this.domNode.offsetWidth == 0){
			return;
		}

		dojo.marginBox(this.domNode, dim);
		
		var width = dojo.contentBox(this.domNode).w;

		var enable = this._enableBtn(width);
		var marginWidth = width - (enable ? this._btnWidth : 0);
		
		dojo.marginBox(this.scrollNode, {w: marginWidth});
		var realWidth = dojo.contentBox(this.scrollNode).w;
		
		this._updateButtons(enable);
		
		// TODO: needs the same logic as smoothScroll() (to compute the new scrollLeft)
		// but w/out the animation
	},

	_updateButtons: function(enable){
		this._buttons.style("display", enable ? "" : "none");
		this._setButtonClass(this._getScroll());
	},
	

	_getScroll: function(){
		// summary:
		//		Returns the current scroll of the tabs where 0 means
		//		"scrolled all the way to the left" and some positive number, based on #
		//		of pixels of possible scroll (ex: 1000) means "scrolled all the way to the right"
		var sl = (this.isLeftToRight() || dojo.isIE < 8) ? this.scrollNode.scrollLeft :
				dojo.style(this.containerNode, "width") - dojo.style(this.scrollNode, "width")
					 + (dojo.isIE == 8 ? -1 : 1) * this.scrollNode.scrollLeft;
		return sl;
	},

	_convertToScrollLeft: function(val){
		// summary:
		//		Given a scroll value where 0 means "scrolled all the way to the left"
		//		and some positive number, based on # of pixels of possible scroll (ex: 1000)
		//		means "scrolled all the way to the right", return value to set this.scrollNode.scrollLeft
		//		to achieve that scroll.
		//
		//		This method is to adjust for RTL funniness in various browsers and versions.
		if(this.isLeftToRight() || dojo.isIE < 8){
			return val;
		}else{
			var maxScroll = dojo.style(this.containerNode, "width") - dojo.style(this.scrollNode, "width");
			return (dojo.isIE == 8 ? -1 : 1) * (val - maxScroll);
		}
	},

	onSelectChild: function(page){
		// summary: 
		//		Smoothly scrolls to a tab when it is selected.
		if(!this.nested && this.scrollNode){
			var tab = this.pane2button[page];
			if(!tab || !page){return;}
		
			var node = tab.domNode;
			if(node != this._selectedTab){
				this._selectedTab = node;

				var sl = this._getScroll();

				if(sl > node.offsetLeft ||
					sl + dojo.style(this.scrollNode, "width") <
					node.offsetLeft + dojo.style(node, "width")){

					var anim = this.createSmoothScroll();
					this.connect(anim, "onEnd", function(){
						tab.onClick(null);
					});
					anim.play();
				}else{
					tab.onClick(null);
				}
			}
		}
		this.inherited(arguments);
	},

	_getScrollBounds: function(){
		// summary:
		//		Returns the minimum and maximum scroll setting to show the leftmost and rightmost
		//		tabs (respectively)
		var children = this.getChildren(),
			scrollNodeWidth = dojo.style(this.scrollNode, "width"),		// about 500px
			containerWidth = dojo.style(this.containerNode, "width"),	// 50,000px
			maxPossibleScroll = containerWidth - scrollNodeWidth,	// scrolling until right edge of containerNode visible
			tabsWidth = this._getTabsWidth();

		if(children.length && tabsWidth > scrollNodeWidth){
			// Scrolling should happen
			return {
				min: this.isLeftToRight() ? 0 : children[children.length-1].domNode.offsetLeft,
				max: this.isLeftToRight() ? 
					(children[children.length-1].domNode.offsetLeft + dojo.style(children[children.length-1].domNode, "width")) - scrollNodeWidth :
					maxPossibleScroll
			};
		}else{
			// No scrolling needed, all tabs visible, we stay either scrolled to far left or far right (depending on dir)
			var onlyScrollPosition = this.isLeftToRight() ? 0 : maxPossibleScroll;
			return {
				min: onlyScrollPosition,
				max: onlyScrollPosition
			};
		}
	},

	// TODO: add _getScrollForTab(), to get scroll to center a tab

	createSmoothScroll : function(x){
		// summary: 
		//		Creates a dojo._Animation object that smoothly scrolls the tab list
		//		either to a fixed horizontal pixel value, or to a particular tab.
		// description:
		//		If an number argument is passed to the function, that horizontal 
		//		pixel position is scrolled to.  Otherwise the currently selected
		//		tab is scrolled to.
		// x:	Integer?
		//		An optional pixel value to scroll to, indicating distance from left.

		var w = this.scrollNode,
			n = this._selectedTab,
			scrollNodeWidth = dojo.style(this.scrollNode, "width"),
			scrollBounds = this._getScrollBounds();

		// Scroll to given x position, or so that tab is centered
		// TODO: scroll minimal amount (to either right or left) so that
		// selected tab is fully visible, and just return if it's already visible?
		var args = {
			node: n, 
			x: arguments.length > 0 ? x :
				(n.offsetLeft + dojo.style(n, "width")/2) - scrollNodeWidth/2
		};
		args.x = Math.min(Math.max(args.x, scrollBounds.min), scrollBounds.max);

		// TODO:
		// If scrolling close to the left side or right side, scroll
		// all the way to the left or right.  See this._minScroll.
		// (But need to make sure that doesn't scroll the tab out of view...)

		var self = this,
			anim = new dojo._Animation(dojo.mixin({
			beforeBegin: function(){
				if(this.curve){ delete this.curve; }
				var oldS = w.scrollLeft,
					newS = self._convertToScrollLeft(args.x);
				anim.curve = new dojo._Line(oldS, newS);
			},
			onAnimate: function(val){
				w.scrollLeft = val;
				
				// Give IE6/7 a kick or the screen won't update
				w.className = w.className;
			}
		},args));
		
		if(this._anim && this._anim.status() == "playing"){
			this._anim.stop();
		}
		// TODO: don't we need to destroy the old animation?

		this._setButtonClass(args.x);
		this._anim = anim;
		return anim; // dojo._Animation
	},

	_getBtnNode: function(e){
		// summary: 
		//		Gets a button DOM node from a mouse click event.
		// e:
		//		The mouse click event.
		var n = e.target;
		while(n && !dojo.hasClass(n, "tabStripButton")){
			n = n.parentNode;
		}
		return n;
	},
	
	doSlideRight: function(e){
		// summary:
		//		Scrolls the menu to the right.
		// e:
		//		The mouse click event.
		this.doSlide(1, this._getBtnNode(e));
	},
	
	doSlideLeft: function(e){
		// summary:
		//		Scrolls the menu to the left.
		// e:
		//		The mouse click event.
		this.doSlide(-1,this._getBtnNode(e));
	},
	
	doSlide: function(direction, node){
		// summary:
		//		Scrolls the tab list to the left or right by 75% of the widget width.
		// direction:
		//		If the direction is 1, the widget scrolls to the right, if it is
		//		-1, it scrolls to the left.
		
		if(node && dojo.hasClass(node, "dijitTabBtnDisabled")){return;}
		
		var sWidth = dojo.style(this.scrollNode, "width");
		var d = (sWidth * 0.75) * direction;
		
		var to = this._getScroll() + d;
		
		this._setButtonClass(to);
		
		this.createSmoothScroll(to).play();
	},
	
	_setButtonClass: function(scroll){
		// summary:
		//		Adds or removes a class to the left and right scroll buttons
		//		to indicate whether each one is enabled/disabled.
		// description:
		//		If the tabs are scrolled all the way to the left, the class
		//		'dijitTabBtnDisabled' is added to the left button.
		//		If the tabs are scrolled all the way to the right, the class
		//		'dijitTabBtnDisabled' is added to the right button.
		// scroll: Integer
		//		amount of horizontal scroll

		var cls = "dijitTabBtnDisabled",
			scrollBounds = this._getScrollBounds();
		dojo.toggleClass(this._leftBtn.domNode, cls, scroll <= scrollBounds.min);
		dojo.toggleClass(this._rightBtn.domNode, cls, scroll >= scrollBounds.max);
	}
});

dojo.declare("dijit.layout._ScrollingTabControllerButton",
	dijit.form.Button,
	{
		baseClass: "dijitTab",
		
		buttonType: "",
		
		buttonClass: "",
		
		tabPosition: "top",
		
		templatePath: dojo.moduleUrl("dijit.layout","templates/_ScrollingTabControllerButton.html")
	}
);


