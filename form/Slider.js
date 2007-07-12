dojo.provide("dijit.form.Slider");

dojo.require("dijit.form._FormWidget");
dojo.require("dijit._Container");
dojo.require("dojo.dnd.move");
dojo.require("dijit.form.Button");

dojo.declare(
	"dijit.form.HorizontalSlider",
	[dijit.form._FormWidget, dijit._Container],
{
	// summary
	//	A form widget that allows one to select a value with a horizontally draggable image

	templatePath: dojo.moduleUrl('dijit.form','templates/HorizontalSlider.html'),
	value: 0,

	// showButtons: boolean
	//	Show increment/decrement buttons at the ends of the slider?
	showButtons: true,

	// incrementButtonContents: String
	//	The increment button label
	incrementButtonContent: "+",

	// decrementButtonContents: String
	//	The decrement button label
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

	 setDisabled: function(/*Boolean*/ disabled){
		if(this.showButtons){
			this.incrementButton.disabled = disabled;
			this.decrementButton.disabled = disabled;
		}
		dijit.form.HorizontalSlider.superclass.setDisabled.apply(this, arguments); 
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
		var abspos = dojo.coords(this.sliderBarContainer, true);
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
		var s = dojo.getComputedStyle(this.sliderBarContainer);
		var c = dojo._getContentBox(this.sliderBarContainer, s);
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
		var widget = new dijit.form.Button({label: label, tabIndex:-1, onClick: dojo.hitch(this, fcn)}, node);
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

	startup: function(){
		var _this = this;
		dojo.forEach(this.getChildren(), function(child){
			if(_this[child.container] != _this.containerNode){
				_this[child.container].appendChild(child.domNode);
			}
		});
	},

	_onBlur: function(){
		dijit.form.HorizontalSlider.superclass.setValue.call(this, this.value, true);
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
	handleSrc: dojo.moduleUrl('dijit','themes/tundra/images/sliderThumb.png'),
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
			var container = widget.sliderBarContainer;
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

dojo.declare("dijit.form.HorizontalRule", [dijit._Widget, dijit._Templated],
{
	//	Summary:
	//		Create hash marks for the Horizontal slider
	templateString: '<div class="RuleContainer HorizontalRuleContainer"></div>',

	// count: Integer
	//      Number of hash marks to generate
	count: 3,

	// container: Node
	//      If this is a child widget, connect it to this parent node 
	container: "containerNode",

	// ruleStyle: String
	//      CSS style to apply to individual hash marks
	ruleStyle: "",

	_positionPrefix: '<div class="RuleMark HorizontalRuleMark" style="left:',
	_positionSuffix: '%;',
	_suffix: '"></div>',

	_genHTML: function(pos, ndx){
		return this._positionPrefix + pos + this._positionSuffix + this.ruleStyle + this._suffix;
	},

	postCreate: function(){
		if(this.count==1){
			var innerHTML = this._genHTML(50, 0);
		}else{
			var innerHTML = this._genHTML(0, 0);
			var interval = 100 / (this.count-1);
			for(var i=1; i < this.count-1; i++){
				innerHTML += this._genHTML(interval*i, i);
			}
			innerHTML += this._genHTML(100, this.count-1);
		}
		this.domNode.innerHTML = innerHTML;
	}
});

dojo.declare("dijit.form.VerticalRule", dijit.form.HorizontalRule,
{
	//	Summary:
	//		Create hash marks for the Vertical slider
	templateString: '<div class="RuleContainer VerticalRuleContainer"></div>',
	_positionPrefix: '<div class="RuleMark VerticalRuleMark" style="top:'
});

dojo.declare("dijit.form.HorizontalRuleLabels", dijit.form.HorizontalRule,
{
	//	Summary:
	//		Create labels for the Horizontal slider
	templateString: '<div class="RuleContainer HorizontalRuleContainer"></div>',

	// labelStyle: String
	//      CSS style to apply to individual text labels
	labelStyle: "",

	// labels: Array
	//	Array of text labels to render - evenly spaced from left-to-right or bottom-to-top
	labels: [],

	_positionPrefix: '<div class="RuleLabelContainer HorizontalRuleLabelContainer" style="left:',
	_labelPrefix: '"><span class="RuleLabel HorizontalRuleLabel">',
	_suffix: '</span></div>',

	_calcPosition: function(pos){
		return pos;
	},

	_genHTML: function(pos, ndx){
		return this._positionPrefix + this._calcPosition(pos) + this._positionSuffix + this.labelStyle + this._labelPrefix + this.labels[ndx] + this._suffix;
	},

	postCreate: function(){
		this.count = this.labels.length;
		dijit.form.HorizontalRuleLabels.superclass.postCreate.apply(this);
	}
});

dojo.declare("dijit.form.VerticalRuleLabels", dijit.form.HorizontalRuleLabels,
{
	//	Summary:
	//		Create labels for the Vertical slider
	templateString: '<div class="RuleContainer VerticalRuleContainer"></div>',

	_positionPrefix: '<div class="RuleLabelContainer VerticalRuleLabelContainer" style="top:',
	_labelPrefix: '"><span class="RuleLabel VerticalRuleLabel">',

	_calcPosition: function(pos){
		return 100-pos;
	}
});
