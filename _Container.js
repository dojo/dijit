dojo.provide("dijit._Container");

dojo.declare("dijit._Contained",
	null,
	{
		// summary
		//		Mixin for widgets that are children of a container widget

		getParent: function(){
			// summary:
			//		returns the parent widget of this widget, assuming the parent
			//		implements dijit._Container
			for(var p=this.domNode.parentNode; p; p=p.parentNode){
				var id = p.getAttribute && p.getAttribute("widgetId");
				if(id){
					var parent = dijit.byId(id);
					return parent.isContainer ? parent : null;
				}
			}
			return null;
		},

		_getSibling: function(which){
			var node = this.domNode;
			do{
				node = node[which+"Sibling"];
			}while(node && node.nodeType != 1);
			if(!node){ return null; } // null
			var id = node.getAttribute("widgetId");
			return dijit.byId(id);
		},

		getPreviousSibling: function(){
			// summary:
			//		returns null if this is the first child of the parent,
			//		otherwise returns the next element sibling to the "left".

			return this._getSibling("previous");
		},

		getNextSibling: function(){
			// summary:
			//		returns null if this is the last child of the parent,
			//		otherwise returns the next element sibling to the "right".

			return this._getSibling("next");
		}
	}
);

dojo.declare("dijit._Container",
	null,
	{
		// summary
		//		Mixin for widgets that contain a list of children like SplitContainer

		isContainer: true,

		addChild: function(/*Widget*/ widget, /*int?*/ insertIndex){
			// summary:
			//		Process the given child widget, inserting it's dom node as
			//		a child of our dom node

			if(typeof insertIndex == "undefined"){
				insertIndex = "last";
			}
			dojo.place(widget.domNode, this.containerNode || this.domNode, insertIndex);

			// If I've been started but the child widget hasn't been started,
			// start it now.  Make sure to do this after widget has been
			// inserted into the DOM tree, so it can see that it's being controlled by me,
			// so it doesn't try to size itself.
			if(this._started && !widget._started){
				widget.startup();
			}
		},

		removeChild: function(/*Widget*/ widget){
			// summary:
			//		removes the passed widget instance from this widget but does
			//		not destroy it
			var node = widget.domNode;
			node.parentNode.removeChild(node);	// detach but don't destroy
		},

		_nextElement: function(node){
			do{
				node = node.nextSibling;
			}while(node && node.nodeType != 1);
			return node;
		},

		_firstElement: function(node){
			node = node.firstChild;
			if(node && node.nodeType != 1){
				node = this._nextElement(node);
			}
			return node;
		},

		getChildren: function(){
			// summary:
			//		returns array of children widgets
			return dojo.query("> [widgetId]", this.containerNode || this.domNode).map(dijit.byNode); // Array
		},

		hasChildren: function(){
			// summary:
			//		returns true if widget has children
			var cn = this.containerNode || this.domNode;
			return !!this._firstElement(cn); // Boolean
		},

		_getSiblingOfChild: function(/*Widget*/ child, /*int*/ dir){
			// summary:
			//		get the next or previous sibling of child
			// dir:
			//		if 1, get the next sibling
			//		if -1, get the previous sibling
			var node = child.domNode;
			var which = (dir == -1 ? "previousSibling" : "nextSibling");
			do{
				node = node[which];
			}while(node && node.nodeType != 1);
			return node ? dijit.byNode(node) : null;
		}
	}
);

dojo.declare("dijit._KeyNavContainer",
	[dijit._Container],
	{

		// summary:
		//		A _Container with keyboard navigation of its children.
		//		To use this mixin, call connectKeyNavHandlers() in
		//		postCreate() and call connectKeyNavChildren() in startup().

		focusedChild: null,

		_keyNavCodes: {},

		_manageTabIndex: false,

		connectKeyNavHandlers: function(/*Array*/ prevKeyCodes, /*Array*/ nextKeyCodes, /*boolean*/ manageTabIndex){
			// summary:
			//		Call in postCreate() to attach the keyboard handlers
			//		to the container.
			// preKeyCodes: Array
			//		Key codes for navigating to the previous child.
			// nextKeyCodes: Array
			//		Key codes for navigating to the next child.
			// manageTabIndex: boolean
			//		If true, set tabIndex on first child to 0, all others to -1.
			//		If false, do not modify the tabIndex of any children.

			this._keyNavCodes = {};
			for(var i=0; i < prevKeyCodes.length; i++){
				this._keyNavCodes[prevKeyCodes[i]] = -1;
			}
			for(var i=0; i < nextKeyCodes.length; i++){
				this._keyNavCodes[nextKeyCodes[i]] = 1;
			}
			this._manageTabIndex = manageTabIndex;
			dojo.connect(this.domNode, "onkeypress", this, "_onContainerKeypress");
			if(dojo.isIE){
				dojo.connect(this.domNode, "ondeactivate", this, "_onContainerBlur");
			}else{
				dojo.connect(this.domNode, "onblur", this, "_onContainerBlur");
			}
		},

		connectKeyNavChildren: function(){
			// summary:
			//		Call in setup() to attach focus handlers to the
			//		container's children.

			var children = this.getChildren();
			for(var i=0; i < children.length; i++){
				this._connectChild(children[i]);
			}
		},

		addChild: function(/*Widget*/ widget, /*int?*/ insertIndex){
			dijit._KeyNavContainer.superclass.addChild.apply(this, arguments);
			this._connectChild(widget);
		},

		focusFirstChild: function(){
			// summary: Focus the first focusable child in the container.
			this.focusChild(this._getFirstFocusableChild());
		},

		focusChild: function(/*Widget*/ widget){
			// summary: Focus widget.
			if(widget && widget !== this.focusedChild){
				if(this.focusedChild){
					this._onChildBlur(this.focusedChild);
				}
				this.focusedChild = widget;
				widget.focus();
			}
		},

		_connectChild: function(/*Widget*/ widget){
			if(this._manageTabIndex){
				this._setTabIndex(widget, widget === this._getFirstFocusableChild() ? 0 : -1);
			}
			if(dojo.isIE){
				dojo.connect(widget.domNode, "onactivate", this, "_onChildFocus");
			}else{
				dojo.connect(widget.domNode, "onfocus", this, "_onChildFocus");
			}
		},

		_onChildBlur: function(/*Widget*/ widget){
			// summary:
			//		Called when focus leaves a child widget to go
			//		to a sibling widget.
		},

		_onContainerKeypress: function(evt){
			if(evt.ctrlKey || evt.altKey){ return; }
			var dir = this._keyNavCodes[evt.keyCode];
			if(dir){
				this.focusChild(this._getNextFocusableChild(this.focusedChild, dir));
				dojo.stopEvent(evt);
			}
		},

		_onChildFocus: function(evt){
			this.focusedChild = dijit.byNode(evt.currentTarget);
			if(this._manageTabIndex){
				this._setTabIndex(this._getFirstFocusableChild(), -1);
			}
		},

		_onContainerBlur: function(evt){
			if(this._manageTabIndex){
				this._setTabIndex(this._getFirstFocusableChild(), 0);
			}
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
				if(child.focus && dojo.style(child.domNode, "display") != "none"){
					return child;
				}
				child = this._getSiblingOfChild(child, dir);
			}
		},

		_setTabIndex: function(widget, value){
			if(widget){
				var node = widget.focusNode || widget.domNode;
				node.setAttribute("tabIndex", value);
			}
		}
	}
);
