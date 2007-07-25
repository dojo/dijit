dojo.provide("dijit.form.Textarea");

dojo.require("dijit.form._FormWidget");
dojo.require("dojo.i18n");
dojo.requireLocalization("dijit.form", "Textarea");

dojo.declare(
	"dijit.form.Textarea",
	dijit.form._FormWidget,
{
	// summary
	//	A textarea that resizes vertically to contain the data.
	//	Takes nearly all the parameters (name, value, etc.) that a vanilla textarea takes.
	//	Cols is not supported and the width should be specified with style width.
	//	Rows is not supported since this widget adjusts the height.
	// usage:
	//	<textarea dojoType="dijit.form.TextArea">...</textarea>

	templateString: (dojo.isIE || dojo.isSafari || dojo.isMozilla) ? '<fieldset id="${id}" class="dijitInlineBox dijitInputField dijitTextArea">'
				+ ((dojo.isIE || dojo.isSafari) ? '<div dojoAttachPoint="editNode" waiRole="textarea" tabIndex="${tabIndex}" style="text-decoration:none;_padding-bottom:16px;display:block;overflow:auto;" contentEditable="true"></div>'
					: '<iframe dojoAttachPoint="iframe" src="javascript:void(0)" style="border:0px;margin:0px;padding:0px;display:block;width:100%;height:100%;overflow-x:auto;overflow-y:hidden;"></iframe>')
				+ '<textarea name="${name}" value="${value}" dojoAttachPoint="formValueNode" style="display:none;"></textarea>'
				+ '</fieldset>'
			: '<textarea id="${id}" name="${name}" value="${value}" dojoAttachPoint="formValueNode,editNode" class="dijitInputField dijitTextArea"></textarea>',

	focus: function(){
		// summary: Received focus, needed for the InlineEditBox widget
		if(!this.disabled){
			this._changing(); // set initial height
		}
		if(dojo.isMozilla){
			dijit.focus(this.iframe);
		}else{
			dijit.focus(this.focusNode);
		}
	},

	_setFormValue: function(/*Boolean, optional*/ priorityChange){
		// blah<BR>blah --> blah\nblah
		// <P>blah</P><P>blah</P> --> blah\nblah
		// <DIV>blah</DIV><DIV>blah</DIV> --> blah\nblah
		// &amp;&lt;&nbsp;&gt; --> &< >
		value = this.editNode.innerHTML.replace(/<(br[^>]*|\/(p|div))>$|^<(p|div)[^>]*>|\r/gi,"").replace(/<\/(p|div)>\s*<\1[^>]*>|<(br|p|div)[^>]*>/gi,"\n").replace(/<[^>]*>/g,"").replace(/&amp;/gi,"\&").replace(/&nbsp;/gi," ").replace(/&lt;/gi,"<").replace(/&gt;/gi,">");
		this.formValueNode.value = value;
		if(this.iframe){
			var d = this.iframe.contentWindow.document;
			var newHeight = d.body.firstChild.scrollHeight;
			if(d.body.scrollWidth > d.body.clientWidth){ newHeight+=16; } // scrollbar space needed?
			if(this.lastHeight != newHeight){ // cache size so that we don't get a resize event because of a resize event
				if(newHeight == 0){ newHeight = 16; } // height = 0 causes the browser to not set scrollHeight
				dojo.contentBox(this.iframe, {h: newHeight});
				this.lastHeight = newHeight;
			}
		}
		dijit.form.Textarea.superclass.setValue.call(this, value, priorityChange);
	},

	setValue: function(/*String*/ value, /*Boolean, optional*/ priorityChange){
		var node = this.editNode;
		if(node){
			node.innerHTML = ""; // wipe out old nodes
			dojo.forEach(value.split("\n"), function(line){
				node.appendChild(document.createTextNode(line)); // use text nodes so that imbedded tags can be edited
				node.appendChild(document.createElement("BR")); // preserve line breaks
			});
		}
		this._setFormValue(priorityChange);
	},

	getValue: function(){
		return this.formValueNode.value;
	},

	postMixInProperties: function(){
		dijit.form.Textarea.superclass.postMixInProperties.apply(this,arguments);
		// don't let the source text be converted to a DOM structure since we just want raw text
		if(this.srcNodeRef && this.srcNodeRef.innerHTML != ""){
			this.value = this.srcNodeRef.innerHTML;
			this.srcNodeRef.innerHTML = "";
		}
		if((!this.value || this.value == "") && this.srcNodeRef && this.srcNodeRef.value){
			this.value = this.srcNodeRef.value;
		}
		if(!this.value){ this.value = ""; }
	},

	postCreate: function(){
		if(dojo.isIE || dojo.isSafari){
			this.domNode.style.overflowY = 'hidden';
			this.eventNode = this.focusNode = this.editNode;
			this.connect(this.eventNode, "oncut", this._changing);
			this.connect(this.eventNode, "onpaste", this._changing);
		}else if(dojo.isMozilla){
			var w = this.iframe.contentWindow;
			var d = w.document;
			// In the case of Firefox an iframe is used and when the text gets focus,
			// focus is fired from the document object.  There isn't a way to put a
			// waiRole on the document object and as a result screen readers don't
			// announce the role.  As a result screen reader users are lost.
			//
			// An additional problem is that the browser gives the document object a
			// very cryptic accessible name, e.g.
			// wyciwyg://13/http://archive.dojotoolkit.org/nightly/dojotoolkit/dijit/tests/form/test_InlineEditBox.html
			// When focus is fired from the document object, the screen reader speaks
			// the accessible name.  The cyptic accessile name is confusing.
			//
			// A workaround for both of these problems is to give the iframe's
			// document a title, the name of which is similar to a role name, i.e.
			// "edit box".  This will be used as the accessible name which will replace
			// the cryptic name and will also convey the role information to the user.
			// Because it is read directly to the user, the string must be localized.
			var resources = dojo.i18n.getLocalization("dijit.form", "Textarea");
			d.open();
			d.write('<html><head><title>' +
				resources.iframeTitle +
				'</title></head><body style="margin:0px;padding:0px;border:0px;"><div tabIndex="1" style="padding:2px;"></div></body></html>');
			d.close();
			try{ this.iframe.contentDocument.designMode="on"; }catch(e){/*squelch*/} // this can fail if display:none
			this.editNode = d.body.firstChild;
			this.domNode.style.overflowY = 'hidden';
			this.eventNode = d;
			this.focusNode = this.editNode;
			this.eventNode.addEventListener("resize", dojo.hitch(this, "_changed"), false);
		}else{
			this.focusNode = this.domNode;
		}
		if(this.eventNode){
			this.connect(this.eventNode, "keypress", this._onKeyPress);
			this.connect(this.eventNode, "mousemove", this._changed);
			this.connect(this.eventNode, "focus", this._focused);
			this.connect(this.eventNode, "blur", this._blurred);
		}
		this.inherited('postCreate', arguments);
	},

	// event handlers, you can over-ride these in your own subclasses
	_focused: function(e){
		dojo.addClass(this.domNode, "dijitInputFieldFocused");
		this._changed(e);
	},

	_blurred: function(e){
		dojo.removeClass(this.domNode, "dijitInputFieldFocused");
		this._changed(e, true);
	},

	_onKeyPress: function(e){
		if(e.keyCode == 9 && !e.shiftKey && !e.ctrlKey && !e.altKey && this.iframe){
			// Place focus on the iframe. A subsequent tab or shift tab will put focus
			// on the correct control.  (Having to tab twice is a low priority bug.)
			this.focus();
			e.preventDefault();
		}else{
			this.inherited("_onKeyPress", arguments);
		}
		this._changing();
	},

	_changing: function(e){
		// summary: event handler for when a change is imminent
		setTimeout(dojo.hitch(this, "_changed", e, false),1);
	},

	_changed: function(e, priorityChange){
		// summary: event handler for when a change has already happened
		if(this.iframe && this.iframe.contentDocument.designMode != "on"){
			this.iframe.contentDocument.designMode="on"; // in case this failed on init due to being hidden
		}
		this._setFormValue(priorityChange);
	},

	resize:function(/*Object*/ contentBox){
		// summary: set content box size
		dojo.contentBox(this.iframe || this.focusNode, {w:contentBox.w});
	}
});
