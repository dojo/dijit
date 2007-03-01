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
		// partially hides the backPercentLabel, the frontPercentLabel becomes visible
		// 
		//  ________________________(1)_containerNode_________________________________
		// |__(3)_internalProgress____________                                        |
		// |                                  | <--- (*)                              |
		// |     (4) frontPercentLabel        | (2) backPercentLabel                  |
		// |__________________________________|                                       |
		// |__________________________________________________________________________| 
		//
		// usage:
		// <div dojoType="ProgressBar"
		//   duration="..."
		//   places="0" width="..." height="..." dataSource="..."
		//   pollInterval="..." 
		//   hasText="true|false" isVertical="true|false" 
		//   progress="..." maximum="..."></div>
	
		// progress: String
		// initial progress value. 
		// with "%": percentual value, 0% <= progress <= 100%
		// or without "%": absolute value, 0 <= progress <= maximum
		progress: 0,
		
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

		// hasText: Boolean
		// if true, the percent label is visible
		hasText: false,

		// isVertical: Boolean
		// if true, the widget is vertical
		isVertical: false,

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
			if(this.isVertical){
				dojo.html.addClass(this.containerNode, "dojoProgressBarVertical");
				this.internalProgress.style.bottom="0px";
				this.internalProgress.style.left="0px";
				this._dimension = "height";
			}else{
				this.internalProgress.style.top="0px";
				this.internalProgress.style.left="0px";
				this._dimension = "width";
			}
			dojo.html.setClass(this.frontPercentLabel, "dojoProgressBarFrontPercent");
			dojo.html.setClass(this.backPercentLabel, "dojoProgressBarBackPercent");
			this.domNode.style.height = this.height + "px"; 
			this.domNode.style.width = this.width + "px";
			this.setMaximum(this.maximum, true);
			this.setProgress(this.progress, true);
			this.showText(this.hasText);

			this.render();
		},
		showText: function(/*Boolean*/visible){
			// summary: shows or hides the labels
			var display = visible ? "block" : "none";
			this.backPercentLabel.style.display=display;
			this.frontPercentLabel.style.display=display;
			this.hasText = visible;
		},
		_setupAnimation: function(){
			var _self = this;
			this._animation = dojo.lfx.html.slideTo(this.internalProgress, 
				{top: 0, left: parseInt(this.width)-parseInt(this.internalProgress.style.width)}, parseInt(this.duration), null, 
					function(){
						var _backAnim = dojo.lfx.html.slideTo(_self.internalProgress, 
						{ top: 0, left: 0 }, parseInt(_self.duration));
						dojo.event.connect(_backAnim, "onEnd", function(){
							if(!_self._animationStopped){
								_self._animation.play();
							}
							});
						if(!_self._animationStopped){
							_backAnim.play();
						}
						_backAnim = null; // <-- to avoid memory leaks in IE
					}
				);
		},
		setMaximum: function(maxValue, noRender){
			// summary: sets the maximum
			// if noRender is true, only sets the internal max progress value
			if(!this._animationStopped){
				return;
			}
			this.maximum = maxValue;
			this.setProgress(this.progress, true);
			if(!noRender){
				this.render();
			}
		},
		setProgress: function(/*String|Number*/value, /*Boolean*/noRender){
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
				this._backup = {progress: this.progress, hasText: this.hasText};
				this.setProgress("10%");
				this._animationStopped = false;
				this._setupAnimation();
				this.showText(false);
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
				this.showText(this.hasText);
				this._positionPercentLabels();
			}
		},
		_showRemoteProgress: function(){
			var _self = this;
			if((this.maximum == this.progress) &&
				this._timer){
				clearInterval(this._timer);
				this._timer = null;
				this.setProgress("100%");
				return;	
			}
			var bArgs = {
				url: _self.dataSource,
				method: "POST",
				mimetype: "text/json",
				error: function(type, errorObj){
					dojo.debug("ProgressBar: showRemoteProgress error");
				},
				load: function(type, data, evt){
					_self.setProgress(_self._timer ? data.progress : "100%");
				}
			};
			dojo.io.bind(bArgs);
		},

		render: function(){
			// summary: renders the ProgressBar, based on current values

			this._updatePercentLabels(this._percent);

			var pixels = this._percent * this[this._dimension];
			this.internalProgress.style[this._dimension] = pixels + 'px';
			this.onChange();

			this._positionPercentLabels();
		},

		_positionPercentLabels: function(){
			var front = dojo.html.getContentBox(this.frontPercentLabel);
			var frontLeft = (this.width - front.width)/2;
			var frontBottom = (this.height - front.height)/2;
			this.frontPercentLabel.style.left = frontLeft + "px";
			this.frontPercentLabel.style.bottom = frontBottom + "px";
			var back = dojo.html.getContentBox(this.backPercentLabel);
			var backLeft = (this.width - back.width)/2;
			var backBottom = (this.height - back.height)/2;
			this.backPercentLabel.style.left = backLeft + "px";
			this.backPercentLabel.style.bottom = backBottom + "px"; 
		},
		_updatePercentLabels: function(/*float*/percentValue){
			dojo.lang.forEach(["front", "back"], function(name){
				var labelNode = this[name+"PercentLabel"];
				dojo.dom.textContent(labelNode, dojo.number.format(percentValue, {type: "percent", places: this.places}));
			}, this);
		},
		onChange: function(){
		}
	}
);
