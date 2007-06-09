dojo.provide("dijit.form._DropDownTextBox");

dojo.require("dijit.util.popup");
dojo.require("dijit.util.wai");

dojo.declare(
	"dijit.form._DropDownTextBox",
	null,
	{
		// summary:
		//		Mixin text box with drop down

		templatePath: dojo.moduleUrl("dijit.form", "templates/ComboBox.html"),

		// _popupWidget: Widget
		//	link to the popup widget created by makePopop
		_popupWidget:null,

		// _hasMasterPopup: Boolean
		//	Flag that determines if this widget should share one popup per widget prototype,
		//	or create one popup per widget instance.
		//	If true, then makePopup() creates one popup per widget prototype.
		//	If false, then makePopup() creates one popup per widget instance.
		_hasMasterPopup:false,

		// _popupClass: String
		//	Class of master popup (dijit.form._ComboBoxMenu)
		_popupClass:"",

		// _popupArgs: Object
		//	Object to pass to popup widget on initialization
		_popupArgs:{},

		_arrowPressed: function(){
			if(!this.disabled){
				dojo.addClass(this.downArrowNode, "dijitArrowButtonActive");
			}
		},

		_arrowIdle: function(){
			if(this.disabled){
				return;
			}
			dojo.removeClass(this.downArrowNode, "dojoArrowButtonPushed");
		},

		makePopup: function(){
			// summary:
			//	create popup widget on demand
			var _this=this;
			function _createNewPopup(){
				// common code from makePopup
				var node=document.createElement("div");
				document.body.appendChild(node);
				// If you leave display="", _DropDownTextBox will think that the popup is open.
				// _DropDownTextBox will call PopupManager.close() to close its last popup.
				// However, because this popup was never popped up, 
				// PopupManager has an empty popup stack and creates an error.
				// Setting display="none" prevents this bad call to PopupManager.close().
				with(node.style){
					display="none";
					position="absolute";
					overflow="auto";
				}
				var popupProto=dojo.getObject(_this._popupClass, false);
				return new popupProto(_this._popupArgs, node);
			}
			// this code only runs if there is no popup reference
			if(!this._popupWidget){
				// does this widget have one "master" popup?
				if(this._hasMasterPopup){
					// does the master popup not exist yet?
					var parentClass = dojo.getObject(this.declaredClass, false);
					if(!parentClass.prototype._popupWidget){
						// create the master popup for the first time
						parentClass.prototype._popupWidget=_createNewPopup();
					}
					// assign master popup to local link
					this._popupWidget=parentClass.prototype._popupWidget;
				}else{
					// if master popup is not being used, create one popup per widget instance
					this._popupWidget=_createNewPopup();
				}
			}
		},

		_onArrowClick: function(){
			// summary: callback when arrow is clicked
			if(this.disabled){
				return;
			}
			this.focus();
			this.makePopup();
			if(this.isShowingNow()){
				this._hideResultList();
			}else{
				// forces full population of results, if they click
				// on the arrow it means they want to see more options
				this._openResultList();
			}
		},

		_hideResultList: function(){
			if(this.isShowingNow()){
				dijit.util.PopupManager.close(true);
				this._arrowIdle();
			}
		},

		_openResultList:function(){
			// summary:
			//	any code that needs to happen before the popup appears.
			//	creating the popupWidget contents etc.
			this._showResultList();
		},

		onblur:function(){
			this._arrowIdle();
			// removeClass dijitInputFieldFocused
			dojo.removeClass(this.nodeWithBorder, "dijitInputFieldFocused");
			// hide the Tooltip only if valid input
			if(this.isValid()){this._displayMessage("");}
		},

		onkeypress: function(/*Event*/ evt){
			// summary: generic handler for popup keyboard events
			if(evt.ctrlKey || evt.altKey){
				return;
			}
			switch(evt.keyCode){
				case dojo.keys.PAGE_DOWN:
				case dojo.keys.DOWN_ARROW:
					if(!this.isShowingNow()||this._prev_key_esc){
						this.makePopup();
						this._arrowPressed();
						this._openResultList();
					}
					dojo.stopEvent(evt);
					this._prev_key_backspace = false;
					this._prev_key_esc = false;
					break;

				case dojo.keys.PAGE_UP:
				case dojo.keys.UP_ARROW:
				case dojo.keys.ENTER:
					// prevent default actions
					dojo.stopEvent(evt);
					// fall through
				case dojo.keys.ESCAPE:
				case dojo.keys.TAB:
					if(this.isShowingNow()){
						this._prev_key_backspace = false;
						this._prev_key_esc = (evt.keyCode==dojo.keys.ESCAPE);
						this._hideResultList();
					}
					break;
			}
		},

		compositionend: function(/*Event*/ evt){
			// summary: When inputting characters using an input method, such as Asian
			// languages, it will generate this event instead of onKeyDown event
			this.onkeypress({charCode:-1});
		},

		_showResultList: function(){
			// Our dear friend IE doesnt take max-height so we need to calculate that on our own every time
			this._hideResultList();
			var childs = this._popupWidget.getListLength ? this._popupWidget.getItems() : [this._popupWidget.domNode];

			if(childs.length){
				var visibleCount = Math.min(childs.length,this.maxListLength);
				with(this._popupWidget.domNode.style){
					// trick to get the dimensions of the popup
					visibility="hidden";
					display="";
					width="";
					height="";
				}
				this._arrowPressed();
				// hide the tooltip
				this._displayMessage("");
				var best=this._popupWidget.open(this);
				dojo.marginBox(this._popupWidget.domNode, {h:best.h,w:dojo.marginBox(this.domNode).w});
				this._popupWidget.domNode.style.visibility="visible";
			}
		},

		isShowingNow:function(){
			// summary
			//	test if the popup is visible
			return this._popupWidget&&this._popupWidget.domNode.style.display!="none";
		},

		getDisplayedValue:function(){
			return this.textbox.value;
		},

		setDisplayedValue:function(/*String*/ value){
			this.textbox.value=value;
		},

		uninitialize:function(){
			if(this._popupWidget){this._popupWidget.destroy()};
		}
	}
);
