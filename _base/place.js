define([
	"dojo",
	"..",
	"../place",
	"dojo/window"], function(dojo, dijit, place) {

	//	module:
	//		dijit/_base/place
	//	summary:
	//		Back compatibility module, new code should use dijit/place directly instead of using this module.
	//

	dijit.getViewport = function(){
		// summary:
		//		Deprecated method to return the dimensions and scroll position of the viewable area of a browser window.
		//		New code should use dojo.window.getBox()

		return dojo.window.getBox();
	};

	function convertAroundCorners(ac){
		// summary:
		//		Convert old style {"BL": "TL", "BR": "TR"} type argument
		//		to style needed by dijit.place code:
		//		[
		// 			{aroundCorner: "BL", corner: "TL" },
		//			{aroundCorner: "BR", corner: "TR" }
		//		]
		var ary = [];
		for(var key in ac){
			ary.push({aroundCorner: key, corner: ac[key]});
		}
		return ary;
	}

	/*=====
	dijit.placeOnScreen: function(node, pos, corners, padding){
		// summary:
		//		Positions one of the node's corners at specified position
		//		such that node is fully visible in viewport.
		//		Deprecated, new code should use dijit.place.at() instead.
	=====*/
	dijit.placeOnScreen = place.at;

	/*=====
	dijit.placeOnScreenAroundElement = function(node, aroundElement, aroundCorners, layoutNode){
		// summary:
		//		Like dijit.placeOnScreenAroundNode(), except it accepts an arbitrary object
		//		for the "around" argument and finds a proper processor to place a node.
		//		Deprecated, new code should use dijit.place.around() instead.
	};
	====*/
	dijit.placeOnScreenAroundElement = function(node, aroundNode, aroundCorners, layoutNode){
		var positions = aroundCorners.position || convertAroundCorners(aroundCorners),
			leftToRight = "leftToRight" in aroundCorners ? aroundCorners.leftToRight : true;
		return place.around(node, aroundNode, positions, leftToRight, layoutNode);
	};

	/*=====
	dijit.placeOnScreenAroundNode = function(node, aroundNode, aroundCorners, layoutNode){
		// summary:
		//		Position node adjacent or kitty-corner to aroundNode
		//		such that it's fully visible in viewport.
		//		Deprecated, new code should use dijit.place.around() instead.
	};
	=====*/
	dijit.placeOnScreenAroundNode = dijit.placeOnScreenAroundElement;

	/*=====
	dijit.placeOnScreenAroundRectangle = function(node, aroundRect, aroundCorners, layoutNode){
		// summary:
		//		Like dijit.placeOnScreenAroundNode(), except that the "around"
		//		parameter is an arbitrary rectangle on the screen (x, y, width, height)
		//		instead of a dom node.
		//		Deprecated, new code should use dijit.place.around() instead.
	};
	=====*/
	dijit.placeOnScreenAroundRectangle = dijit.placeOnScreenAroundElement;

	/*=====
	dijit.getPopupAroundAlignment = function(position, ***leftToRight***){
		// summary:
		//		Transforms the passed array of preferred positions into a format suitable for
		//		passing as the aroundCorners argument to dijit.placeOnScreenAroundElement() etc.
		//		Deprecated, new code should use dijit.place.around() directly.
	};
	=====*/
	dijit.getPopupAroundAlignment = function(position, leftToRight){
		return {position: position, leftToRight: leftToRight}
	};

	return dijit;
});
