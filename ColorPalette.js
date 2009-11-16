dojo.provide("dijit.ColorPalette");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojo.colors");
dojo.require("dojo.i18n");
dojo.requireLocalization("dojo", "colors");

dojo.declare("dijit.ColorPalette",
	[dijit._Widget, dijit._Templated],
	{
	// summary:
	//		A keyboard accessible color-picking widget
	// description:
	//		Grid showing various colors, so the user can pick a certain color.
	//		Can be used standalone, or as a popup.
	//
	// example:
	// |	<div dojoType="dijit.ColorPalette"></div>
	//
	// example:
	// |    var picker = new dijit.ColorPalette({ },srcNode);
	// |	picker.startup();

	// defaultTimeout: Number
	//		Number of milliseconds before a held key or button becomes typematic
	defaultTimeout: 500,

	// timeoutChangeRate: Number
	//		Fraction of time used to change the typematic timer between events
	//		1.0 means that each typematic event fires at defaultTimeout intervals
	//		< 1.0 means that each typematic event fires at an increasing faster rate
	timeoutChangeRate: 0.90,

	// palette: String
	//		Size of grid, either "7x10" or "3x4".
	palette: "7x10",

	// value: String
	//		The value of the selected color.
	value: null,

	// _currentFocus: [private] DomNode
	//		The currently focused or hovered color.
	//		Different from value, which represents the selected (i.e. clicked) color.
	_currentFocus: 0,

	// _xDim: [protected] Integer
	//		This is the number of colors horizontally across.
	_xDim: null,

	// _yDim: [protected] Integer
	///		This is the number of colors vertically down.
	_yDim: null,

	// _palettes: [protected] Map
	// 		This represents the value of the colors.
	//		The first level is a hashmap of the different arrays available
	//		The next two dimensions represent the columns and rows of colors.
	_palettes: {
		"7x10":	[["white", "seashell", "cornsilk", "lemonchiffon","lightyellow", "palegreen", "paleturquoise", "lightcyan",	"lavender", "plum"],
				["lightgray", "pink", "bisque", "moccasin", "khaki", "lightgreen", "lightseagreen", "lightskyblue", "cornflowerblue", "violet"],
				["silver", "lightcoral", "sandybrown", "orange", "palegoldenrod", "chartreuse", "mediumturquoise", 	"skyblue", "mediumslateblue","orchid"],
				["gray", "red", "orangered", "darkorange", "yellow", "limegreen", 	"darkseagreen", "royalblue", "slateblue", "mediumorchid"],
				["dimgray", "crimson", 	"chocolate", "coral", "gold", "forestgreen", "seagreen", "blue", "blueviolet", "darkorchid"],
				["darkslategray","firebrick","saddlebrown", "sienna", "olive", "green", "darkcyan", "mediumblue","darkslateblue", "darkmagenta" ],
				["black", "darkred", "maroon", "brown", "darkolivegreen", "darkgreen", "midnightblue", "navy", "indigo", 	"purple"]],

		"3x4": [["white", "lime", "green", "blue"],
			["silver", "yellow", "fuchsia", "navy"],
			["gray", "red", "purple", "black"]]
	},

	// _imagePaths: [protected] Map
	//		This is stores the path to the palette images
	_imagePaths: {
		"7x10": dojo.moduleUrl("dijit.themes", "a11y/colors7x10.png"),
		"3x4": dojo.moduleUrl("dijit.themes", "a11y/colors3x4.png")
	},

	// _paletteCoords: [protected] Map
	//		This is a map that is used to calculate the coordinates of the
	//		images that make up the palette.
	_paletteCoords: {
		"leftOffset": 3, "topOffset": 3,
		"cWidth": 20, "cHeight": 20
	},

	// templateString: String
	//		The template of this widget.
	templateString: dojo.cache("dijit", "templates/ColorPalette.html"),

	// _paletteDims: [protected] Object
	//		Size of the supported palettes for alignment purposes.
	_paletteDims: {
		"7x10": {"width": "206px", "height": "145px"},
		"3x4": {"width": "86px", "height": "64px"}
	},

	// tabIndex: String
	//		Widget tab index.
	tabIndex: "0",

	buildRendering: function(){
		// Instantiate the template, which makes a skeleton into which we'll insert a bunch of
		// <img> nodes
		this.inherited(arguments);
	
		// A name has to be given to the colorMap, this needs to be unique per Palette.
		dojo.mixin(this.divNode.style, this._paletteDims[this.palette]);
		this.imageNode.setAttribute("src", this._imagePaths[this.palette].toString());
		var choices = this._palettes[this.palette];
		this.domNode.style.position = "relative";
		this._cellNodes = [];
		this.colorNames = dojo.i18n.getLocalization("dojo", "colors", this.lang);
		var url = this._blankGif,
			colorObject = new dojo.Color(),
			coords = this._paletteCoords;
		for(var row=0; row < choices.length; row++){
			var rowNode = dojo.create("div", {
				role: "row"
			}, this.divNode);
			for(var col=0; col < choices[row].length; col++){

				var color = choices[row][col],
						colorValue = colorObject.setColor(dojo.Color.named[color]);

				var cellNode = dojo.create("span", {
					"class": "dijitPaletteCell",
					tabIndex: "-1",
					title: this.colorNames[color],
					style: {
						top: coords.topOffset + (row * coords.cHeight) + "px",
						left: coords.leftOffset + (col * coords.cWidth) + "px"
					}
				});

				var imgNode = dojo.create("img",{
					src: url,
					"class":"dijitPaletteImg",
					alt: this.colorNames[color]
				}, cellNode);

				// FIXME: color is an attribute of img?
				imgNode.color = colorValue.toHex();
				var imgStyle = imgNode.style;
				imgStyle.color = imgStyle.backgroundColor = imgNode.color;

				dojo.forEach(["Dijitclick", "MouseEnter", "MouseLeave", "Focus"], function(handler){
					this.connect(cellNode, "on" + handler.toLowerCase(), "_onCell" + handler);
				}, this);

				dojo.place(cellNode, rowNode);

				dijit.setWaiRole(cellNode, "gridcell");
				cellNode.index = this._cellNodes.length;
				this._cellNodes.push(cellNode);
			}
		}
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
			this._connects.push(dijit.typematic.addKeyListener(this.domNode,
				{charOrCode:dojo.keys[key], ctrlKey:false, altKey:false, shiftKey:false},
				this,
				function(){
					var increment = keyIncrementMap[key];
					return function(count){ this._navigateByKey(increment, count); };
				}(),
				this.timeoutChangeRate, this.defaultTimeout));
		}
	},
	
	postCreate: function(){
		this.inherited(arguments);

		// Set initial navigable node.   At any point in time there's exactly one
		// cell with tabIndex != -1.   If focus is inside the ColorPalette then
		// focus is on that cell.
		// TODO: if we set aria info (for the current value) on the ColorPalette itself then can we avoid
		// having to focus each individual cell?
		this._currentFocus = this._cellNodes[0];
		dojo.attr(this._currentFocus, "tabIndex", this.tabIndex);
	},

	focus: function(){
		// summary:
		//		Focus this ColorPalette.  Puts focus on the most recently focused cell.

		// The cell already has tabIndex set, just need to set CSS and focus it
		dojo.addClass(this._currentFocus, "dijitPaletteCellHighlight");
		dijit.focus(this._currentFocus);
	},

	onChange: function(color){
		// summary:
		//		Callback when a color is selected.
		// color: String
		//		Hex value corresponding to color.
//		console.debug("Color selected is: "+color);
	},

	_onFocus: function(){
		// summary:
		//		Handler for when the ColorPalette gets focus (because a cell inside
		//		the ColorPalette got focus)
		// tags:
		//		protected

		dojo.addClass(this._currentFocus, "dijitPaletteCellHighlight");
		this.inherited(arguments);
	},

	_onBlur: function(){
		// summary:
		//		Handler for when the ColorPalette loses focus
		// tags:
		//		protected

		// Just to be the same as 1.3, when I am focused again go to first (0,0) cell rather than
		// currently focused node.
		dojo.attr(this._currentFocus, "tabIndex", "-1");
		dojo.removeClass(this._currentFocus, "dijitPaletteCellHighlight");
		this._currentFocus = this._cellNodes[0];
		dojo.attr(this._currentFocus, "tabIndex", this.tabIndex);

		this.inherited(arguments);
	},

	_onCellDijitclick: function(/*Event*/ evt){
		// summary:
		//		Handler for click, enter key & space key. Selects the color.
		// evt:
		//		The event.
		// tags:
		//		private

		var target = evt.currentTarget;
		this._selectColor(target);
		dojo.stopEvent(evt);
	},

	_onCellMouseEnter: function(/*Event*/ evt){
		// summary:
		//		Handler for onMouseEnter event on a cell. Put highlight on the color under the mouse.
		// evt:
		//		The mouse event.
		// tags:
		//		private

		var target = evt.currentTarget;
		this._setCurrent(target);
	},

	_onCellMouseLeave: function(/*Event*/ evt){
		// summary:
		//		Handler for onMouseLeave event on a cell. Remove highlight on the color under the mouse.
		// evt:
		//		The mouse event.
		// tags:
		//		private

		dojo.removeClass(this._currentFocus, "dijitPaletteCellHighlight");
	},

	_onCellFocus: function(/*Event*/ evt){
		// summary:
		//		Handler for onFocus of a cell.
		// description:
		//		Removes highlight of the color that just lost focus, and highlights
		//		the new color.  Also moves the tabIndex setting to the new cell.
		//		
		// evt:
		//		The focus event.
		// tags:
		//		private

		this._setCurrent(evt.currentTarget);
	},

	_setCurrent: function(/*Node*/ node){
		// summary:
		//		Called when a color is hovered or focused.
		// description:
		//		Removes highlight of the old color, and highlights
		//		the new color.  Also moves the tabIndex setting to the new cell.
		// tags:
		//		protected
		if("_currentFocus" in this){
			// Remove highlight and tabIndex on old cell
			dojo.attr(this._currentFocus, "tabIndex", "-1");
			dojo.removeClass(this._currentFocus, "dijitPaletteCellHighlight");
		}

		// Set highlight and tabIndex of new cell
		this._currentFocus = node;
		if(node){
			dojo.attr(node, "tabIndex", this.tabIndex);
			dojo.addClass(node, "dijitPaletteCellHighlight");
		}
	},

	_selectColor: function(selectNode){
		// summary:
		// 		This selects a color. It triggers the onChange event
		// area:
		//		The area node that covers the color being selected.
		// tags:
		//		private
		var img = selectNode.getElementsByTagName("img")[0];
		this.onChange(this.value = img.color);
	},

	_navigateByKey: function(increment, typeCount){
		// summary:
		// 	  	This is the callback for typematic.
		// 		It changes the focus and the highlighed color.
		// increment:
		// 		How much the key is navigated.
		// typeCount:
		//		How many times typematic has fired.
		// tags:
		//		private

		// typecount == -1 means the key is released.
		if(typeCount == -1){ return; }

		var newFocusIndex = this._currentFocus.index + increment;
		if(newFocusIndex < this._cellNodes.length && newFocusIndex > -1)
		{
			var focusNode = this._cellNodes[newFocusIndex];
			this._setCurrent(focusNode);

			// Actually focus the node, for the benefit of screen readers.
			// Use setTimeout because IE doesn't like changing focus inside of an event handler
			setTimeout(dojo.hitch(dijit, "focus", focusNode), 0);
		}
	}
});
