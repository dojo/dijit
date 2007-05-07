dojo.provide("dijit.util.BackgroundIframe");

dijit.util.BackgroundIframe = function(/* HTMLElement */node){
	//	summary:
	//		For IE z-index schenanigans
	//		Two possible uses:
	//			1. new dijit.util.BackgroundIframe(node)
	//				Makes a background iframe as a child of node, that fills
	//				area (and position) of node
	//			2. new dijit.util.BackgroundIframe()
	//				Attaches frame to dojo.body().  User must call size() to
	//				set size.
	if(dojo.isIE && dojo.isIE < 7){
		var html="<iframe src='javascript:false'"
			+ " style='position: absolute; left: 0px; top: 0px; width: 100%; height: 100%;"
			+ "z-index: -1; filter:Alpha(Opacity=\"0\");'>";
		this.iframe = dojo.doc.createElement(html);
		this.iframe.tabIndex = -1; // Magic to prevent iframe from getting focus on tab keypress - as style didnt work.
		if(node){
			node.appendChild(this.iframe);
			this.domNode=node;
		}else{
			dojo.body().appendChild(this.iframe);
			this.iframe.style.display="none";
		}
	}
};

dojo.extend(dijit.util.BackgroundIframe, {
	iframe: null,
	onResized: function(){
		//	summary:
		//		Resize event handler.

		// TODO: this function shouldn't be necessary but setting
		// 			width=height=100% doesn't work!
		if(this.iframe && this.domNode && this.domNode.parentNode){ 
			// No parentElement if onResized() timeout event occurs on a removed domnode
			var outer = dojo.marginBox(this.domNode);
			if (!outer.w || !outer.h){
				setTimeout(this, this.onResized, 100);
				return;
			}
			this.iframe.style.width = outer.w + "px";
			this.iframe.style.height = outer.h + "px";
		}
	},

	size: function(/* HTMLElement */node){
		// summary:
		//		Call this function if the iframe is connected to dojo.body()
		//		rather than the node being shadowed 

		//	(TODO: erase)
		if(!this.iframe){ return; }
		var coords = dojo.coords(node, true); // PORT used BORDER_BOX
		var s = this.iframe.style;
		s.width = coords.w + "px";
		s.height = coords.h + "px";
		s.left = coords.x + "px";
		s.top = coords.y + "px";
	},

	setZIndex: function(/* HTMLElement|int */node){
		//	summary:
		//		Sets the z-index of the background iframe
		//	node:
		//		If an element, sets zIndex of iframe to zIndex of node minus one. 
		//		Otherwise, specifies the new zIndex as an integer.

		if(!this.iframe){ return; }

		this.iframe.style.zIndex = !isNaN(node) ? node : (node.style.zIndex - 1);
	},

	show: function(){
		//	summary:
		//		show the iframe
		if(this.iframe){ 
			this.iframe.style.display = "block";
		}
	},

	hide: function(){
		//	summary:
		//		hide the iframe
		if(this.iframe){ 
			this.iframe.style.display = "none";
		}
	},

	remove: function(){
		//	summary:
		//		remove the iframe
		if(this.iframe){
			this.iframe.parentNode.removeChild(this.iframe); // PORT: leak?
			delete this.iframe;
			this.iframe=null;
		}
	}
});
