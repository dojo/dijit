dojo.provide("dijit.ProgressBar");

dojo.require("dojo.event.common");
dojo.require("dojo.dom");
dojo.require("dojo.html.style");
dojo.require("dojo.lfx.html");
dojo.require("dojo.number");

dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");

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
		// back and front percent label have the same content: when the vertical line (*)
		// partially hides the backLabel, the frontLabel becomes visible
		// 
		//  ___________________________(1)_domNode____________________________________
		// |__(3)_internalProgress____________                                        |
		// |                                  | <--- (*)                              |
		// |     (4) frontLabel        | (2) backLabel                  |
		// |__________________________________|                                       |
		// |__________________________________________________________________________| 
		//
		// usage:
		// <div dojoType="ProgressBar"
		//   duration="..."
		//   places="0" dataSource="..."
		//   pollInterval="..." 
		//   annotate="true|false" orientation="vertical" 
		//   progress="..." maximum="..."></div>
	
		// progress: String (Percentage or Number)
		// initial progress value. 
		// with "%": percentual value, 0% <= progress <= 100%
		// or without "%": absolute value, 0 <= progress <= maximum
		progress: "0",

		// maximum: Float
		// max sample number
		maximum: 100,

		// color: String
		// Plain background color; default uses textured pattern
		//TODO: use CSS instead?
		color: "",

		// orientation: String
		// whether bar grows along the x-axis (default) or y- axis (vertical)
		orientation: "",

		// annotate: Boolean
		// if true, the percent label is visible
		annotate: false,

		// places: Number
		// number of places to show in values; 0 by default
		places: 0,

		// dataSource: String
		// dataSource uri for server polling
		dataSource: "",
		
		// pollInterval: Integer
		// server poll interval
		pollInterval: 3000,
		
		// duration: Integer
		// duration of the animation
		duration: 1000,

		templatePath: dojo.uri.moduleUri("dijit", "templates/ProgressBar.html"),		

		// public functions
		postCreate: function(){
			dijit.ProgressBar.superclass.postCreate.apply(this, arguments);
			if(this.color){
				dojo.html.setStyle(this.internalProgress, "background-color", this.color);
			}else{
				dojo.html.addClass(this.internalProgress, "dojoProgressBarTile");
			}
			if(this.orientation == "vertical"){
				dojo.html.addClass(this.domNode, "dojoProgressBarVertical");
				this._dimension = "height";
			}else{
				this._dimension = "width";
			}
			this.update();
		},

		update: function(/*Object?*/attributes){
			// summary: update progress information
			//
			// attributes: may provide progress and/or maximum properties on this parameter,
			//	see attribute specs for details.
			dojo.lang.mixin(this, attributes||{});
			var percent;
			if(String(this.progress).indexOf("%") != -1){
				percent = Math.min(parseFloat(this.progress)/100, 1);
				this.progress = percent * this.maximum;
			}else{
				this.progress = Math.min(this.progress, this.maximum);
				percent = this.progress / this.maximum;
			}

			if(!this._animationStopped){return;}

			var pixels = percent * dojo.html.getPixelValue(this.domNode, this._dimension);
			dojo.html.setPositivePixelValue(this.internalProgress, this._dimension, pixels);

			var display = this.annotate ? "block" : "none";
			dojo.lang.forEach(["front", "back"], function(name){
				var labelNode = this[name+"Label"];
				dojo.dom.textContent(labelNode, this.report(percent));

				labelNode.style.display = display;

				var dim = dojo.html.getContentBox(labelNode);
				var labelLeft = (dojo.html.getPixelValue(this.domNode,"width") - dim.width)/2;
				var labelBottom = (dojo.html.getPixelValue(this.domNode,"height") - dim.height)/2;
				dojo.html.setPositivePixelValue(labelNode, "left", labelLeft);
				dojo.html.setPositivePixelValue(labelNode, "bottom", labelBottom);
			}, this);

			this.onChange();
		},

		report: function(/*float*/percent){
			// Generates percentage to overlay; may be overridden by user
			return dojo.number.format(percent, {type: "percent", places: this.places});
		},

		_animationStopped: true,

		_setupAnimation: function(){
			var self = this;
			this._animation = dojo.lfx.html.slideTo(this.internalProgress,
				{top: 0, left: dojo.html.getPixelValue(this.domNode,"width")-dojo.html.getPixelValue(this.internalProgress,"width")},
				this.duration, null, 
				function(){
					var backAnim = dojo.lfx.html.slideTo(self.internalProgress, {top: 0, left: 0}, self.duration);
					dojo.event.connect(backAnim, "onEnd", function(){
						if(!self._animationStopped){
							self._animation.play();
						}
					});
					if(!self._animationStopped){
						backAnim.play();
					}
					backAnim = null; // <-- to avoid memory leaks in IE
				});
		},

		startAnimation: function(){
			// summary: starts the left-right animation, useful when
			// the user doesn't know how much time the operation will last
			if(this._animationStopped){
				this._backup = {progress: this.progress, annotate: this.annotate};
				this.update({progress: "10%", annotate: false});
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
				dojo.lang.mixin(this, this._backup);
				this.update();
			}
		},

		start: function(){
			// summary: starts the server polling
			var _showFunction = dojo.lang.hitch(this, this._showRemoteProgress);
			this._timer = setInterval(_showFunction, this.pollInterval);
		},

		_showRemoteProgress: function(){
			var self = this;
			if((this.maximum == this.progress) && this._timer){
				clearInterval(this._timer);
				this._timer = null;
				this.update({progress: "100%"});
				return;	
			}
			var bArgs = {
				url: self.dataSource,
				method: "POST",
				mimetype: "text/json",
				error: function(type, errorObj){
					dojo.debug("ProgressBar: showRemoteProgress error");
				},
				load: function(type, data, evt){
					self.update({progress: self._timer ? data.progress : "100%"});
				}
			};
			dojo.io.bind(bArgs);
		},

		onChange: function(){
		}
	}
);
