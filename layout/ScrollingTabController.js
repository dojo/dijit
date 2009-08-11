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
	//		The distance in pixels from the left of the tab strip which,
	//		if a scroll animation is less than, forces the scroll to
	//		go all the way to the left.
	_minScroll: 5,
	
	attributeMap: dojo.delegate(dijit._Widget.prototype.attributeMap, {
		"class": "containerNode"
	}),
	
	postCreate: function(){
		this.inherited(arguments);
		var n = this.domNode;
		
		this._tabWidth = 0;

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

		this._tabWidth = 0;
	},
	
	onRemoveChild: function(page, insertIndex){
		// summary: 
		//		Removes a child from the menu that is used to select tabs.
		this.inherited(arguments);
		if(this.useMenu && page && page.id && this._menuChildren[page.id]){
			this._menu.removeChild(this._menuChildren[page.id]);
		}
		this._tabWidth = 0;
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
		var kids = this.getChildren();
		if(kids != null && kids.length > 0 && this._tabWidth == 0){
			var totalWidth = 0;
			dojo.forEach(kids, function(child){
				totalWidth += dojo.style(child.domNode, "width");
			});
			// Add some pixels for padding
			this._tabWidth = totalWidth + (kids.length * 3);
		}
		return this._tabWidth;
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
		//		Hides or displays the button used to launch the menu
		//		that selects tabs.
		if(this.nested || this.domNode.offsetWidth == 0){
			return;
		}

		dojo.marginBox(this.domNode, dim);
		
		var width = dojo.contentBox(this.domNode).w;

		var enable = this._enableBtn(width);
		var marginWidth = width - (enable ? this._btnWidth : 0);
		
		dojo.marginBox(this.scrollNode, {w: marginWidth});
		var realWidth = dojo.contentBox(this.scrollNode).w;
		
		this._updateButtons(enable);

		this.scrollNode.scrollLeft = !enable ? 0 :
			Math.max(0, Math.min(this.scrollNode.scrollLeft, 
					this._getTabsWidth() - realWidth + 5));
	},

	_updateButtons: function(enable){
		this._buttons.style("display", enable ? "" : "none");
		this._setButtonClass(this.scrollNode.scrollLeft);
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

				var sl = this.scrollNode.scrollLeft;

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
	
	createSmoothScroll : function(x){
		// summary: 
		//		Creates a dojo._Animation object that smoothly scrolls the tab list
		//		either to a fixed horizontal pixel value, or to a particular tab.
		// description:
		//		If an number argument is passed to the function, that horizontal 
		//		pixel position is scrolled to.  Otherwise the currently selected
		//		tab is scrolled to.
		// x:	
		//		A pixel value to scroll to.
		var w = this.scrollNode;
		var n = this._selectedTab;
		
		var val1 = dojo.coords(n, true).x + w.scrollLeft;
		var val2 = n.offsetLeft 
						+ dojo.style(n, "width") 
						- dojo.style(this.scrollNode, "width");
		
		var args = {
			node: n, 
			x: arguments.length > 0 ? x : Math.min(val1, val2)
		};
		// If scrolling to close to the left side, scroll
		// all the way to the left.
		if(args.x < this._minScroll){args.x = 0;}

		var anim = new dojo._Animation(dojo.mixin({
			beforeBegin: function(){
				if(this.curve){ delete this.curve; }
				anim.curve = new dojo._Line(w.scrollLeft,Math.max(args.x, 0));
			},
			onAnimate: function(val){
				w.scrollLeft = val;
			}
		},args));
		
		if(this._anim && this._anim.status() == "playing"){
			this._anim.stop();
		}
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
		//		If the value is 1, the widget scrolls to the right, if it is
		//		-1, it scrolls to the left.
		if(node && dojo.hasClass(node, "dijitTabBtnDisabled")){return;}
		
		var sWidth = dojo.style(this.scrollNode, "width");
		var d = (sWidth * 0.75) * direction;
		var rMax = this._getTabsWidth() - sWidth;// + 40;
		
		var to = Math.max(0, 
			Math.min(rMax, this.scrollNode.scrollLeft + d));
		
		this._setButtonClass(to, rMax);
		
		this.createSmoothScroll(to).play();
	},
	
	_setButtonClass: function(scroll, maxScroll){
		// summary:
		//		Adds or removes a class to the left and right scroll buttons
		// description:
		//		If the tabs are scrolled all the way to the left, the class
		//		'dijitTabBtnDisabled' is added to the left button.
		//		If the tabs are scrolled all the way to the right, the class
		//		'dijitTabBtnDisabled' is added to the right button.
		// scroll: Integer
		//		amount of horizontal scroll (0 if we are scrolled to left)
		// maxScroll: Integer?
		//		the total amount of horizontal scroll possible (to scroll all the way to the right)

		var cls = "dijitTabBtnDisabled";
		maxScroll =	maxScroll || this._getTabsWidth() - dojo.style(this.scrollNode, "width");
		dojo.toggleClass(this._leftBtn.domNode, cls, scroll < this._minScroll);
		dojo.toggleClass(this._rightBtn.domNode, cls, scroll >= maxScroll);
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


