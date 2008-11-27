dojo.provide("dijit.layout.AccordionContainer");

dojo.require("dojo.fx");

dojo.require("dijit._Container");
dojo.require("dijit._Templated");
dojo.require("dijit.layout.StackContainer");
dojo.require("dijit.layout.ContentPane");

dojo.require("dijit.layout.AccordionPane");	// for back compat

dojo.declare(
	"dijit.layout.AccordionContainer",
	dijit.layout.StackContainer,
	{
		// summary:
		//		Holds a set of panes where every pane's title is visible, but only one pane's content is visible at a time,
		//		and switching between panes is visualized by sliding the other panes up/down.
		// example:
		// | 	<div dojoType="dijit.layout.AccordionContainer">
		// |		<div dojoType="dijit.layout.AccordionPane" title="pane 1">
		// |			<div dojoType="dijit.layout.ContentPane">...</div>
		// | 	</div>
		// |		<div dojoType="dijit.layout.AccordionPane" title="pane 2">
		// |			<p>This is some text</p>
		// ||		...
		// |	</div>
		//
		// duration: Integer
		//		Amount of time (in ms) it takes to slide panes
		duration: dijit.defaultDuration,

		_verticalSpace: 0,

		baseClass: "dijitAccordionContainer",
		
		postCreate: function(){
			this.domNode.style.overflow = "hidden";
			this.inherited(arguments); 
			dijit.setWaiRole(this.domNode, "tablist");
		},

		startup: function(){
			if(this._started){ return; }
			this.inherited(arguments);	
			if(this.selectedChildWidget){
				var style = this.selectedChildWidget.containerNode.style;
				style.display = "";
				style.overflow = "auto";
				this.selectedChildWidget._buttonWidget._setSelectedState(true);
			}
		},
		
		_getTargetHeight: function(/* Node */ node){
			// summary:
			//		For the given node, returns the height that should be
			//		set to achieve our vertical space (subtract any padding
			//		we may have)
			var cs = dojo.getComputedStyle(node);
			return Math.max(this._verticalSpace - dojo._getPadBorderExtents(node, cs).h, 0);
		},

		layout: function(){
			// summary: 
			//		Set the height of the open pane based on what room remains

			var openPane = this.selectedChildWidget;

			// get cumulative height of all the title bars
			var totalCollapsedHeight = 0;
			dojo.forEach(this.getChildren(), function(child){
				totalCollapsedHeight += child._buttonWidget.getTitleHeight();
			});
			var mySize = this._contentBox;
			this._verticalSpace = mySize.h - totalCollapsedHeight;

			// Memo size to make displayed child
			this._containerContentBox = {
				h: this._verticalSpace,
				w: mySize.w
			};

			if(openPane){
				openPane.resize(this._containerContentBox);
			}
		},

		_setupChild: function(child){
			// Setup clickable title to sit above the child widget,
			//  and stash pointer to it inside the widget itself
			child._buttonWidget = new dijit.layout._AccordionButton({
				contentWidget: child,
				title: child.title,
				id: child.id + "_button",
				parent: this
			});
			dojo.place(child._buttonWidget.domNode, child.domNode, "before");

			this.inherited(arguments);
		},

		removeChild: function(child){
			child._buttonWidget.destroy();
			this.inherited(arguments);
		},

		getChildren: function(){
			return dojo.filter(this.inherited(arguments), function(child){
				return child.declaredClass != "dijit.layout._AccordionButton";
			});
		},

		_transition: function(/*Widget?*/newWidget, /*Widget?*/oldWidget){
//TODO: should be able to replace this with calls to slideIn/slideOut
			if(this._inTransition){ return; }
			this._inTransition = true;
			var animations = [];
			var paneHeight = this._verticalSpace;
			if(newWidget){
				newWidget._buttonWidget.setSelected(true);
				this._showChild(newWidget);	// prepare widget to be slid in
				var newContents = newWidget.domNode;
				newContents.style.display = "";
				var newContentsOverflow = newContents.style.overflow;
				newContents.style.overflow = "hidden";
				animations.push(dojo.animateProperty({
					node: newContents,
					duration: this.duration,
					properties: {
						height: { start: 1, end: this._getTargetHeight(newContents) }
					},
					onEnd: function(){
						newContents.style.overflow = newContentsOverflow;
					}
				}));
			}
			if(oldWidget){
				oldWidget._buttonWidget.setSelected(false);
				var oldContents = oldWidget.domNode;
				var oldContentsOverflow = newContents.style.overflow;
				oldContents.style.overflow = "hidden";
				animations.push(dojo.animateProperty({
					node: oldContents,
					duration: this.duration,
					properties: {
						height: { start: this._getTargetHeight(oldContents), end: 1 }
					},
					onEnd: function(){
						oldContents.style.display = "none";
						oldContents.style.overflow = oldContentsOverflow;
					}
				}));
			}

			this._inTransition = false;

			dojo.fx.combine(animations).play();
		},

		// note: we are treating the container as controller here
		_onKeyPress: function(/*Event*/ e){
			if(this.disabled || e.altKey || !(e._dijitWidget || e.ctrlKey)){ return; }
			var k = dojo.keys;
			var fromTitle = e._dijitWidget;
			switch(e.charOrCode){
				case k.LEFT_ARROW:
				case k.UP_ARROW:
					if (fromTitle){
						this._adjacent(false)._onTitleClick();
						dojo.stopEvent(e);
					}
					break;
				case k.PAGE_UP:
					if (e.ctrlKey){
						this._adjacent(false)._onTitleClick();
						dojo.stopEvent(e);
					}
					break;
				case k.RIGHT_ARROW:
				case k.DOWN_ARROW:
					if (fromTitle){
						this._adjacent(true)._onTitleClick();
						dojo.stopEvent(e);
					}
					break;
				case k.PAGE_DOWN:
					if (e.ctrlKey){
						this._adjacent(true)._onTitleClick();
						dojo.stopEvent(e);
					}
					break;
				default:
					if(e.ctrlKey && e.charOrCode === k.TAB){
						this._adjacent(e._dijitWidget, !e.shiftKey)._onTitleClick();
						dojo.stopEvent(e);
					}
				
			}
		}
	}
);

