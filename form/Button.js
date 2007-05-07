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
		baseClass: "dojoButton",
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

		onClick: function(/*Event*/ e) {
			// summary: callback for when button is clicked; user can override this function
		},

		setCaption: function(/*String*/ content){
			// summary: reset the caption (text) of the button; takes an HTML string
			this.containerNode.innerHTML = this.caption = content;
			if (dojo.isMozilla){ // Firefox has re-render issues with tables
				var oldDisplay = dojo.getComputedStyle(this.domNode, 'display');
				this.domNode.style.display="none";
				var _this = this;
				setTimeout(function(){_this.domNode.style.display=oldDisplay;},1);
			}
		},

		_setDisabled: function(/*Boolean*/ disable){
			dojo.forEach(this.domNode.getElementsByTagName('BUTTON'),
				function(button){
					button.disabled = (disable != false);
				}
			);
			dijit.form.Button.superclass._setDisabled.apply(this, arguments);
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

		templatePath: dojo.moduleUrl("dijit.form" , "templates/DropDownButton.html"),

		postCreate: function(){
			dijit.form.DropDownButton.superclass.postCreate.apply(this, arguments);
			dijit.util.wai.setAttr(this.domNode, "waiState", "haspopup", this.menuId);
		},

		arrowKey: function(/*Event*/ e){
			// summary: callback when the user presses a key (on key-down)
			if (this.disabled) { return; }
			if(e.keyCode == dojo.keys.DOWN_ARROW || (e.currentTarget == this.popupStateNode && (e.keyCode == dojo.keys.SPACE || e.keyCode == dojo.keys.ENTER))){
				if (!this._menu || this._menu.domNode.style.display=="none"){
					this.arrowClick(e);
				}
			}
		},

		arrowClick: function(/*Event*/ e){
			// summary: callback when button is clicked; user shouldn't override this function or else the menu won't toggle
			dojo.stopEvent(e);
			if(this.disabled){ return; }
			this.popupStateNode.focus();
			var menu = dijit.util.manager.byId(this.menuId); 
			if ( !menu ) { return; }
			if ( menu.open && menu.domNode.style.display=="none") {
				var pos = dojo.coords(this.popupStateNode, true);
				dijit.util.PopupManager.open({pageX:pos.x, pageY:pos.y+this.domNode.offsetHeight, target:this.domNode}, menu);
				if (menu.domNode.style.display!="none") {
					this._menu = menu;
					this.popupStateNode.setAttribute("popupActive", "true");
					this._oldMenuClose = menu.close;
					var _this = this;
					menu.close = function(){
						_this._menu = null;
						if (typeof _this._oldMenuClose == "function") {
							_this.popupStateNode.removeAttribute("popupActive");
							this.close = _this._oldMenuClose;
							_this._oldMenuClose = null;
							this.close();
						}
					}
				}
			} else if ( menu.close && menu.domNode.style.display!="none" ){
				menu.close();
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
		templatePath: dojo.moduleUrl("dijit.form", "templates/ComboButton.html")
	});
