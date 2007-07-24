dojo.provide("dijit.ProgressBar");

dojo.require("dojo.fx");
dojo.require("dojo.number");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare(
	"dijit.ProgressBar",
	[dijit._Widget, dijit._Templated],
	null,
	{
		// summary:
		// a progress widget, with some calculation and server polling capabilities
		//
		// description:
		// (implementation) four overlapped divs:
		// (1) lower z-index
		// (4) higher z-index
		// empty and full percent label have the same content: when the vertical line (*)
		// partially hides the emptyLabel, the fullLabel becomes visible
		//
		//  ___________________________(1)_domNode____________________________________
		// |__(3)_internalProgress____________                                        |
		// |                                  | <--- (*)                              |
		// |            (4) fullLabel        | (2) emptyLabel                         |
		// |__________________________________|                                       |
		// |__________________________________________________________________________|
		//
		// usage:
		// <div dojoType="ProgressBar"
		//   duration="..."
		//   places="0"
		//   progress="..." maximum="..."></div>

		// progress: String (Percentage or Number)
		// initial progress value.
		// with "%": percentual value, 0% <= progress <= 100%
		// or without "%": absolute value, 0 <= progress <= maximum
		progress: "0",

		// maximum: Float
		// max sample number
		maximum: 100,

		// places: Number
		// number of places to show in values; 0 by default
		places: 0,

		// indeterminate: Boolean
		// false: show progress
		// true: show that a process is underway but that the progress is unknown
		indeterminate: false,

		templatePath: dojo.moduleUrl("dijit", "templates/ProgressBar.html"),

		_indeterminateHighContrastImagePath:
			dojo.moduleUrl("dijit", "themes/a11y/indeterminate_progress.gif"),

		// public functions
		postCreate: function(){
			dijit.ProgressBar.superclass.postCreate.apply(this, arguments);
			//TODO: can this be accomplished in the template layout?
			// MOW: don't think so because it needs to be set to the absolute size
			//		of the dom node, not the size of the containing element (the full part)
			this.fullLabel.style.width = dojo.getComputedStyle(this.domNode).width;
			if(!this.isLeftToRight()){
				this.fullLabel.style.right = "0px"; // necessary for FF
			}
			this.inteterminateHighContrastImage.setAttribute("src",
				this._indeterminateHighContrastImagePath);
			this.update();
		},

		update: function(/*Object?*/attributes){
			// summary: update progress information
			//
			// attributes: may provide progress and/or maximum properties on this parameter,
			//	see attribute specs for details.
			dojo.mixin(this, attributes||{});
			if(this.indeterminate){
				dojo.addClass(this.domNode, "dijitProgressBarIndeterminate");
				this.internalProgress.style.width = "100%";
				dijit.wai.removeAttr(this.internalProgress, "waiState", "valuenow");
				this._setLabels("");
			}else{
				dojo.removeClass(this.domNode, "dijitProgressBarIndeterminate");
				var percent;
				if(String(this.progress).indexOf("%") != -1){
					percent = Math.min(parseFloat(this.progress)/100, 1);
					this.progress = percent * this.maximum;
				}else{
					this.progress = Math.min(this.progress, this.maximum);
					percent = this.progress / this.maximum;
				}
				this.internalProgress.style.width = (percent * 100) + "%";
				var text = this.report(percent);
				dijit.wai.setAttr(this.internalProgress, "waiState", "valuenow", text);
				this._setLabels(text);
			}
			this.onChange();
		},

		_setLabels: function(/*string*/text){
			dojo.forEach(["full", "empty"], function(name){
				var labelNode = this[name+"Label"];
				if(labelNode.firstChild){
					labelNode.firstChild.nodeValue = text;
				}else{
					labelNode.appendChild(dojo.doc.createTextNode(text));
				}

// move this out of update, or perhaps replace with css or template layout?
				var dim = dojo.contentBox(labelNode);
				var labelBottom = (parseInt(dojo.getComputedStyle(this.domNode).height) - dim.h)/2;
				labelNode.style.bottom = labelBottom + 'px';
			}, this);
		},

		report: function(/*float*/percent){
			// Generates message to show; may be overridden by user
			return dojo.number.format(percent, {type: "percent", places: this.places, locale: this.lang});
		},

		onChange: function(){}
	}
);
