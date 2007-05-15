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
		
		// popupWidget: Widget
		//	link to the popup widget
		popupWidget:null,
		
		// visibleCount: Integer
		//	how many items to display
		visibleCount:1,
		
		_arrowPressed: function(){
			if(!this.disabled){
				dojo.addClass(this.downArrowNode, "dojoArrowButtonPushed");
			}
			
		},

		_arrowIdle: function(){
			if(this.disabled){
				return;
			}
			
			if(this.popupWidget.aroundwidget!=this){
				dojo.removeClass(this.downArrowNode, "dojoArrowButtonPushed");
			}
			
		},

		arrowClicked: function(){
			// summary: callback when arrow is clicked
			if(this.disabled){
				return;
			}
			this.focus();
			
			if(this.popupWidget.isShowingNow){
				this._hideResultList();
			}else{
				// forces full population of results, if they click
				// on the arrow it means they want to see more options
				this._openResultList();
			}
			
		},
		
		_hideResultList: function(){
			if(this.popupWidget){
				this.popupWidget.close(true);
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
			// removeClass dojoInputFieldFocused
			dojo.removeClass(this.nodeWithBorder, "dojoInputFieldFocused");
			if(!this.popupWidget.isShowingNow){
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
			var childs = this.popupWidget.getListLength ? this.popupWidget.getItems() : [this.popupWidget.domNode];
			this.popupWidget.open(this);
			if(childs.length){
				var visibleCount = Math.min(childs.length,this.maxListLength);
				with(this.popupWidget.domNode.style){
					display="";
					if(visibleCount == childs.length){
						//no scrollbar is required, so unset height to let browser calcuate it,
						//as in css, overflow is already set to auto
						height = "";
					}else{
						var calcheight = visibleCount * (childs[0]).offsetHeight;
						var windowheight=dijit.util.getViewport().h;
						if(calcheight>windowheight){
							var coords=dojo.coords(this.popupWidget.domNode);
							calcheight=windowheight-coords.y;
						}
						
						height=calcheight+"px";
					}
					
					//width = childs[0].width==undefined ? childs[0].offsetWidth+"px":childs[0].width+"px";
					width="";
				}
				
				// reopen to reposition
				//this.popupWidget.close(true);
				//this.popupWidget.open(this);
				this._arrowPressed();
			}else{
				this._hideResultList();
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
		
		// isShowingNow: Boolean
		//	Read-only value that indicates whether the popup is visible
		isShowingNow:false,
		
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
			this.isShowingNow=true;
			document.body.appendChild(this.domNode);
			setTimeout( dojo.hitch(this, function(){dijit.util.PopupManager.openAround(widget.textbox, this,{'BL':'TL', 'TL':'BL'}, [0,0]);}), 1);
		},
		
		close: function(/*Boolean*/ force){
			// summary:
			//	closes the menu
			
			if(!this.isShowingNow){
				return;
			}
			
			this.isShowingNow=false;
			this.onValueChanged=function(){
				return;
			};
			
			dijit.util.PopupManager.close(force);
			this.parentWidget=null;
			document.body.removeChild(this.domNode);
		}
		
	}
	
);
