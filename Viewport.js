define([
	"dojo/Evented",
	"dojo/on",
	"dojo/domReady",
	"dojo/sniff",	// has("ie"), has("ios")
	"dojo/_base/window", // global
	"dojo/window", // getBox()
	"dijit/focus"
], function(Evented, on, domReady, has, win, winUtils, focus){

	// module:
	//		dijit/Viewport

	/*=====
	return {
		// summary:
		//		Utility singleton to watch for viewport resizes, avoiding duplicate notifications
		//		which can lead to infinite loops.
		// description:
		//		Usage: Viewport.on("resize", myCallback).
		//
		//		myCallback() is called without arguments in case it's _WidgetBase.resize(),
		//		which would interpret the argument as the size to make the widget.
	};
	=====*/

	var Viewport = new Evented();

	domReady(function(){
		var oldBox = winUtils.getBox();
		Viewport._rlh = on(win.global, "resize", function(){
			var newBox = winUtils.getBox();
			if(oldBox.h == newBox.h && oldBox.w == newBox.w){ return; }
			oldBox = newBox;
			Viewport.emit("resize");
		});

		// Also catch zoom changes on IE8, since they don't naturally generate resize events
		if(has("ie") == 8){
			var deviceXDPI = screen.deviceXDPI;
			setInterval(function(){
				if(screen.deviceXDPI != deviceXDPI){
					deviceXDPI = screen.deviceXDPI;
					Viewport.emit("resize");
				}
			}, 500);
		}

		Viewport.getEffectiveBox = function(/*Document*/ doc){
			// summary:
			//		Get the size of the viewport, or on mobile devices, the part of the viewport not obscured by the
			//		virtual keyboard.

			var box = winUtils.getBox(doc);

			// Account for iOS virtual keyboard, if it's being shown.  Unfortunately no direct way to check or measure.
			var fn = focus.curNode;
			if(has("ios") && fn && /^(input|textarea)$/i.test(fn.tagName) &&
					/^(color|email|number|password|search|tel|text|url)$/.test(fn.type)){
				box.h *= (box.h > box.w ? 0.66 : 0.40);
			}

			return box;
		};
	});

	return Viewport;
});
