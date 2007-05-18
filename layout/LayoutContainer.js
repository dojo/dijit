dojo.provide("dijit.layout.LayoutContainer");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.Showable");
dojo.require("dijit.base.Layout");

dojo.declare(
	"dijit.layout.LayoutContainer",
	[dijit.base.Widget, dijit.base.Layout, dijit.base.Showable],
{
	// summary
	//	Provides Delphi-style panel layout semantics.
	//
	// details
	//	A LayoutContainer is a box with a specified size (like style="width: 500px; height: 500px;"),
	//	that contains children widgets marked with "layoutAlign" of "left", "right", "bottom", "top", and "client".
	//	It takes it's children marked as left/top/bottom/right, and lays them out along the edges of the box,
	//	and then it takes the child marked "client" and puts it into the remaining space in the middle.
	//
	//  Left/right positioning is similar to CSS's "float: left" and "float: right",
	//	and top/bottom positioning would be similar to "float: top" and "float: bottom", if there were such
	//	CSS.
	//
	//	Note that there can only be one client element, but there can be multiple left, right, top,
	//	or bottom elements.
	//
	// usage
	//	<style>
	//		html, body{ height: 100%; width: 100%; }
	//	</style>
	//	<div dojoType="LayoutContainer" style="width: 100%; height: 100%">
	//		<div dojoType="ContentPane" layoutAlign="top">header text</div>
	//		<div dojoType="ContentPane" layoutAlign="left" style="width: 200px;">table of contents</div>
	//		<div dojoType="ContentPane" layoutAlign="client">client area</div>
	//	</div>

	// layoutChildPriority: String
	//	- If the value is "top-bottom", then LayoutContainer will first position the "top" and "bottom" aligned elements,
	//	to and then put the left and right aligned elements in the remaining space, between the top and the bottom elements.
	//	It aligns the client element at the very end, in the remaining space.
	//
	//	- If the value is "left-right", then it first positions the "left" and "right" elements, and then puts the
	//	"top" and "bottom" elements in the remaining space, between the left and the right elements.
	//	It aligns the client element at the very end, in the remaining space.
	//
	//	- If the value is "none", then it will lay out each child in the natural order the children occur in.
	//	Basically each child is laid out into the "remaining space", where "remaining space" is initially
	//	the content area of this widget, but is reduced to a smaller rectangle each time a child is added.
	//	
	layoutChildPriority: 'top-bottom',

	layout: function(){
		var ok = dijit.base.Layout.layoutChildren(this.domNode, this._contentBox, this.getChildren(), this.layoutChildPriority);
	},

	addChild: function(child, overrideContainerNode, pos, ref, insertIndex){
		dijit.base.Container.prototype.addChild.apply(this, arguments);
		dijit.base.Layout.layoutChildren(this.domNode, this._contentBox, this.getChildren(), this.layoutChildPriority);
	},

	removeChild: function(pane){
        dijit.base.Container.prototype.removeChild.apply(this, arguments);
		dijit.base.Layout.layoutChildren(this.domNode, this._contentBox, this.getChildren(), this.layoutChildPriority);
	},

	show: function(){
		// If this node was created while display=="none" then it
		// hasn't been laid out yet.  Do that now.
		this.domNode.style.display="";
		this.checkSize();
		this.domNode.style.display="none";
		this.domNode.style.visibility="";

		dijit.base.Showable.prototype.show.apply(this, arguments);
	}
});

// This argument can be specified for the children of a LayoutContainer.
// Since any widget can be specified as a LayoutContainer child, mix it
// into the base widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit.base.Widget, {
	// layoutAlign: String
	//		"none", "left", "right", "bottom", "top", and "client".
	//		See the LayoutContainer description for details on this parameter.
	layoutAlign: 'none'
});