dojo.declare("dijit.layout._AccordionButton",
	[dijit._Widget, dijit._Templated],
	{
	// summary:
	//		The title bar to click to open up an accordion pane

	templatePath: dojo.moduleUrl("dijit.layout", "templates/AccordionButton.html"),
	attributeMap: dojo.mixin(dojo.clone(dijit.layout.ContentPane.prototype.attributeMap), {
		title: {node: "titleTextNode", type: "innerHTML" }
	}),

	baseClass: "dijitAccordionTitle",

	getParent: function(){
		return this.parent;
	},

	postCreate: function(){
		this.inherited(arguments)
		dojo.setSelectable(this.domNode, false);
		this.setSelected(this.selected);
		dojo.attr(this.titleTextNode, "id", this.domNode.id+"_title");
		dijit.setWaiState(this.focusNode, "labelledby", dojo.attr(this.titleTextNode, "id"));
	},

	getTitleHeight: function(){
		// summary: returns the height of the title dom node
		return dojo.marginBox(this.titleNode).h;	// Integer
	},

	_onTitleClick: function(){
		// summary: callback when someone clicks my title
		var parent = this.getParent();
		if(!parent._inTransition){
			parent.selectChild(this.contentWidget);
			dijit.focus(this.focusNode);
		}
	},

	_onTitleEnter: function(){
		// summary: callback when someone hovers over my title
		dojo.addClass(this.focusNode, "dijitAccordionTitle-hover");
	},

	_onTitleLeave: function(){
		// summary: callback when someone stops hovering over my title
		dojo.removeClass(this.focusNode, "dijitAccordionTitle-hover");
	},

	_onTitleKeyPress: function(/*Event*/ evt){
		evt._dijitWidget = this;
		return this.getParent()._onKeyPress(evt);
	},

	_setSelectedState: function(/*Boolean*/ isSelected){
		this.selected = isSelected;
		dojo[(isSelected ? "addClass" : "removeClass")](this.titleNode,"dijitAccordionTitle-selected");
		dijit.setWaiState(this.focusNode, "expanded", isSelected);
		this.focusNode.setAttribute("tabIndex", isSelected ? "0" : "-1");
	},

	_handleFocus: function(/*Event*/e){
		// summary: handle the blur and focus state of this widget
		dojo[(e.type=="focus" ? "addClass" : "removeClass")](this.focusNode,"dijitAccordionFocused");		
	},

	setSelected: function(/*Boolean*/ isSelected){
		// summary: change the selected state on this pane
		this._setSelectedState(isSelected);
		if(isSelected){
			this.contentWidget.onSelected();
			this.contentWidget._loadCheck(); // if href specified, trigger load
		}
	}
});
