dojo.provide("dijit.layout.AccordionContainer");

dojo.require("dojo.fx");

dojo.require("dijit.layout.PageContainer");
dojo.require("dijit.util.popup");

dojo.declare(
	"dijit.layout.AccordionContainer",
	[dijit.layout.PageContainer, dijit.base.Showable], //TODO why Showable?
	{
		// summary: 
		//		Holds a set of panes where every pane's title is visible, but only one pane's content is visible at a time,
		//		and switching between panes is visualized by sliding the other panes up/down.
		// usage:
		// 	<div dojoType="dijit.layout.AccordionContainer">
		// 		<div dojoType="dijit.layout.AccordionPane" title="pane 1">
		// 			<div dojoType="dijit.layout.ContentPane">...</div>
		//  	</div>
		// 		<div dojoType="dijit.layout.AccordionPane" title="pane 2">
		// 			...
		// 	</div>

		// duration: Integer
		//		Amount of time (in ms) it takes to slide panes
		duration: 250,

		_verticalSpace: 0,

		startup: function(){
			dijit.layout.PageContainer.prototype.startup.apply(this, arguments);
			var selectedChild = this.selectedChildWidget;
			if(selectedChild){
				selectedChild.selected = true;
				selectedChild.containerNode.style.display = "";
			}
		},

		layout: function(){
			// summary
			//		Set the height of the open pane based on what room remains
			// get cumulative height of all the title bars, and figure out which pane is open
			var totalCollapsedHeight = 0;
			var openPane = this.selectedChildWidget;
			dojo.forEach(this.getChildren(), function(child){
				totalCollapsedHeight += child.getTitleHeight();
			});
			var mySize = this._contentBox;
			this._verticalSpace = (mySize.h - totalCollapsedHeight);
			if(openPane){
				openPane.containerNode.style.height = this._verticalSpace + "px";
				if(openPane.resize){
					openPane.resize({h: this.verticalSpace});
				}
			}
		},

		_setupChild: function(/*Widget*/ page){
			// Summary: prepare the given child
			return page;
		},

		_transition: function(/*Widget*/newWidget, /*Widget?*/oldWidget){
//TODO: generate show events or call showChild?
//			this._showChild(newWidget);
			if(newWidget){
				newWidget.setSelected(true);
				newWidget.containerNode.style.display = "";
				var paneHeight = this._verticalSpace;
				dojo.forEach(newWidget.getChildren(), function(widget){
					if(widget.resize){
						widget.resize({h: paneHeight});
					}
				});

				var openAnimation = dojo.animateProperty({ 
					node: newWidget.containerNode, 
					duration: this.duration,
					properties: {
						height: { start: "1", end: paneHeight } 
					}
				});
			}
			if(oldWidget){
				oldWidget.setSelected(false);
				var closeAnimation = dojo.animateProperty({ 
					node: oldWidget.containerNode, 
					duration: this.duration,
					properties: {
						height: { start: paneHeight, end: "1" } 
					} 
				});
/*
				dojo.connect(animation, "onAnimate", animation, function(size){ 
//TODO: resize Sizable singleton child to avoid scrollbar problems on FF2?
				});
*/
				dojo.connect(closeAnimation, "onEnd", null, function(){ 
					oldWidget.containerNode.style.display = "none";
				});
			}

			var animation = openAnimation;
			if(openAnimation && closeAnimation){
				animation = openAnimation.combine([ closeAnimation ]);
			}else if(closeAnimation){
				animation = closeAnimation;
			}
			animation.play();
/*
//TODO: events need to fire here also
			if(oldWidget){
				this._hideChild(oldWidget);
			}
*/
		}
	}
);

dojo.declare(
	"dijit.layout.AccordionPane",
	[dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Showable,
	  dijit.base.Layout, dijit.base.Contained],
{
	// summary
	//		AccordionPane is a box with a title that contains another widget (often a ContentPane).
	//		It's a widget used internally by AccordionContainer.

	// title: String
	//		title to print on top of AccordionPane
	title: "",

	// selected: Boolean
	//	if true, this is the open pane
	selected: false,

	templatePath: dojo.moduleUrl("dijit.layout", "templates/AccordionPane.html"),

	postCreate: function(){
		dijit.layout.AccordionPane.superclass.postCreate.apply(this, arguments);
		dojo.addClass(this.domNode, this["class"]);
		dijit._disableSelection(this.titleNode);
		this.setSelected(this.selected);

		// Prevent IE bleed-through problem
		this.bgIframe = new dijit.util.BackgroundIframe(this.domNode);
	},

/*
//TODO: why do we need Layout for AccordionPane?
	layout: function(){
		var children = [
			{domNode: this.titleNode, layoutAlign: "top"},
			{domNode: this.containerNode, layoutAlign: "client"}
		];
		dijit.base.Layout.layoutChildren(this.domNode, this._contentBox, children);
		var child = this.getChildren()[0];
		if(child && child.resize){
			child.resize(this._contentBox);
		}
	},
*/

	getTitleHeight: function(){
		// summary: returns the height of the title dom node
		return dojo.marginBox(this.titleNode).h;	// Integer
	},

	_onTitleClick: function(){
		// summary: callback when someone clicks my title
		var parent = this.getParent();
//		parent.selectChild(parent.selectedChildWidget == this ? null : this);
		parent.selectChild(this);
	},

	setSelected: function(/*Boolean*/ isSelected){
		this.selected = isSelected;
		(isSelected ? dojo.addClass : dojo.removeClass)(this.domNode, "dijitAccordionPane-selected");
/*
		// make sure child is showing (lazy load), and also that onShow()/onHide() is called
		var child = this.getChildren()[0];
		if(child){
			if(isSelected){
				if(child.isShowing()){
					child.onShow();
				}else{
					child.show();
				}
			}else{
				// #1969 - Firefox has a display glitch, force child to hide
				// only the titlepane will get the slide animation
				if(child.isShowing()){
					child.hide();
				}
				child.onHide();
			}
		}
*/
	}
});

// These arguments can be specified for the children of a PageContainer.
// Since any widget can be specified as a PageContainer child, mix them
// into the base widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit.base.Widget, {
	// title: String
	//		Title of this widget.  Used by TabContainer to the name the tab, etc.
	title: "",

	// selected: Boolean
	//		Is this child currently selected?
	selected: false
});
