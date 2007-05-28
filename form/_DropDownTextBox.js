dojo.provide("dijit.form._DropDownTextBox");

dojo.require("dijit.util.PopupManager");
dojo.require("dijit.util.wai");

dojo.declare(
	"dijit.form._DropDownTextBox",
	null,
	{
		// summary:
		//		Mixin text box with drop down

		templatePath: dojo.moduleUrl("dijit.form", "templates/AutoCompleter.html"),

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
		//	Class of master popup (dijit.form._AutoCompleterMenu)
		_popupClass:"",

		// _popupArgs: Object
		//	Object to pass to popup widget on initialization
		_popupArgs:{},

		// maxListLength: Integer
		//		Limits list to X visible rows, scroll on rest
		maxListLength: 8,

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

		arrowClicked: function(){
			// summary: callback when arrow is clicked
			if(this.disabled){
				return;
			}
			this.focus();
			this.makePopup();
			if(this._popupWidget.isShowingNow()){
				this._hideResultList();
			}else{
				// forces full population of results, if they click
				// on the arrow it means they want to see more options
				this._openResultList();
			}
		},

		_hideResultList: function(){
			if(this._popupWidget&&(!this._popupWidget.isShowingNow||this._popupWidget.isShowingNow())){
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
			// sometimes the tooltip gets stuck; confused by dropdown
			// don't hide if already hidden
			if(dijit.MasterTooltip.domNode.style.opacity){dijit.MasterTooltip.hide();}
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

		focus: function(){
			try{
				this.textbox.focus();
			}
			catch(e){
				// element isn't focusable if disabled, or not visible etc - not easy to test for.
			}
		},

		_showResultList: function(){
			// Our dear friend IE doesnt take max-height so we need to calculate that on our own every time
			var childs = this._popupWidget.getListLength ? this._popupWidget.getItems() : [this._popupWidget.domNode];

			if(childs.length){
				var visibleCount = Math.min(childs.length,this.maxListLength);
				with(this._popupWidget.domNode.style){
					// trick to get the dimensions of the popup
					visibility="hidden";
					display="";

					if(visibleCount == childs.length){
						//no scrollbar is required, so unset height to let browser calcuate it,
						//as in css, overflow is already set to auto
						height = "";
					}else{
						var calcheight = visibleCount * (childs[0]).offsetHeight;
						var windowheight=dijit.util.getViewport().h;
						if(calcheight>windowheight){
							var coords=dojo.coords(this._popupWidget.domNode);
							calcheight=windowheight-coords.y;
						}
						height=calcheight+"px";
					}
					width="";
					visibility="visible";
				}
				this._arrowPressed();
				this._popupWidget.open(this);
			}else{
				this._hideResultList();
			}
		},

		isShowingNow:function(){
			// summary
			//	test if the popup is visible
			return this._popupWidget&&this._popupWidget.isShowingNow();
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

 dojo.declare(
	"dijit.form._DropDownTextBox.Popup",
 	null,
	{
		// summary:
		//	Mixin that provides basic open/close behavior for popup widgets

		// parentWidget: Widget
		//	Reference to parent widget
		parentWidget:null,

		postCreate:function(){
			// FIXME: create an external template so template style isn't displaced
			this.domNode.style.display="none";
			this.domNode.style.overflow="auto";
			this.domNode.style.position="absolute";
		},

		open:function(/*Widget*/ widget){
			// summary:
			//	opens the menu

			this.parentWidget=widget;
			setTimeout(dojo.hitch(this, function(){dijit.util.PopupManager.openAround(widget.textbox, this);}), 1);
		},

		isShowingNow:function(){
			return this.domNode.style.display!="none";
		},

		close: function(/*Boolean*/ force){
			// summary:
			//	closes the menu

			if(!this.isShowingNow()){
				return;
			}
			this.onValueChanged=function(){
				return;
			};
			this.parentWidget=null;
		}
	}
);
