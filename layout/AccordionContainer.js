dojo.provide("dijit.layout.AccordionContainer");

dojo.require("dojo.fx");

dojo.require("dijit.layout.PageContainer");

dojo.declare(
	"dijit.layout.AccordionContainer",
	[dijit.layout.PageContainer],
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
		//			<p>This is some text</p>
		// 		...
		// 	</div>

		// duration: Integer
		//		Amount of time (in ms) it takes to slide panes
		duration: 250,

		_verticalSpace: 0,

		startup: function(){
			dijit.layout.PageContainer.prototype.startup.apply(this, arguments);
			if(this.selectedChildWidget){
				this.selectedChildWidget.containerNode.style.display = "";
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

		_transition: function(/*Widget?*/newWidget, /*Widget?*/oldWidget){
//TODO: should be able to replace this with calls to slideIn/slideOut
			var animations = [];
			if(newWidget){
				newWidget.setSelected(true);
				newWidget.containerNode.style.display = "";
				var paneHeight = this._verticalSpace;
				dojo.forEach(newWidget.getChildren(), function(widget){
					if(widget.resize){
						widget.resize({h: paneHeight});
					}
				});

				animations.push(dojo.animateProperty({ 
					node: newWidget.containerNode, 
					duration: this.duration,
					properties: {
						height: { start: "1", end: paneHeight }
					},
					onEnd: function(){
						newWidget.containerNode.style.overflow = "auto";
					}
				}));
			}
			if(oldWidget){
				oldWidget.setSelected(false);
				oldWidget.containerNode.style.overflow = "hidden";
				animations.push(dojo.animateProperty({ 
					node: oldWidget.containerNode,
					duration: this.duration,
					properties: {
						height: { start: paneHeight, end: "1" } 
					},
					onEnd: function(){
						oldWidget.containerNode.style.display = "none";
					}
				}));
			}

			dojo.fx.combine(animations).play();
		}
	}
);

dojo.declare(
	"dijit.layout.AccordionPane",
	[dijit.base.Widget, dijit.base.TemplatedWidget,
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
	},

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
	}
});
