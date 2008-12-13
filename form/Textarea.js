dojo.provide("dijit.form.Textarea");

dojo.require("dijit.form.SimpleTextarea");

dojo.declare(
	"dijit.form.Textarea",
	dijit.form.SimpleTextarea,
	{
	// summary: A resizing textarea widget
	//
	// description:
	//	A textarea that resizes vertically to contain the data.
	//	Takes nearly all the parameters (name, value, etc.) that a vanilla textarea takes.
	//	Rows is not supported since this widget adjusts the height.
	//
	// example:
	// |	<textarea dojoType="dijit.form.TextArea">...</textarea>


	cols: "", // default to width:100% for backward compatibility

	_previousNewlines: 0,
	_strictMode: (dojo.doc.compatMode != 'BackCompat'), // not the same as !dojo.isQuirks

	_getHeight: function(textarea){
		var newH = textarea.scrollHeight;
		if(dojo.isIE){
			if(dojo.isIE >= 8 && this._strictMode){ return -1; } // IE8 beta 2 scrollHeight doesn't change
			newH += textarea.offsetHeight - textarea.clientHeight - ((dojo.isIE < 8 && this._strictMode)? dojo._getPadBorderExtents(textarea).h : 0);
		}else if(dojo.isMoz){
			newH += textarea.offsetHeight - textarea.clientHeight; // creates room for horizontal scrollbar
		}else{
			newH += dojo._getPadBorderExtents(textarea).h;
		}
		return newH;
	},

	_onInput: function(){
		this.inherited(arguments);
		if(this._busyResizing){ return; }
		this._busyResizing = true;
		var textarea = this.domNode;
		textarea.scrollTop = 0;
		var oldH = parseFloat(dojo.getComputedStyle(textarea).height);
		var newH = this._getHeight(textarea);
		if(newH > 0 && textarea.style.height != newH){
			textarea.style.maxHeight = textarea.style.height = newH + "px";
		}
		this._busyResizing = false;
		if(dojo.isMoz || dojo.isWebKit){
			var newlines = (textarea.value.match(/\n/g) || []).length;
			if(newlines < this._previousNewlines){
				this._shrink();
			}
			this._previousNewlines = newlines;
		}
	},

	_busyResizing: false,
	_shrink: function(){
		// grow paddingBottom to see if scrollHeight shrinks (when it is unneccesarily big)
		if((dojo.isMoz || dojo.isWebKit) && !this._busyResizing){
			this._busyResizing = true;
			var textarea = this.domNode;
			var newH = this._getHeight(textarea);
			if(newH > 0){
				var newScrollHeight = textarea.scrollHeight;
				var scrollHeight = -1;
				var oldPadding = dojo.getComputedStyle(textarea).paddingBottom;
				var padding = dojo._getPadExtents(textarea);
				var paddingBottom = padding.h - padding.t;
				textarea.style.maxHeight = newH + "px";
				while(scrollHeight != newScrollHeight){
					scrollHeight = newScrollHeight;
					paddingBottom += 16; // try a big chunk at a time
					textarea.style.paddingBottom = paddingBottom + "px";
					textarea.scrollTop = 0;
					newScrollHeight = textarea.scrollHeight;
					newH -= scrollHeight - newScrollHeight;
				}
				textarea.style.paddingBottom = oldPadding;
				textarea.style.maxHeight = textarea.style.height = newH + "px";
			}
			this._busyResizing = false;
		}
	},

	resize: function(){
		// summary:
		//              Resizes the textarea vertically (should be called after a style/value change)
		this._onInput();
		this._shrink();
	},

	_setValueAttr: function(){
		this.inherited(arguments);
		this.resize();
	},

	postCreate: function(){
		this.inherited(arguments);
		// tweak textarea style to reduce browser differences
		dojo.style(this.domNode, { hhheight: 'auto', overflowY: (dojo.isIE >=8 && this._strictMode)? 'auto' : 'hidden', overflowX: 'auto', boxSizing: 'border-box', MsBoxSizing: 'border-box', WebkitBoxSizing: 'border-box', MozBoxSizing: 'border-box' });
		this.connect(this.domNode, "onscroll", this._onInput);
		this.connect(this.domNode, "onresize", this._onInput);
		setTimeout(dojo.hitch(this, "resize"), 0);
	}
});
