dojo.provide("dijit.ColorPalette");

dojo.require("dijit.util.place");
dojo.require("dijit.util.typematic");
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

	//_selectedColor: String
	//		The value of the selected color.
	selectedColor: null,

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
		"3x4": {"width": "82px", "height": "58px"}
	},


	postCreate: function() {

		// A name has to be given to the colorMap, this needs to be unique per Palette.	
		this.divNode.style.width = this._paletteDims[this.palette]["width"];
		this.divNode.style.height = this._paletteDims[this.palette]["height"];
		this.imageNode.setAttribute("src",this._imagePaths[this.palette]);
		var alts = this._palettes[this.palette];	
		this.domNode.style.position = "relative";
		this._highlightNodes = [];	

		for (var row=0; row<alts.length; row++) {
			for (var col=0; col<alts[row].length; col++) {
				var highlightNode = document.createElement("img");
				highlightNode.src = dojo.moduleUrl("dijit", "templates/blank.gif")
				dojo.addClass(highlightNode, "dijitPaletteImg");
				highlightNode.color = alts[row][col];
				highlightNode.alt = highlightNode.color;
				highlightNode.style.color = "#"+highlightNode.color;
				highlightNode.style.backgroundColor = "#"+highlightNode.color;
				this.connect(highlightNode,"onmouseover", "onMouseOver");
				this.connect(highlightNode,"onmousedown", "onClick");
				this.connect(highlightNode,"onblur","onBlur");
				this.connect(highlightNode,"onfocus","onFocus");
				this.connect(highlightNode,"onkeydown","onKeyDown");
				this.divNode.appendChild(highlightNode);
				highlightNode.style.top = this._paletteCoords["topOffset"] + (row * this._paletteCoords["cHeight"])+"px";
				highlightNode.style.left = this._paletteCoords["leftOffset"] + (col * this._paletteCoords["cWidth"])+"px";
				highlightNode.setAttribute("tabIndex","-1");
				highlightNode.title = highlightNode.color+ " "; //color name will go here
				dijit.util.wai.setAttr(highlightNode, "waiRole", "role", "td");
				highlightNode.index = this._highlightNodes.length;
				this._highlightNodes.push(highlightNode);
			}
		}
		this._highlightNodes[this._currentFocus].tabIndex = 0;
		this._xDim = alts[0].length;
		this._yDim = alts.length;

		// Now set all events
		// The palette itself is navigated to with the tab key on the keyboard
		// Keyboard navigation within the Palette is with the arrow keys
		// Spacebar selects the color.
		// For the up key the index is changed by negative the x dimension.		

		dijit.util.typematic.addKeyListener(this.domNode,
			{keyCode:dojo.keys.UP_ARROW,ctrlKey:false,altKey:false,shiftKey:false},
			this, function(count,node,evt) { this._navigateByKey(-this._xDim,count); },
			this.timeoutChangeRate, this.defaultTimeout);
		// The down key the index is increase by the x dimension.	
		dijit.util.typematic.addKeyListener(this.domNode,
			{keyCode:dojo.keys.DOWN_ARROW,ctrlKey:false,altKey:false,shiftKey:false},
			this, function(count,node,evt) { this._navigateByKey(this._xDim,count); },
			this.timeoutChangeRate, this.defaultTimeout);
		// Right and left move the index by 1.
		dijit.util.typematic.addKeyListener(this.domNode,
			{keyCode:dojo.keys.RIGHT_ARROW,ctrlKey:false,altKey:false,shiftKey:false},
			this, function(count,node,evt) { this._navigateByKey(1,count); },
			this.timeoutChangeRate, this.defaultTimeout);
		dijit.util.typematic.addKeyListener(this.domNode,
			{keyCode:dojo.keys.LEFT_ARROW,ctrlKey:false,altKey:false,shiftKey:false},
			this, function(count,node,evt) { this._navigateByKey(-1,count); },
			this.timeoutChangeRate, this.defaultTimeout);
	},

	onColorSelect: function(color){
		// summary:
		//		Callback when a color is selected.
		// color: String
		//		Hex value corresponding to color.
		console.debug("Color selected is: "+color);
	},

	onClick: function(/*Event*/ evt) {
		// summary:
		//		Handler when a mouse click occurs. This causes the color that is clicked to be selected.
		// evt:
		//			The click event.
		this._currentFocus = evt.currentTarget.index;
		evt.currentTarget.focus();
		this._selectColor(evt.currentTarget);	
	},

	onMouseOver: function(evt) {
		// summary:
		//		Handler for onMouseOver. This changes the color being highlighted.
		// evt:
		//		The mouse event.	
		evt.currentTarget.tabIndex = 0;
		evt.currentTarget.focus();
	},

	onBlur: function(evt) {
		// summary:
		//		Handler for the onBlur event. Causes the highlight Div
		//		to be destroyed.
		// evt:
		//		The blur event.
		dojo.removeClass(evt.currentTarget, "dijitPaletteImgHighlight");
	},

	onFocus: function(evt) {
		// summary:
		//		Handler for onFocus. This highlights the first color in the
		//		palette if it is the first time the palette is focused.
		//		Otherwise the last color highlighted is focused.
		// evt:
		//		The focus event.
		if (this._currentFocus != evt.currentTarget.index)
		{
			this._highlightNodes[this._currentFocus].tabIndex = -1;
		}
		this._currentFocus = evt.currentTarget.index;
		dojo.addClass(evt.currentTarget, "dijitPaletteImgHighlight");

	},

	onKeyDown: function(evt) {
		// summary:
		//		Handler for the onKeyDown event.
		//		It handles space and tab being pressed.
		//		Space selects the color currently highlighted.
		//		Tab blurs the area currently highlighted.
		// evt:
		//		The keydown event.

		if (evt.keyCode == dojo.keys.SPACE)
		{
			if (this._currentFocus != null)
			{
				this._selectColor(this._highlightNodes[this._currentFocus]);
			}
		}
	},

	_selectColor: function (selectNode) {	
		// summary:
		// 		This selects a color. It triggers the onColorSelect event
		// area:
		//		The area node that covers the color being selected.
		this.selectedColor = selectNode.color;
		this.onColorSelect(selectNode.color);
	},

	_navigateByKey: function(increment,typeCount) {
		// summary:
		// 	  	This is the callback for typematic.
		// 		It changes the focus and the highlighed color.
		// increment:
		// 		How much the key is navigated.
		//	typeCount:
		//		How many times typematic has fired.

		// typecount == -1 means the key is released.
		if (typeCount==-1) { return; }

		var newFocus = this._currentFocus+increment;
		if (newFocus < this._highlightNodes.length && newFocus > -1)
		{
			this._highlightNodes[newFocus].tabIndex = 0;
			this._highlightNodes[newFocus].focus();
		}
	}
});
