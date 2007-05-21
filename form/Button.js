dojo.provide("dijit.form.Button");

dojo.require("dijit.base.FormElement");
dojo.require("dijit.base.TemplatedWidget");

dojo.declare(
	"dijit.form.Button",
	[dijit.base.FormElement, dijit.base.TemplatedWidget],
	{
/*
 * usage
 *	<button dojoType="button" onClick="...">Hello world</button>
 *
 *  var button1 = dojo.widget.createWidget("Button", {caption: "hello world", onClick: foo});
 *	document.body.appendChild(button1.domNode);
 */
		// summary
		//	Basically the same thing as a normal HTML button, but with special styling.

		// caption: String
		//	text to display in button
		caption: "",

		type: "button",
		baseClass: "dijitButton",
		templatePath: dojo.moduleUrl("dijit.form", "templates/Button.html"),
		
		postCreate: function(){
			dijit.form.Button.superclass.postCreate.apply(this, arguments);
			if(this.caption){
				this.setCaption(this.caption);
			}
		},
	
		buttonClick: function(/*Event*/ e){
			// summary: internal function for handling button clicks via mouse or keybd
			dojo.stopEvent(e);
			if(!this.disabled){ 
				this.onClick(e); 
			}
		},

		onClick: function(/*Event*/ e){
			// summary: callback for when button is clicked; user can override this function
		},

		setCaption: function(/*String*/ content){
			// summary: reset the caption (text) of the button; takes an HTML string
			this.containerNode.innerHTML = this.caption = content;
			if(dojo.isMozilla){ // Firefox has re-render issues with tables
				var oldDisplay = dojo.getComputedStyle(this.domNode).display;
				this.domNode.style.display="none";
				var _this = this;
				setTimeout(function(){_this.domNode.style.display=oldDisplay;},1);
			}
		}
	});

/*
 * usage
 *	<button dojoType="DropDownButton" menuId="mymenu">Hello world</button>
 *
 *  var button1 = dojo.widget.createWidget("DropDownButton", {caption: "hello world", menuId: foo});
 *	document.body.appendChild(button1.domNode);
 */
dojo.declare(
	"dijit.form.DropDownButton",
	dijit.form.Button,
	{
		// summary
		//		push the button and a menu shows up

		// menuId: String
		//	widget id of the menu that this button should activate
		menuId: "",

		_orientation: {'BL':'TL', 'TL':'BL'},
		
		templatePath: dojo.moduleUrl("dijit.form" , "templates/DropDownButton.html"),

		postCreate: function(){
			dijit.form.DropDownButton.superclass.postCreate.apply(this, arguments);
			dijit.util.wai.setAttr(this.domNode, "waiState", "haspopup", this.menuId);
		},

		startup: function(){
			this._menu = dijit.byId(this.menuId);
			this.connect(this._menu, "onClose", function(){
				this.popupStateNode.removeAttribute("popupActive");
			}); 
		},

		arrowKey: function(/*Event*/ e){
			// summary: callback when the user presses a key (on key-down)
			if(this.disabled){ return; }
			if(e.keyCode == dojo.keys.DOWN_ARROW || (e.currentTarget == this.popupStateNode && (e.keyCode == dojo.keys.SPACE || e.keyCode == dojo.keys.ENTER))){
				if(!this._menu || this._menu.domNode.style.display=="none"){
					this.arrowClick(e);
				}
			}
		},

		arrowClick: function(/*Event*/ e){
			// summary: callback when button is clicked; user shouldn't override this function or else the menu won't toggle
			dojo.stopEvent(e);
			if(this.disabled){ return; }
			this.popupStateNode.focus();
			var menu = this._menu;
			if(!menu){ return; }
			if(!this._opened){
				dijit.util.PopupManager.openAround(this.popupStateNode, menu, this._orientation, [0,0]);
				this.popupStateNode.setAttribute("popupActive", "true");
				this._opened=true;
			}else{
				// PopupManager already caught the click and closed the menu so nothing to do here
				this._opened=false;
			}
		}
	});

/*
 * usage
 *	<button dojoType="ComboButton" onClick="..." menuId="mymenu">Hello world</button>
 *
 *  var button1 = dojo.widget.createWidget("DropDownButton", {caption: "hello world", onClick: foo, menuId: "myMenu"});
 *	document.body.appendChild(button1.domNode);
 */
dojo.declare(
	"dijit.form.ComboButton",
	dijit.form.DropDownButton,
	{
		// summary
		//		left side is normal button, right side displays menu
		templatePath: dojo.moduleUrl("dijit.form", "templates/ComboButton.html"),
		_orientation: {'BR':'TR', 'TR':'BR'}
	});
