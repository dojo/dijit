dojo.provide("dijit._KeyNavContainer");
dojo.require("dijit._Container");

dojo.declare("dijit._KeyNavContainer",
	[dijit._Container],
	{

		// summary: A _Container with keyboard navigation of its children.
		// decscription:
		//		To use this mixin, call connectKeyNavHandlers() in
		//		postCreate() and call startupKeyNavChildren() in startup().
		//		It provides normalized keyboard and focusing code for Container
		//		widgets.
/*=====
		// focusedChild: Widget
		//		The currently focused child widget, or null if there isn't one
		focusedChild: null,
=====*/

		// tabIndex: Integer
		//		Tab index of the container; same as HTML tabindex attribute.
		//		Note then when user tabs into the container, focus is immediately
		//		moved to the first item in the container.
		tabIndex: "0",


		_keyNavCodes: {},

		connectKeyNavHandlers: function(/*Array*/ prevKeyCodes, /*Array*/ nextKeyCodes){
			// summary:
			//		Call in postCreate() to attach the keyboard handlers
			//		to the container.
			// preKeyCodes: Array
			//		Key codes for navigating to the previous child.
			// nextKeyCodes: Array
			//		Key codes for navigating to the next child.

			var keyCodes = this._keyNavCodes = {};
			var prev = dojo.hitch(this, this.focusPrev);
			var next = dojo.hitch(this, this.focusNext);
			dojo.forEach(prevKeyCodes, function(code){ keyCodes[code] = prev });
			dojo.forEach(nextKeyCodes, function(code){ keyCodes[code] = next });
			this.connect(this.domNode, "onkeypress", "_onContainerKeypress");
			this.connect(this.domNode, "onfocus", "_onContainerFocus");
		},

		startupKeyNavChildren: function(){
			// summary:
			//		Call in startup() to set child tabindexes to -1
			dojo.forEach(this.getChildren(), dojo.hitch(this, "_startupChild"));
		},

		addChild: function(/*Widget*/ widget, /*int?*/ insertIndex){
			// summary: Add a child to our _Container
			dijit._KeyNavContainer.superclass.addChild.apply(this, arguments);
			this._startupChild(widget);
		},

		focus: function(){
			// summary: Default focus() implementation: focus the first child.
			this.focusFirstChild();
		},

		focusFirstChild: function(){
			// summary: Focus the first focusable child in the container.
			this.focusChild(this._getFirstFocusableChild());
		},

		focusNext: function(){
			// summary: Focus the next widget or focal node (for widgets
			//		with multiple focal nodes) within this container.
			if(this.focusedChild && this.focusedChild.hasNextFocalNode
					&& this.focusedChild.hasNextFocalNode()){
				this.focusedChild.focusNext();
				return;
			}
			var child = this._getNextFocusableChild(this.focusedChild, 1);
			if(child.getFocalNodes){
				this.focusChild(child, child.getFocalNodes()[0]);
			}else{
				this.focusChild(child);
			}
		},

		focusPrev: function(){
			// summary: Focus the previous widget or focal node (for widgets
			//		with multiple focal nodes) within this container.
			if(this.focusedChild && this.focusedChild.hasPrevFocalNode
					&& this.focusedChild.hasPrevFocalNode()){
				this.focusedChild.focusPrev();
				return;
			}
			var child = this._getNextFocusableChild(this.focusedChild, -1);
			if(child.getFocalNodes){
				var nodes = child.getFocalNodes();
				this.focusChild(child, nodes[nodes.length-1]);
			}else{
				this.focusChild(child);
			}
		},

		focusChild: function(/*Widget*/ widget, /*Node?*/ node){
			// summary: Focus widget. Optionally focus 'node' within widget.
			if(widget){
				if(this.focusedChild && widget !== this.focusedChild){
					this._onChildBlur(this.focusedChild);
				}
				this.focusedChild = widget;
				if(node && widget.focusFocalNode){
					widget.focusFocalNode(node);
				}else{
					widget.focus();
				}
			}
		},

		_startupChild: function(/*Widget*/ widget){
			// summary:
			//		Set tabindex="-1" on focusable widgets so that we
			// 		can focus them programmatically and by clicking.
			//		Connect focus and blur handlers.
			if(widget.getFocalNodes){
				dojo.forEach(widget.getFocalNodes(), function(node){
					dojo.attr(node, "tabindex", -1);
					this._connectNode(node);
				}, this);
			}else{
				var node = widget.focusNode || widget.domNode;
				if(widget.isFocusable()){
					dojo.attr(node, "tabindex", -1);
				}
				this._connectNode(node);
			}
		},

		_connectNode: function(/*Element*/ node){
			this.connect(node, "onfocus", "_onNodeFocus");
			this.connect(node, "onblur", "_onNodeBlur");
		},

		_onContainerFocus: function(evt){
			// Initially the container itself has a tabIndex, but when it gets
			// focus, switch focus to first child...
			// Note that we can't use _onFocus() because switching focus from the
			// _onFocus() handler confuses the focus.js code
			// (because it causes _onFocusNode() to be called recursively)

			// focus bubbles on Firefox,
			// so just make sure that focus has really gone to the container
			if(evt.target !== this.domNode){ return; }

			this.focusFirstChild();
			
			// and then remove the container's tabIndex,
			// so that tab or shift-tab will go to the fields after/before
			// the container, rather than the container itself
			dojo.removeAttr(this.domNode, "tabIndex");
		},

		_onBlur: function(evt){
			// When focus is moved away the container, and it's descendant (popup) widgets,
			// then restore the container's tabIndex so that user can tab to it again.
			// Note that using _onBlur() so that this doesn't happen when focus is shifted
			// to one of my child widgets (typically a popup)
			if(this.tabIndex){
				dojo.attr(this.domNode, "tabindex", this.tabIndex);
			}
		},

		_onContainerKeypress: function(evt){
			if(evt.ctrlKey || evt.altKey){ return; }
			var func = this._keyNavCodes[evt.charOrCode];
			if(func){
				func();
				dojo.stopEvent(evt);
			}
		},

		_onNodeFocus: function(evt){
			// record the child that has been focused
			var widget = dijit.getEnclosingWidget(evt.target);
			if(widget && widget.isFocusable()){
				this.focusedChild = widget;
			}
			dojo.stopEvent(evt);
		},

		_onNodeBlur: function(evt){
			dojo.stopEvent(evt);
		},

		_onChildBlur: function(/*Widget*/ widget){
			// summary:
			//		Called when focus leaves a child widget to go
			//		to a sibling widget.
		},

		_getFirstFocusableChild: function(){
			return this._getNextFocusableChild(null, 1);
		},

		_getNextFocusableChild: function(child, dir){
			if(child){
				child = this._getSiblingOfChild(child, dir);
			}
			var children = this.getChildren();
			for(var i=0; i < children.length; i++){
				if(!child){
					child = children[(dir>0) ? 0 : (children.length-1)];
				}
				if(child.isFocusable()){
					return child;
				}
				child = this._getSiblingOfChild(child, dir);
			}
			// no focusable child found
			return null;
		}
	}
);
