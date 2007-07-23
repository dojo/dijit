dojo.provide("dijit.ColorPalette");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare(
		"dijit.ColorPalette",
		[dijit._Widget, dijit._Templated],
{
	// summary
	//		Grid showing various colors, so the user can pick a certain color

	// defaultTimeout: Number
	//      number of milliseconds before a held key or button becomes typematic
	defaultTimeout: 500,

	// timeoutChangeRate: Number
	//      fraction of time used to change the typematic timer between events
	//      1.0 means that each typematic event fires at defaultTimeout intervals
	//      < 1.0 means that each typematic event fires at an increasing faster rate
	timeoutChangeRate: 0.90,

	// palette: String
	//		Size of grid, either "7x10" or "3x4".
	palette: "7x10",

	//_value: String
	//		The value of the selected color.
	value: null,

	//_currentFocus: Integer
	//		Index of the currently focused color.
	_currentFocus: 0,

	// _xDim: Integer
	//		This is the number of colors horizontally across.
	_xDim: null,

	// _yDim: Integer
	///		This is the number of colors vertically down.
	_yDim: null,

	// _palettes: Map
	// 		This represents the value of the colors.
	//		The first level is a hashmap of the different arrays available
	//		The next two dimensions represent the columns and rows of colors.
	_palettes: {
		"7x10": [["fff", "fcc", "fc9", "ff9", "ffc", "9f9", "9ff", "cff", "ccf", "fcf"],
			["ccc", "f66", "f96", "ff6", "ff3", "6f9", "3ff", "6ff", "99f", "f9f"],
			["c0c0c0", "f00", "f90", "fc6", "ff0", "3f3", "6cc", "3cf", "66c", "c6c"],
			["999", "c00", "f60", "fc3", "fc0", "3c0", "0cc", "36f", "63f", "c3c"],
			["666", "900", "c60", "c93", "990", "090", "399", "33f", "60c", "939"],
			["333", "600", "930", "963", "660", "060", "366", "009", "339", "636"],
			["000", "300", "630", "633", "330", "030", "033", "006", "309", "303"]],

		"3x4": [["ffffff"/*white*/, "00ff00"/*lime*/, "008000"/*green*/, "0000ff"/*blue*/],
			["c0c0c0"/*silver*/, "ffff00"/*yellow*/, "ff00ff"/*fuchsia*/, "000080"/*navy*/],
			["808080"/*gray*/, "ff0000"/*red*/, "800080"/*purple*/, "000000"/*black*/]]
			//["00ffff"/*aqua*/, "808000"/*olive*/, "800000"/*maroon*/, "008080"/*teal*/]];
	},

	// _imagePaths: Map
	//		This is stores the path to the palette images
	_imagePaths: {
		"7x10": dojo.moduleUrl("dijit", "templates/colors7x10.png"),
		"3x4": dojo.moduleUrl("dijit", "templates/colors3x4.png")
	},

	// _paletteCoords: Map
	//		This is a map that is used to calculate the coordinates of the
	//		images that make up the palette.
	_paletteCoords: {
		"leftOffset": 3, "topOffset": 3,
		"cWidth": 18, "cHeight": 16
	},

	// templatePath: String
	//		Path to the template of this widget.
	templatePath: dojo.moduleUrl("dijit", "templates/ColorPalette.html"),


	_paletteDims: {
		"7x10": {"width": "185px", "height": "117px"},
		"3x4": {"width": "77px", "height": "53px"}
	},


	postCreate: function(){
		// A name has to be given to the colorMap, this needs to be unique per Palette.
		dojo.mixin(this.divNode.style, this._paletteDims[this.palette]);
		this.imageNode.setAttribute("src", this._imagePaths[this.palette]);
		var choices = this._palettes[this.palette];	
		this.domNode.style.position = "relative";
		this._highlightNodes = [];	

		for(var row=0; row < choices.length; row++){
			for(var col=0; col < choices[row].length; col++){
				var highlightNode = document.createElement("img");
				highlightNode.src = dojo.moduleUrl("dijit", "templates/blank.gif");
				dojo.addClass(highlightNode, "dijitPaletteImg");
				var color = choices[row][col];
				highlightNode.alt = highlightNode.color = color;
				var highlightStyle = highlightNode.style;
				highlightStyle.color = highlightStyle.backgroundColor = "#" + color;
				dojo.forEach(["MouseDown", "MouseOut", "MouseOver", "Blur", "Focus", "KeyDown"], function(handler){
					this.connect(highlightNode, "on"+handler.toLowerCase(), "_onColor"+handler);
				}, this);
				this.divNode.appendChild(highlightNode);
				var coords = this._paletteCoords;
				highlightStyle.top = coords.topOffset + (row * coords.cHeight) + "px";
				highlightStyle.left = coords.leftOffset + (col * coords.cWidth) + "px";
				highlightNode.setAttribute("tabIndex","-1");
				highlightNode.title = color+ " "; //color name will go here
				dijit.wai.setAttr(highlightNode, "waiRole", "role", "td");
				highlightNode.index = this._highlightNodes.length;
				this._highlightNodes.push(highlightNode);
			}
		}
		this._highlightNodes[this._currentFocus].tabIndex = 0;
		this._xDim = choices[0].length;
		this._yDim = choices.length;

		// Now set all events
		// The palette itself is navigated to with the tab key on the keyboard
		// Keyboard navigation within the Palette is with the arrow keys
		// Spacebar selects the color.
		// For the up key the index is changed by negative the x dimension.		

		var keyIncrementMap = {
			UP_ARROW: -this._xDim,
			// The down key the index is increase by the x dimension.	
			DOWN_ARROW: this._xDim,
			// Right and left move the index by 1.
			RIGHT_ARROW: 1,
			LEFT_ARROW: -1
		};
		for(var key in keyIncrementMap){
			dijit.typematic.addKeyListener(this.domNode,
				{keyCode:dojo.keys[key], ctrlKey:false, altKey:false, shiftKey:false},
				this,
				function(){
					var increment = keyIncrementMap[key];
					return function(count){ this._navigateByKey(increment, count); };
				}(),
				this.timeoutChangeRate, this.defaultTimeout);
		}
	},

	focus: function(){
		// summary:
		//		Focus this ColorPalette.
		dijit.focus(this._highlightNodes[this._currentFocus]);
	},

	onChange: function(color){
		// summary:
		//		Callback when a color is selected.
		// color: String
		//		Hex value corresponding to color.
		console.debug("Color selected is: "+color);
	},

	_onColorMouseDown: function(/*Event*/ evt){
		// summary:
		//		Handler for onMouseDown. Selects the color.
		// evt:
		//		The mouse event.
		var target = evt.currentTarget;
		this._currentFocus = target.index;
		dijit.focus(target);
		this._selectColor(target);	
	},

	_onColorMouseOut: function(/*Event*/ evt){
		// summary:
		//		Handler for onMouseOut. Removes highlight.
		// evt:
		//		The mouse event.
		dojo.removeClass(evt.currentTarget, "dijitPaletteImgHighlight");
	},

	_onColorMouseOver: function(/*Event*/ evt){
		// summary:
		//		Handler for onMouseOver. Highlights the color.
		// evt:
		//		The mouse event.
		var target = evt.currentTarget;
		target.tabIndex = 0;
		target.focus();
	},

	_onColorBlur: function(/*Event*/ evt){
		// summary:
		//		Handler for onBlur. Removes highlight and sets
		//		the first color as the palette's tab point.
		// evt:
		//		The blur event.
		dojo.removeClass(evt.currentTarget, "dijitPaletteImgHighlight");
		evt.currentTarget.tabIndex = -1;
		this._currentFocus = 0;
		this._highlightNodes[0].tabIndex = 0;
	},

	_onColorFocus: function(/*Event*/ evt){
		// summary:
		//		Handler for onFocus. Highlights the color.
		// evt:
		//		The focus event.
		if(this._currentFocus != evt.currentTarget.index){
			this._highlightNodes[this._currentFocus].tabIndex = -1;
		}
		this._currentFocus = evt.currentTarget.index;
		dojo.addClass(evt.currentTarget, "dijitPaletteImgHighlight");

	},

	_onColorKeyDown: function(/*Event*/ evt){
		// summary:
		//		Handler for the onKeyDown event.
		//		Space selects the color currently highlighted.
		// evt:
		//		The keydown event.

		if((evt.keyCode == dojo.keys.SPACE) && this._currentFocus){
			this._selectColor(this._highlightNodes[this._currentFocus]);
		}
	},

	_selectColor: function(selectNode){	
		// summary:
		// 		This selects a color. It triggers the onChange event
		// area:
		//		The area node that covers the color being selected.
		this.value = selectNode.color;
		this.onChange(selectNode.color);
	},

	_navigateByKey: function(increment, typeCount){
		// summary:
		// 	  	This is the callback for typematic.
		// 		It changes the focus and the highlighed color.
		// increment:
		// 		How much the key is navigated.
		//	typeCount:
		//		How many times typematic has fired.

		// typecount == -1 means the key is released.
		if(typeCount == -1){ return; }

		var newFocusIndex = this._currentFocus + increment;
		if(newFocusIndex < this._highlightNodes.length && newFocusIndex > -1)
		{
			var focusNode = this._highlightNodes[newFocusIndex];
			focusNode.tabIndex = 0;
			focusNode.focus();
		}
	}
});
