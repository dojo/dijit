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
	if( (dojo.isIE && dojo.isIE < 7) || (dojo.isFF && dojo.isFF < 3 && dojo.hasClass(dojo.body(), "dijit_a11y")) ){
		this.iframe = dojo.doc.createElement("iframe");
		this.iframe.src = 'javascript:""';
		this.iframe.style.position = 'absolute';
		this.iframe.style.left = '0px';
		this.iframe.style.top = '0px';
		this.iframe.style.width = '100%';
		this.iframe.style.height = '100%';
		this.iframe.style.zIndex = -1;
		this.iframe.filter = 'Alpha(Opacity="0")';
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

	size: function(/* HTMLElement */node){
		// summary:
		//		Call this function if the iframe is connected to dojo.body()
		//		rather than the node being shadowed 

		if(!this.iframe){ return; }
		var coords = dojo.coords(node, true);
		dojo.marginBox(this.iframe, coords);
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
