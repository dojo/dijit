define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/has", // has("dom-addeventlistener")
	"dojo/keys", // keys.ENTER keys.SPACE
	"dojo/on",
	"dojo/touch" // touch support for click is now there
], function(array, declare, has, keys, on){

	// module:
	//		dijit/a11yclick

	function marked(/*DOMNode*/ node){
		// Test if a node or its ancestor has been marked with the dojoClick property to indicate special processing
		do{
			if(node.dojoClick){ return true; }
		}while(node = node.parentNode);
	}

	function clickKey(/*Event*/ e){
		// Test if this keyboard event should be tracked as the start (if keyup) or end (if keydown) of a click event.
		// Only track for nodes marked to be tracked, and not for buttons or inputs since they handle keyboard click
		// natively.
		return (e.keyCode === keys.ENTER || e.keyCode === keys.SPACE) &&
			!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && !/input|button/i.test(e.target.nodeName) &&
			marked(e.target);
	}

	var lastKeyDownNode;

	on(document, "keydown", function(e){
		//console.log(this.id + ": onkeydown, e.target = ", e.target, ", lastKeyDownNode was ", lastKeyDownNode, ", equality is ", (e.target === lastKeyDownNode));
		if(clickKey(e)){
			// needed on IE for when focus changes between keydown and keyup - otherwise dropdown menus do not work
			lastKeyDownNode = e.target;

			// Prevent viewport scrolling on space key in IE<9.
			// (Reproducible on test_Button.html on any of the first dijit/form/Button examples)
			e.preventDefault();
		}
	});

	on(document, "keyup", function(e){
		//console.log(this.id + ": onkeyup, e.target = ", e.target, ", lastKeyDownNode was ", lastKeyDownNode, ", equality is ", (e.target === lastKeyDownNode));
		if(clickKey(e) && e.target == lastKeyDownNode){	// === breaks greasemonkey
			//need reset here or have problems in FF when focus returns to trigger element after closing popup/alert
			lastKeyDownNode = null;

			on.emit(e.target, "click", {
				cancelable: true,
				bubbles: true
			});
		}
	});

	return function(node, listener){
		// summary:
		//		Custom a11yclick (a.k.a. ondijitclick) event
		//		which triggers on a mouse click, touch, or space/enter keyup.

		node.dojoClick = true;

		return on(node, "click", listener);
	};
});
