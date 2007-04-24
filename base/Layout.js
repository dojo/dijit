dojo.provide("dijit.base.LayoutContainer");

dojo.require("dijit.util.Container");

dojo.declare("dijit.base.Sizable", 
	null,
	{
		// summary
		//		Helper mixin for widgets that can have their size adjusted,
		//		and that need to do some processing when their size changes (like SplitContainer)

		resize: function(param){
			// summary:
			//		explicitly set this widget's size (in pixels).
			//		called if our parent is a layout widget.
			//	
			// param: Object
			//		{w: int, h: int}

			dojo.marginBox(this.domNode, param);
			if(!param.width || !param.height){
				param = dojo.marginBox(this.domNode);
			}
			this.onResized(param);
		},
	
		onResized: function(param){
			//	summary
			//		Layout widgets will override this method to size & position their children
			//	
			// param: Object
			//		{w: int, h: int}
		},
		
		startup: function(){
			// summary:
			//		Called after all the widgets have been instantiated and their
			//		dom nodes have been inserted somewhere under document.body

			// if my parent is a layout container then it will resize me; just wait for it's call
			var parent = this.getParent();
			if(parent && parent.isLayoutContainer){
				return;
			}

			// if my parent isn't a layout container, and my style is width=height=100% (or something similar),
			// then I need to watch when the window resizes, and size myself accordingly
			dojo.addListener(window, 'onresize', this, this._onWindowResize); // window resize

			this._onWindowResize();
		},
		
		_onWindowResize: function(){
			// summary:
			//		Called when my size has been changed to an unknown value.
			//		If the size is explicitly changed by calling resize() this
			//		function is not called.
			// Size my children based on my size
			var size = dojo.marginBox(this.domNode);
			this.onResized(size);
		}
	}
);

dojo.declare("dijit.base.LayoutContainer", 
	[dijit.base.Container, dijit.base.Sizeable],
	{
		// summary
		//		Mixin for widgets that contain a list of children like SplitContainer.
		//		Widgets which mixin this code must define onResized() to lay out the children

		isLayoutContainer: true
	}
);
