dojo.provide("dijit.layout.AccordionContainer");

dojo.require("dojo.fx");
dojo.require("dijit.base.Widget");
dojo.require("dijit.base.Layout");
dojo.require("dijit.base.Showable");
dojo.require("dijit.layout.PageContainer");
dojo.require("dijit.util.BackgroundIframe");
dojo.require("dijit.base.TemplatedWidget");
/**
 * description
 *	Front view (3 panes, pane #2 open)
 *	------------------------
 *	|:::Pane#1 title:::    |
 * 	|:::Pane#2 title:::    |
 *	|                      |
 *	|    pane#2 contents   |
 *	|                      |
 *	|:::Pane#3 title:::    |
 *	------------------------
 *
 *	Side view (showing implementation):
 *
 *         viewport    pane#3     pane#2     pane#1
 *            =                                
 *            |                                =
 *            |                      =         |
 *	front     |                      |         |
 *            |                      |         =
 *            |                      =
 *            |          =
 *            =          |
 *                       |
 *                       =
 *
 *	Panes are stacked by z-index like a stack of cards, so they can be slid correctly.
 *	The panes on the bottom extend past the bottom of the viewport (but are hidden).
 *
 * usage
 *	<div dojoType="dijit.layout.AccordionContainer">
 *		<div dojoType="dijit.layout.ContentPane" label="pane 1">...</div>
 *		...
 *	</div>
 *
 * TODO:
 *	* this widget should extend PageContainer
 */

