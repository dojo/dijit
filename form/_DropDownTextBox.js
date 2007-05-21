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
		
		// _popupName: String
		//	Name of master popup (dijit.form.AutoCompleter.MasterPopup)
		// If left blank, then makePopup() creates one popup per widget instance
		_popupName:"",
		
		// _popupClass: String
		//	Class of master popup (dijit.form._AutoCompleterMenu)
		_popupClass:"",
		
		// _popupArgs: Object
		//	Object to pass to popup widget on initialization
		_popupObject:{},
		
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
			
			// this code only runs if there is no popup reference
			if(!this._popupWidget){
				// does this widget have one "master" popup?
				if(this._popupName){
					// does the master popup not exist yet?
					if(!eval(this._popupName)){
						// create the master popup for the first time
						var node=document.createElement("div");
						document.body.appendChild(node);		
						var popupProto=dojo.getObject(this._popupClass, false);
						eval(this._popupName+"=new popupProto(this._popupArgs, node);");
					}
					// assign master popup to local link
					this._popupWidget=eval(this._popupName);
				}else{
					// if master popup is not being used, create one popup per widget instance
					var node=document.createElement("div");
					document.body.appendChild(node);		
					var popupProto=dojo.getObject(this._popupClass, false);
					this._popupWidget=new popupProto(this._popupArgs, node);
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
			if(!this._popupWidget||!this._popupWidget.isShowingNow()){
				this.setValue(this.getValue());
			}
			// sometimes the tooltip gets stuck; confused by dropdown
			dijit.MasterTooltip.hide();
		},

		onkeypress:function(){
			// AutoCompleter uses keypress, but not DateTextbox
			// this placeholder prevents errors
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
		
		setupLabels: function(){
			// summary: 
			//		associate label with input element for accessibility.
			// description: 
			//		find any label initially associated with the input element and reconnect
			// to the input element (orig input id has been moved to the outer fieldset)
			// assumes <label for="inputId">label text </label> rather than
			// <label><input type="xyzzy">label text</label>
			if(this.id && this.id != ""){
				var labels = document.getElementsByTagName("label");
				if(labels != null && labels.length > 0){
					for(var i=0; i<labels.length; i++){
						if(labels[i].htmlFor == this.id){
							if(!this.textbox.id){
								this.textbox.id = (this.id + "input");
							}
							labels[i].htmlFor=this.textbox.id;
							break;
						}
					}
				}
			}
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
			setTimeout(dojo.hitch(this, function(){dijit.util.PopupManager.openAround(widget.textbox, this,{'BL':'TL', 'TL':'BL'}, [0,0]);}), 1);
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
