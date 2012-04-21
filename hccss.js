define([
	"require",			// require.toUrl
	"dojo/_base/config", // config.blankGif
	"dojo/dom-class", // domClass.add
	"dojo/dom-construct", // domConstruct.create
	"dojo/dom-style", // domStyle.getComputedStyle
	"dojo/ready", // ready
	"dojo/sniff", // has("ie") has("mozilla")
	"dojo/_base/window" // win.body
], function(require, config, domClass, domConstruct, domStyle, ready, has, win){

	// module:
	//		dijit/hccss
	// summary:
	//		Test if computer is in high contrast mode, and sets dijit_a11y flag on <body> if it is.

	// Has() test for when background images aren't displayed.   Should not call has("highcontrast") before dojo/domReady!.
	has.add("highcontrast", function(){
		if(!has("ie") && !has("mozilla")){	// NOTE: checking in Safari messes things up
			return false;
		}

		// create div for testing if high contrast mode is on or images are turned off
		var div = domConstruct.create("div",{
			id: "a11yTestNode",
			style:{
				cssText:'border: 1px solid;' +
					'border-color:red green;'+
					'position: absolute;' +
					'height: 5px;' +
					'top: -999px;' +
					'background-image: url("' + (config.blankGif || require.toUrl("dojo/resources/blank.gif")) + '");'
			}
		}, win.body());	// note: if multiple documents, doesn't matter which one we use

		var cs = domStyle.getComputedStyle(div);
		var bkImg = cs.backgroundImage;
		var hc = (cs.borderTopColor == cs.borderRightColor) ||
			(bkImg && (bkImg == "none" || bkImg == "url(invalid-url:)" ));

		domConstruct.destroy(div);

		return hc;
	});

	// Priority is 90 to run ahead of parser priority of 100.   For 2.0, remove the ready() call and instead
	// change this module to depend on dojo/domReady!
	ready(90, function(){
		if(has("highcontrast")){
			domClass.add(win.body(), "dijit_a11y");
		}
	});

	return has;
});
