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
	}
);

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
		baseClass : "dijitDropDownButton",
		
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
		
		_onArrowUp: function(/*Event*/ e){
			// summary: callback when the user mouse clicks on menu popup node
			if(this.disabled){ return; }
			// note: don't stop event; FormElement needs it to update styles
			this._toggleMenu();
		},

		_onKey: function(/*Event*/ e){
			// summary: callback when the user presses a key on menu popup node
			if(this.disabled){ return; }
			var key = (e.charCode == dojo.keys.SPACE ? dojo.keys.SPACE : e.keyCode);
			if((key == dojo.keys.DOWN_ARROW)
				|| (key == dojo.keys.ENTER)
				|| (key == dojo.keys.SPACE)){
				if(!this._menu || this._menu.domNode.style.display=="none"){
					dojo.stopEvent(e);
					return this._toggleMenu();
				}
			}
		},

		_toggleMenu: function(){
			// summary: toggle the menu; if it is up, close it, if not, open it
			if(this.disabled){ return; }
			this.popupStateNode.focus();
			var menu = this._menu;
			if(!menu){ return false; }
			if(!menu.isShowingNow){
				dijit.util.PopupManager.openAround(this.popupStateNode, menu, this._orientation);
				this.popupStateNode.setAttribute("popupActive", "true");
				this._opened=true;
			}else{
				dijit.util.PopupManager.closeAll();
				this._opened=false;
			}
			return false;
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
		_orientation: {'BR':'TR', 'TR':'BR'},
		
		// optionsTitle: String
		//  text that describes the options menu (accessibility)
		optionsTitle: "",

		baseClass: "dijitComboButton",
		_onArrowMouse : function(/*Event*/ e){
			this._onMouse(e, this.popupStateNode);
		},

		_onButtonClick: function(/*Event*/ e){
			// summary: callback when the user mouse clicks the button portion
			dojo.stopEvent(e);
			if(this.disabled){ return; }
			this.focusNode.focus();
			return this.onClick(e);
		},

		_onButtonKey: function(/*Event*/ e){
			// summary: callback when the user presses a key on the button portion
			if(this.disabled){ return; }
			var key = (e.charCode == dojo.keys.SPACE ? dojo.keys.SPACE : e.keyCode);
			if((key == dojo.keys.SPACE) || (key == dojo.keys.ENTER)){
				dojo.stopEvent(e);
				return this.onClick(e);
			}
		}

	});
