dojo.provide("dijit.form.Slider");

dojo.require("dijit.form._FormWidget");
dojo.require("dojo.dnd.move");
dojo.require("dijit.form.Button");

dojo.declare(
	"dijit.form.HorizontalSlider",
	dijit.form._FormWidget,
{
	// summary
	//	A form widget that allows one to select a value with a horizontally draggable image

	templatePath: dojo.moduleUrl('dijit.form','templates/HorizontalSlider.html'),
	value: 0,

	// showButtons: boolean
	//	Show increment/decrement buttons at the ends of the slider?
	showButtons: true,

	// incrementButtonContents: String
	//	The increment button caption
	incrementButtonContent: "+",

	// decrementButtonContents: String
	//	The decrement button caption
	decrementButtonContent: "-",

	// handleSrc: String
	//	The draggable handle image src value
	handleSrc: dojo.moduleUrl('dijit','themes/tundra/images/preciseSliderThumb.png'),
	
	// minimum:: integer
	//	The minimum value allowed.
	minimum: 0,
	
	// maximum: integer
	//	The maximum allowed value.
	maximum: 100,
	
	// discreteValues: integer
	//	The maximum allowed values dispersed evenly between minimum and maximum (inclusive).
	discreteValues: Infinity,
	
	// pageIncrement: integer
	//	The amount of change with shift+arrow
	pageIncrement: 2,
	
	// clickSelect: boolean
	//	If clicking the progress bar changes the value or not
	clickSelect: true,
	
	_mousePixelCoord: "pageX",
	_pixelCount: "w",
	_startingPixelCoord: "x",
	_startingPixelCount: "l",
	_handleOffsetCoord: "left",
	_progressPixelSize: "width",
	_upsideDown: false,

	 _setDisabled: function(/*Boolean*/ disabled){
		if(this.showButtons){
			this.incrementButton.disabled = disabled;
			this.decrementButton.disabled = disabled;
		}
		dijit.form.HorizontalSlider.superclass._setDisabled.apply(this, arguments); 
	 },

	_onKeyPress: function(/*Event*/ e){
		if(this.disabled || e.altKey || e.ctrlKey){ return; }
		switch(e.keyCode){
			case dojo.keys.HOME:
				this.setValue(this.minimum);
				break;
			case dojo.keys.END:
				this.setValue(this.maximum);
				break;
			case dojo.keys.UP_ARROW:
			case dojo.keys.RIGHT_ARROW:
				this.increment(e);
				break;
			case dojo.keys.DOWN_ARROW:
			case dojo.keys.LEFT_ARROW:
				this.decrement(e);
				break;
			default:
				return;
		}
		dojo.stopEvent(e);
	},

	_onHandleClick: function(e){
		if(this.disabled){ return; }
		this.sliderHandle.focus();
		dojo.stopEvent(e);
	},

	_onBarClick: function(e){
		if(this.disabled || !this.clickSelect){ return; }
		dojo.stopEvent(e);
		var abspos = dojo.coords(this.containerNode, true);
		var pixelValue = e[this._mousePixelCoord] - abspos[this._startingPixelCoord];
		this._setPixelValue(this._upsideDown ? (abspos[this._pixelCount] - pixelValue) : pixelValue, abspos[this._pixelCount]);
	},

	_setPixelValue: function(/*Number*/ pixelValue, /*Number*/ maxPixels){
		pixelValue = pixelValue < 0 ? 0 : maxPixels < pixelValue ? maxPixels : pixelValue;
		var count = this.discreteValues;
		if(count > maxPixels){ count = maxPixels; }
		var pixelsPerValue = maxPixels / count;
		var wholeIncrements = Math.round(pixelValue / pixelsPerValue);
		this.setValue((this.maximum-this.minimum)*wholeIncrements/count + this.minimum);
	},

	setValue: function(/*Number*/ value){
		this.valueNode.value = this.value = value;
		dijit.form.HorizontalSlider.superclass.setValue.call(this, value);
		var percent = (value - this.minimum) / (this.maximum - this.minimum);
		this.progressBar.style[this._progressPixelSize] = (percent*100) + "%";
		this.remainingBar.style[this._progressPixelSize] = ((1-percent)*100) + "%";
	},

	_bumpValue: function(signedChange){
		var s = dojo.getComputedStyle(this.containerNode);
		var c = dojo._getContentBox(this.containerNode, s);
		var count = this.discreteValues;
		if(count > c[this._pixelCount]){ count = c[this._pixelCount]; }
		var value = (this.value - this.minimum) * count / (this.maximum - this.minimum) + signedChange;
		if(value < 0){ value = 0; }
		if(value > count){ value = count; }
		value = value * (this.maximum - this.minimum) / count + this.minimum;
		this.setValue(value);
	},

	decrement: function(e){
		// summary
		//	decrement slider by 1 unit
		this._bumpValue(e.shiftKey?-this.pageIncrement:-1);
	},

	increment: function(e){
		// summary
		//	increment slider by 1 unit
		this._bumpValue(e.shiftKey?this.pageIncrement:1);
	},

	repeatString: function(str,n){
		   var s = "", t = str.toString()
		   while (--n >= 0) s += t
		   return s
	},

	_createButton: function(node, label, fcn){
		var widget = new dijit.form.Button({caption: label, tabIndex:-1, onClick: dojo.hitch(this, fcn)}, node);
		widget.domNode.style.display="";
		return widget;
	},

	_createIncrementButton: function(){
		var w = this._createButton(this.incrementButton, this.incrementButtonContent, "increment");
		this.incrementButton = w.focusNode;
	},

	_createDecrementButton: function(){
		var w = this._createButton(this.decrementButton, this.decrementButtonContent, "decrement");
		this.decrementButton = w.focusNode;
	},

	postCreate: function(){
		if(this.showButtons){
			this._createIncrementButton();
			this._createDecrementButton();
		}
		this.sliderHandle.widget = this;

		new dojo.dnd.Moveable(this.sliderHandle, {mover: dijit.form._slider});
		this.setValue(this.value);
	}
});

dojo.declare(
	"dijit.form.VerticalSlider",
	dijit.form.HorizontalSlider,
{
	// summary
	//	A form widget that allows one to select a value with a vertically draggable image

	templatePath: dojo.moduleUrl('dijit.form','templates/VerticalSlider.html'),
	handleSrc: dojo.moduleUrl('dijit','themes/tundra/images/SliderThumb.png'),
	_mousePixelCoord: "pageY",
	_pixelCount: "h",
	_startingPixelCoord: "y",
	_startingPixelCount: "t",
	_handleOffsetCoord: "top",
	_progressPixelSize: "height",
	_upsideDown: true
});

dojo.declare("dijit.form._slider",
	dojo.dnd.Mover,
{
	onMouseMove: function(e){
		var widget = this.node.widget;
		var c = this.constraintBox;
		if(!c){
			var container = widget.containerNode;
			var s = dojo.getComputedStyle(container);
			var c = dojo._getContentBox(container, s);
			c[widget._startingPixelCount] = 0;
			this.constraintBox = c;
		}
		var m = this.marginBox;
		var pixelValue = m[widget._startingPixelCount] + e[widget._mousePixelCoord];
		dojo.hitch(widget, "_setPixelValue")(widget._upsideDown? (c[widget._pixelCount]-pixelValue) : pixelValue, c[widget._pixelCount]);
	}
});
