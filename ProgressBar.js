dojo.provide("dijit.ProgressBar");

dojo.require("dojo.fx");
dojo.require("dojo.number");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.util.sniff");

dojo.declare(
	"dijit.ProgressBar",
	[dijit.base.Widget, dijit.base.TemplatedWidget],
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
		//   orientation="vertical"
		//   progress="..." maximum="..."></div>
	
		// progress: String (Percentage or Number)
		// initial progress value.
		// with "%": percentual value, 0% <= progress <= 100%
		// or without "%": absolute value, 0 <= progress <= maximum
		progress: "0",

		// maximum: Float
		// max sample number
		maximum: 100,

		// orientation: String
		// whether bar grows along the x-axis (default) or y- axis (vertical)
		orientation: "",

		// places: Number
		// number of places to show in values; 0 by default
		places: 0,

		// duration: Integer
		// duration of the animation
		duration: 1000,

		templatePath: dojo.moduleUrl("dijit", "templates/ProgressBar.html"),		

		// public functions
		postCreate: function(){
			dijit.ProgressBar.superclass.postCreate.apply(this, arguments);
			if(this.orientation == "vertical"){
//TODO: if !this.domNode.className?
				this.domNode.className += " "+"dijitProgressBarVertical";
				this._dimension = "height";
			}else{
				this._dimension = "width";
			}
			//TODO: can this be accomplished in the template layout?
			// MOW: don't think so because it needs to be set to the absolute size
			//		of the dom node, not the size of the containing element (the full part)
			this.fullLabel.style.width = dojo.getComputedStyle(this.domNode).width;
			this.update();
		},

		update: function(/*Object?*/attributes){
			// summary: update progress information
			//
			// attributes: may provide progress and/or maximum properties on this parameter,
			//	see attribute specs for details.
			dojo.mixin(this, attributes||{});
			var percent;
			if(String(this.progress).indexOf("%") != -1){
				percent = Math.min(parseFloat(this.progress)/100, 1);
				this.progress = percent * this.maximum;
			}else{
				this.progress = Math.min(this.progress, this.maximum);
				percent = this.progress / this.maximum;
			}

			if(!this._animationStopped){return;}

			var text = this.report(percent);
			this._setWaiValueNow(text);
			this.internalProgress.style[this._dimension] = (percent * 100) + "%";

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

			this.onChange();
		},

		report: function(/*float*/percent){
			// Generates message to show; may be overridden by user
			return dojo.number.format(percent, {type: "percent", places: this.places, locale: this.lang});
		},

		_animationStopped: true,

		_setupAnimation: function(){
			var self = this;
			this._animation = dojo.fx.slideTo({node: this.internalProgress,
				top: 0,
				left: parseInt(dojo.getComputedStyle(this.domNode).width)-parseInt(dojo.getComputedStyle(this.internalProgress).width),
				duration: this.duration});
			dojo.connect(this._animation, "onEnd", null, function(){
				var backAnim = dojo.fx.slideTo({node: self.internalProgress, top: 0, left: 0, duration: self.duration});
				dojo.connect(backAnim, "onEnd", null, function(){
					if(!self._animationStopped){
						self._animation.play();
					}
				});
				if(!self._animationStopped){
					backAnim.play();
				}
				backAnim = null; // to avoid memory leaks in IE
			});
		},

		startAnimation: function(){
			// summary: starts the left-right animation, useful when
			// the user doesn't know how much time the operation will last
			if(this._animationStopped){
				this._backup = {progress: this.progress};
				this.update({progress: "10%"});
				this._setWaiValueNow("unknown");
				this._animationStopped = false;
				this._setupAnimation();
				this.internalProgress.style.height="105%";
				this._animation.play();
			}
		},
		stopAnimation: function(){
			// summary: stops the left-right animation
			if(this._animation){
				this._animationStopped = true;
				this._animation.stop();
				this.internalProgress.style.height="100%";
				this.internalProgress.style.left = "0px";
				dojo.mixin(this, this._backup);
				this.update();
			}
		},

		_setWaiValueNow: function(value){
			dijit.util.wai.setAttr(this.internalProgress, "waiState", "valuenow", value);
		},

		onChange: function(){}
	}
);
