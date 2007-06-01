dojo.provide("dijit.util.wai");

dijit.util.waiNames  = ["waiRole", "waiState"];

dijit.util.wai = {
	// summary: Contains functions to set accessibility roles and states
	//		onto widget elements
	waiRole: { 	
				// name: String:
				//		information for mapping accessibility role
				name: "waiRole", 
				// namespace: String:
				//		URI of the namespace for the set of roles
				"namespace": "http://www.w3.org/TR/xhtml2", 
				// alias: String:
				//		The alias to assign the namespace
				alias: "x2",
				// prefix: String:
				//		The prefix to assign to the role value
				prefix: "wairole:"
	},
	waiState: { 
				// name: String:
				//		information for mapping accessibility state
				name: "waiState", 
				// namespace: String:
				//		URI of the namespace for the set of states
				"namespace": "http://www.w3.org/2005/07/aaa", 
				// alias: String:
				//		The alias to assign the namespace
				alias: "aaa",
				// prefix: String:
				//		empty string - state value does not require prefix
				prefix: ""
	},
	setAttr: function(/*DomNode*/node, /*String*/ ns, /*String*/ attr, /*String|Boolean*/value){
		// summary: Use appropriate API to set the role or state attribute onto the element.
		// description: In IE use the generic setAttribute() api.  Append a namespace
		//   alias to the attribute name and appropriate prefix to the value. 
		//   Otherwise, use the setAttribueNS api to set the namespaced attribute. Also
		//   add the appropriate prefix to the attribute value.
		if(dojo.isIE){
			node.setAttribute(this[ns].alias+":"+ attr, this[ns].prefix+value);
		}else{
			node.setAttributeNS(this[ns]["namespace"], attr, this[ns].prefix+value);
		}
	},

	getAttr: function(/*DomNode*/ node, /*String*/ ns, /*String|Boolena*/ attr){
		// Summary:  Use the appropriate API to retrieve the role or state value
		// Description: In IE use the generic getAttribute() api.  An alias value 
		// 	was added to the attribute name to simulate a namespace when the attribute
		//  was set.  Otherwise use the getAttributeNS() api to retrieve the state value
		if(dojo.isIE){
			return node.getAttribute(this[ns].alias+":"+attr);
		}else{
			return node.getAttributeNS(this[ns]["namespace"], attr);
		}
	},
	removeAttr: function(/*DomNode*/ node, /*String*/ ns, /*String|Boolena*/ attr){
		// summary:  Use the appropriate API to remove the role or state value
		// description: In IE use the generic removeAttribute() api.  An alias value 
		// 	was added to the attribute name to simulate a namespace when the attribute
		//  was set.  Otherwise use the removeAttributeNS() api to remove the state value
		var success = true; //only IE returns a value
		if(dojo.isIE){
			 success = node.removeAttribute(this[ns].alias+":"+attr);
		}else{
			node.removeAttributeNS(this[ns]["namespace"], attr);
		}
		return success;
	},
	
	imageBgToSrc : function(/* Node | Node[] */ images) {
		// summary:  
		//		Given a single image or array of images
		//		figure out the background-image style property
		//		and apply that to the image.src property.
		// description:  
		//		For accessibility reasons, all images that are necessary to the
		//		functioning of a widget should use <image> tags.  Using this method
		//		allows the image URLs to come from themes (via CSS),
		//		while still using the image tags.
		// todo:
		//		* have this examine background-position and, if set,
		//			wrap the image in an inline div that allows us to crop
		//			the image according to width and height specified in CSS.
		if (!dojo.isArrayLike(images)) { images = [images]; }
		dojo.forEach(images, 
			function(image) {
				var style = image && dojo.getComputedStyle(image);
				if (!style) return;
				var href = style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
				if (!href) return;
				image.src = href[1];
				image.style.backgroundImage = "none";
			}
		);
	}
};

// On page load and at intervals, detect if we are in high-contrast mode or not
dojo._loaders.unshift(function(){
	// create div for testing
	var div = document.createElement("div");
	div.id = "a11yTestNode";
	dojo.body().appendChild(div);
	
	// test it
	function check(){
		var cs = dojo.getComputedStyle(div);
		var bkImg = cs.backgroundImage; 
		var needsA11y = (cs.borderTopColor==cs.borderRightColor) || (bkImg != null && (bkImg == "none" || bkImg == "url(invalid-url:)" ));
		dojo[needsA11y ? "addClass" : "removeClass"](dojo.body(), "dijit_a11y");
	}
	// TODO: only perform check if on windows!
	if(dojo.isIE){
		check();	// NOTE: checking in Safari messes things up
		setInterval(check, 4000);
	}
});

