dojo.provide("dijit.util.BackgroundIframe");

dijit.util.BackgroundIframe = function(/* HTMLElement */node){
	//	summary:
	//		For IE z-index schenanigans
	//		new dijit.util.BackgroundIframe(node)
	//			Makes a background iframe as a child of node, that fills
	//			area (and position) of node
	if(true || (dojo.isIE && dojo.isIE < 7) || (dojo.isFF && dojo.isFF < 3 && dojo.hasClass(dojo.body(), "dijit_a11y")) ){
		var iframe;
		if(dojo.isIE){
			var html="<iframe src='javascript:\"\"'"
				+ " style='position: absolute; left: 0px; top: 0px;"
				+ " width: expression(document.getElementById(\"" + node.id + "\").offsetWidth);"
				+ " height: expression(document.getElementById(\"" + node.id + "\").offsetHeight); "
				+ "z-index: -1; filter:Alpha(Opacity=\"0\");'>";
			iframe = dojo.doc.createElement(html);
		}else{
		 	iframe = dojo.doc.createElement("iframe");
			iframe.src = 'javascript:""';
			iframe.className = "dijitBackgroundIframe";
		}
		iframe.tabIndex = -1; // Magic to prevent iframe from getting focus on tab keypress - as style didnt work.
		node.appendChild(iframe);
		this.iframe = iframe;
	}
};

dojo.extend(dijit.util.BackgroundIframe, {
	remove: function(){
		//	summary: remove the iframe
		if(this.iframe){
			this.iframe.parentNode.removeChild(this.iframe); // PORT: leak?
			delete this.iframe;
			this.iframe=null;
		}
	}
});