dojo.declare(
	"dijit.layout.AccordionContainer",
	[dijit.base.Widget, dijit.base.Layout, dijit.base.Showable],
	{

		// summary: 
		//		Holds a set of panes where every pane's title is visible, but only one pane's content is visible at a time,
		//		and switching between panes is visualized by sliding the other panes up/down.
		
		// labelNodeClass: String
		//		CSS class name for dom node w/the title
		labelNodeClass: "label",
		
		// containerNodeClass: String
		//		CSS class name for dom node holding the content
		containerNodeClass: "accBody",

		// duration: Integer
		//		Amount of time (in ms) it takes to slide panes
		duration: 250,

		postCreate: function(){
			dijit.layout.AccordionContainer.superclass.postCreate.apply(this, arguments);
			with(this.domNode.style){
				// position must be either relative or absolute
				if(position!="absolute"){
					position="relative";
				}
				overflow="hidden";
			}
		},

		addChild: function(widget){
			var child = this._addChild(widget);
			this._setSizes();
			return child;	// Widget
		},
		
		_addChild: function(widget){
			// summary
			//		Internal call to add child, used during postCreate() and by the real addChild() call

			if(widget.declaredClass != "dijit.layout.AccordionPane"){
				// create a node that will be promoted to an accordionpane
				var refNode = document.createElement("span");
				this.domNode.appendChild(refNode);
				var wrapper = new dijit.layout.AccordionPane({label: widget.label, 
									selected: widget.selected, labelNodeClass: this.labelNodeClass,
									containerNodeClass: this.containerNodeClass, allowCollapse: this.allowCollapse }, refNode);
				wrapper.addChild(widget);
				this.domNode.appendChild(wrapper.domNode);
				return wrapper;	// Widget
			}else{
				dojo.addClass(widget.containerNode, this.containerNodeClass);
				dojo.addClass(widget.labelNode, this.labelNodeClass);
				dojo.place(widget.domNode, this.domNode, "last");
				return widget;	// Widget
			}
		},

		layout: function(){
			var tmpChildren = this.getChildren();

			// PORT: move to utility class
			var _removeChildren = function(node){
				var count = node.childNodes.length;
				while(node.hasChildNodes()){
					node.removeChild(node.firstChild); 
				}
				return count; // int
			};
			_removeChildren(this.domNode);
			dojo.forEach(tmpChildren, dojo.hitch(this,"_addChild"));
			this._setSizes();
		},

		removeChild: function(widget){
			dijit.layout.AccordionContainer.superclass.removeChild.call(this, widget);
			this._setSizes();
		},
		
		onResized: function(){
			this._setSizes();
		},

		_setSizes: function(){
			// summary
			//		Set panes' size/position based on my size, and the current open node.

			// get cumulative height of all the title bars, and figure out which pane is open
			var totalCollapsedHeight = 0;
			var openIdx = 0;
			dojo.forEach(this.getChildren(), function(child, idx){
				totalCollapsedHeight += child.getLabelHeight();
				if(child.selected){ openIdx=idx; }
			});
			// size and position each pane
			var mySize = dojo.contentBox(this.domNode);
			var y = 0;
			dojo.forEach(this.getChildren(), function(child, idx){
				var childCollapsedHeight = child.getLabelHeight();
				child.resize({w: mySize.w, h: mySize.h -totalCollapsedHeight+childCollapsedHeight});
				var style = child.domNode.style;
				style.zIndex=idx+1;
				style.position="absolute";
				style.top = y+"px";
				// TODO: REVISIT: PORT: was getBorderBox, now is marginBox ?
				y += (idx==openIdx) ? dojo.marginBox(child.domNode).h : childCollapsedHeight;
			});
		},

		selectChild: function(page){
			// summary
			//		close the current page and select a new one
			dojo.forEach(this.getChildren(), function(child){child.setSelected(child==page);});
			// slide each pane that needs to be moved
			var y = 0;
			var anims = [];
			dojo.forEach(this.getChildren(), function(child, idx){
				if(child.domNode.style.top != (y+"px")){
					anims.push(dojo.fx.slideTo({node: child.domNode,
								top: y, left: 0, duration: this.duration}));
				}
				// TODO: REVISIT: PORT: was getBorderBox, now is marginBox ?
				y += child.selected ? dojo.marginBox(child.domNode).h : child.getLabelHeight();
			}, this);
			dojo.fx.combine(anims).play();
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
	// label: String
	//		label to print on top of AccordionPane
	label: "",

	// class: String
	//	CSS class name for the AccordionPane's dom node
	"class": "dojoAccordionPane",

	// labelNodeClass: String
	//	CSS class name for the AccordionPane's label node
	labelNodeClass: "label",

	// containerNodeClass: String
	//	CSS class name for the AccordionPane's container node
	containerNodeClass: "accBody",
	
	// selected: Boolean
	//	if true, this is the open pane
	selected: false,

	templatePath: dojo.moduleUrl("dijit.layout", "templates/AccordionPane.html"),

	postCreate: function(){
		dijit.layout.AccordionPane.superclass.postCreate.apply(this, arguments);
		dojo.addClass(this.domNode, this["class"]);
		dijit._disableSelection(this.labelNode);
		this.setSelected(this.selected);

		// Prevent IE bleed-through problem
		this.bgIframe = new dijit.util.BackgroundIframe(this.domNode);
	},

	setLabel: function(/*String*/ label){
		// summary: set the  title of the node
		this.labelNode.innerHTML=label;
	},
	
	onResized: function(){
		var children = [
			{domNode: this.labelNode, layoutAlign: "top"},
			{domNode: this.containerNode, layoutAlign: "client"}
		];
		dijit.base.Layout.layoutChildren(this.domNode, children);
		var childSize = dojo.contentBox(this.containerNode);
		var child = this.getChildren()[0];
		if(child && child.resize){
			child.resize(childSize);
		}
	},

	getLabelHeight: function(){
		// summary: returns the height of the title dom node
		return dojo.marginBox(this.labelNode).h;	// Integer
	},

	onLabelClick: function(){
		// summary: callback when someone clicks my label
		this.getParent().selectChild(this);
	},
	
	setSelected: function(/*Boolean*/ isSelected){
		this.selected=isSelected;
		(isSelected ? dojo.addClass : dojo.removeClass)(this.domNode, this["class"]+"-selected");

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
	}
});
