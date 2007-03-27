dojo.provide("dijit.form.ResizableTextarea");

dojo.require("dijit.base.FormElement");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dojo.html.layout");
dojo.require("dojo.event.browser");
dojo.require("dojo.html.style");

dojo.declare(
	"dijit.form.ResizableTextarea",
	[dijit.base.FormElement, dijit.base.TemplatedWidget],
{
	// summary
	//	A textarea that resizes vertically to contain the data.
	//	Takes nearly all the parameters (name, value, etc.) that a vanilla textarea takes.
	//	Cols is not supported and the width should be specified with style width.
	//	Rows is not supported since this widget adjusts the height.
	// usage:
	//	<textarea dojoType="dijit.form.ResizableTextArea">...</textarea>

	templateString: (dojo.render.html.ie || dojo.render.html.safari || dojo.render.html.moz) ? '<fieldset id="${this.id}" tabIndex="${this.tabIndex}" class="dojoInputField dojoTextArea">'
				+ ((dojo.render.html.ie || dojo.render.html.safari) ? '<div dojoAttachPoint="editNode" style="text-decoration:none;_padding-bottom:16px;display:block;overflow:auto;" contentEditable="true"></div>' 
					: '<iframe dojoAttachPoint="iframe" src="javascript:void(0)" style="border:0px;margin:0px;padding:0px;display:block;width:100%;height:100%;overflow-x:auto;overflow-y:hidden;"></iframe>')
				+ '<textarea name="${this.name}" value="${this.value}" dojoAttachPoint="formValueNode" style="display:none;"></textarea>'
				+ '</fieldset>'
			: '<textarea id="${this.id}" name="${this.name}" value="${this.value}" dojoAttachPoint="formValueNode" tabIndex="${this.tabIndex}" class="dojoInputField dojoTextArea"></textarea>',

	focus: function(){
		// summary: Received focus, needed for the InlineEditBox widget
		if (!this.disabled){
			this._changing(); // set initial height
			this.focusNode.focus();
		}
	},

	_setFormValue: function(){
		// blah<BR>blah --> blah\nblah
		// <P>blah</P><P>blah</P> --> blah\nblah
		// <DIV>blah</DIV><DIV>blah</DIV> --> blah\nblah
		// &amp;&lt;&nbsp;&gt; --> &< >
		value = this.editNode.innerHTML.replace(/<(br[^>]*|\/(p|div))>$|^<(p|div)[^>]*>|\r/gi,"").replace(/<\/(p|div)>\s*<\1[^>]*>|<(br|p|div)[^>]*>/gi,"\n").replace(/<[^>]*>/g,"").replace(/&amp;/gi,"\&").replace(/&nbsp;/gi," ").replace(/&lt;/gi,"<").replace(/&gt;/gi,">");
		this.formValueNode.value = value;
		if (this.iframe){
			var d = this.iframe.contentWindow.document;
			var newHeight = d.body.firstChild.scrollHeight;
			if (d.body.scrollWidth > d.body.clientWidth){ newHeight+=16; } // scrollbar space needed?
			if (this.lastHeight != newHeight){ // cache size so that we don't get a resize event because of a resize event
				if (newHeight == 0){ newHeight = 16; } // height = 0 causes the browser to not set scrollHeight
				dojo.html.setContentBox(this.iframe, {height: newHeight});
				this.lastHeight = newHeight;
			}
		}
		dijit.form.ResizableTextarea.superclass.setValue.call(this, value);
	},

	setValue: function(/*String*/ value){
		if (this.editNode){
			this.editNode.innerHTML = ""; // wipe out old nodes
			var lines = value.split("\n");
			for (var i=0; i < lines.length; i++){
				this.editNode.appendChild(document.createTextNode(lines[i])); // use text nodes so that imbedded tags can be edited
				this.editNode.appendChild(document.createElement("BR")); // preserve line breaks
			}
		}
		this._setFormValue();
	},

	getValue: function(){
		return this.formValueNode.value;
	},

	postMixInProperties: function(){
		dijit.form.ResizableTextarea.superclass.postMixInProperties.apply(this,arguments);
		// don't let the source text be converted to a DOM structure since we just want raw text
		if (this.srcNodeRef && this.srcNodeRef.innerHTML != ""){
			this.value = this.srcNodeRef.innerHTML;
			this.srcNodeRef.innerHTML = "";
		}
		if ((!this.value || this.value == "") && this.srcNodeRef && this.srcNodeRef.value){
			this.value = this.srcNodeRef.value;
		}
		if (!this.value){ this.value = ""; }
	},

	postCreate: function(){
		var changed = dojo.lang.hitch(this, "_changed");
		var changing = dojo.lang.hitch(this, "_changing");
		if (dojo.render.html.ie || dojo.render.html.safari){
			this.domNode.style.overflowY = 'hidden';
			this.eventNode = this.editNode;
			this.focusNode = this.editNode;
			dojo.event.browser.addListener(this.eventNode, "oncut", changing);
			dojo.event.browser.addListener(this.eventNode, "onpaste", changing);
		}else if (dojo.render.html.moz){
			this.iframe = this.domNode.firstChild;
			var w = this.iframe.contentWindow;
			var d = w.document;
			d.open();
			d.write('<html><body style="margin:0px;padding:0px;border:0px;"><div tabIndex="1" style="padding:2px;"></div></body></html>');
			d.close();
			try { this.iframe.contentDocument.designMode="on"; } catch(e){} // this can fail if display:none
			this.editNode = d.body.firstChild;
			this.domNode.style.overflowY = 'hidden';
			this.eventNode = d;
			this.focusNode = this.editNode;
			this.eventNode.addEventListener("keypress", dojo.lang.hitch(this, "_interceptTab"), false);
			this.eventNode.addEventListener("resize", changed, false);
		}else{
			this.focusNode = this.domNode;
		}
		this.setValue(this.value);
		if (this.eventNode){
			dojo.event.browser.addListener(this.eventNode, "keydown", changing);
			dojo.event.browser.addListener(this.eventNode, "mousemove", changed);
			dojo.event.browser.addListener(this.eventNode, "focus", dojo.lang.hitch(this,"_focused"));
			dojo.event.browser.addListener(this.eventNode, "blur", dojo.lang.hitch(this,"_blurred"));
		}
	},

	// event handlers, you can over-ride these in your own subclasses
	_focused: function(){
		dojo.html.addClass(this.domNode,"dojoInputFieldFocused");
		this._changed();
	},

	_blurred: function(){
		dojo.html.removeClass(this.domNode,"dojoInputFieldFocused");
		this._changed();
	},

	_interceptTab: function(e){
		if (e.keyCode == 9 && !e.shiftKey && !e.ctrlKey && !e.altKey){
			this.iframe.focus();
			e.preventDefault();
		}
	},

	_changing: function(){
		// summary: event handler for when a change is imminent
		dojo.lang.setTimeout(this,"_changed",1);
	},

	_changed: function(){
		// summary: event handler for when a change has already happened
		if (this.iframe && this.iframe.contentDocument.designMode != "on"){
			this.iframe.contentDocument.designMode="on"; // in case this failed on init due to being hidden
		}
		this._setFormValue();
	}
});
