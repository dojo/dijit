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
		//  ________________________(1)_containerNode_________________________________
		// |__(3)_internalProgress____________                                        |
		// |                                  | <--- (*)                              |
		// |     (4) frontLabel        | (2) backLabel                  |
		// |__________________________________|                                       |
		// |__________________________________________________________________________| 
		//
		// usage:
		// <div dojoType="ProgressBar"
		//   duration="..."
		//   places="0" width="..." height="..." dataSource="..."
		//   pollInterval="..." 
		//   numeric="true|false" orientation="vertical" 
		//   progress="..." maximum="..."></div>
	
		// progress: String (Percentage or Number)
		// initial progress value. 
		// with "%": percentual value, 0% <= progress <= 100%
		// or without "%": absolute value, 0 <= progress <= maximum
		progress: "0",

		// maximum: Float
		// max sample number
		maximum: 100,

		// width: Integer
		// ProgressBar width (pixel)
		width: 300,

		// height: Integer
		// ProgressBar height, (pixel)
		height: 30,
		
		// color: String
		// Plain background color; default uses textured pattern
		color: "",

		// numeric: Boolean
		// if true, the percent label is visible
		numeric: false,

		// orientation: String
		// whether bar grows along the x-axis (default) or y- axis (vertical)
		orientation: "",

		// places: Number
		// number of places to show in percent values; 0 by default
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

		_percent: 0.0,
		_animationStopped: true,

		// public functions
		postCreate: function(){
			dijit.ProgressBar.superclass.postCreate.apply(this, arguments);
			if(this.color){
				dojo.html.setStyle(this.internalProgress, "background-color", this.color);
			}else{
				dojo.html.setClass(this.internalProgress, "dojoProgressBarFull");
			}
			dojo.html.setClass(this.containerNode, "dojoProgressBarEmpty");
			if(this.orientation == "vertical"){
				dojo.html.addClass(this.containerNode, "dojoProgressBarVertical");
				this.internalProgress.style.bottom="0px";
				this.internalProgress.style.left="0px";
				this._dimension = "height";
			}else{
				this.internalProgress.style.top="0px";
				this.internalProgress.style.left="0px";
				this._dimension = "width";
			}
			this.domNode.style.height = this.height + "px"; 
			this.domNode.style.width = this.width + "px";
			this.setMaximum(this.maximum, true);
			this.setProgress(this.progress, true);
			this.showLabel(this.numeric);
			this.render();
		},
		showLabel: function(/*Boolean*/visible){
			// summary: shows or hides the labels
			var display = visible ? "block" : "none";
			this.backLabel.style.display=display;
			this.frontLabel.style.display=display;
			this.numeric = visible;
		},
		_setupAnimation: function(){
			var self = this;
			this._animation = dojo.lfx.html.slideTo(this.internalProgress, 
				{top: 0, left: parseInt(this.width)-parseInt(this.internalProgress.style.width)}, parseInt(this.duration), null, 
					function(){
						var _backAnim = dojo.lfx.html.slideTo(self.internalProgress, 
						{ top: 0, left: 0 }, parseInt(self.duration));
						dojo.event.connect(_backAnim, "onEnd", function(){
							if(!self._animationStopped){
								self._animation.play();
							}
							});
						if(!self._animationStopped){
							_backAnim.play();
						}
						_backAnim = null; // <-- to avoid memory leaks in IE
					}
				);
		},
		setMaximum: function(/*Number*/maximum, /*Boolean?*/noRender){
			// summary: sets the maximum
			// if noRender is true, only sets the internal max progress value
			if(!this._animationStopped){
				return;
			}
			this.maximum = maximum;
			this.setProgress(this.progress, true);
			if(!noRender){
				this.render();
			}
		},
		setProgress: function(/*String|Number*/value, /*Boolean?*/noRender){
			// summary: sets the progress
			// if value ends width "%", does a normalization
			// if noRender is true, only sets the internal value: useful if
			// there is a setMaximum call
			if(!this._animationStopped){
				return;
			}
			if(String(value).indexOf("%") != -1){
				this._percent = Math.min(parseFloat(value)/100, 1);
				this.progress = this._percent * this.maximum;
			}else{
				this.progress = Math.min(value, this.maximum);
				this._percent = value / this.maximum;
			}
			if(!noRender){
				this.render();
			}
		},
		start: function(){
			// summary: starts the server polling
			var _showFunction = dojo.lang.hitch(this, this._showRemoteProgress);
			this._timer = setInterval(_showFunction, this.pollInterval);
		},
		startAnimation: function(){
			// summary: starts the left-right animation, useful when
			// the user doesn't know how much time the operation will last
			if(this._animationStopped){
				this._backup = {progress: this.progress, numeric: this.numeric};
				this.setProgress("10%");
				this._animationStopped = false;
				this._setupAnimation();
				this.showLabel(false);
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
				this.setProgress(this.progress);
				this.showLabel(this.numeric);
				this._positionLabels();
			}
		},
		_showRemoteProgress: function(){
			var self = this;
			if((this.maximum == this.progress) && this._timer){
				clearInterval(this._timer);
				this._timer = null;
				this.setProgress("100%");
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
					self.setProgress(self._timer ? data.progress : "100%");
				}
			};
			dojo.io.bind(bArgs);
		},

		render: function(){
			// summary: renders the ProgressBar, based on current values

			this._updateLabels(this._percent);

			var pixels = this._percent * this[this._dimension];
			this.internalProgress.style[this._dimension] = pixels + 'px';
			this.onChange();

			this._positionLabels();
		},

		_positionLabels: function(){
			dojo.lang.forEach(["front", "back"], function(name){
				var labelNode = this[name+"Label"];
				var dim = dojo.html.getContentBox(labelNode);
				var labelLeft = (this.width - dim.width)/2;
				var labelBottom = (this.height - dim.height)/2;
				labelNode.style.left = labelLeft + "px";
				labelNode.style.bottom = labelBottom + "px";
			}, this);
		},
		_updateLabels: function(/*float*/percent){
			dojo.lang.forEach(["front", "back"], function(name){
				var labelNode = this[name+"Label"];
				dojo.dom.textContent(labelNode, dojo.number.format(percent, {type: "percent", places: this.places}));
			}, this);
		},
		onChange: function(){
		}
	}
);
