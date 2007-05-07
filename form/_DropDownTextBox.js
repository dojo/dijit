dojo.provide("dijit.form._DropDownTextBox");

dojo.require("dijit.util.PopupManager");
dojo.require("dijit.util.wai");
dojo.require("dijit.base.Widget");
//dojo.require("dijit.form.ValidationTextbox");

dojo.declare(
			"dijit.form._DropDownTextBox",
	null,
{
		// summary:
		//		Text box with drop down
	templatePath: dojo.moduleUrl("dijit.form", "templates/AutoCompleter.html"),
	// link to the master popup widget
	popupWidget:null,
	// the actual node to pop up
	optionsListNode:null,
	// how many items to display
	visibleCount:1,
	_arrowPressed: function(){
		if(this.disabled) return;
		dojo.addClass(this.downArrowNode, "dojoArrowButtonPushed");
	},

	_arrowIdle: function(){
		if(this.disabled) return;
		if(this.popupWidget.aroundwidget!=this){
			dojo.removeClass(this.downArrowNode, "dojoArrowButtonPushed");
		}
	},
	arrowClicked: function(){
		
			// summary: callback when arrow is clicked
			if(this.disabled) return;
			this.focus();
			if(this.popupWidget.isShowingNow){
				this._hideResultList();
			}else{
					// forces full population of results, if they click
					// on the arrow it means they want to see more options
				this._openResultList();
			}
	},
	postCreate:function(){
		this.popupWidget=dijit.form._DropDownTextBox.MasterPopup;
		// create the popup
		this.optionsListNode=document.createElement('div');
		dojo.addClass(this.optionsListNode, 'dojoMenu');
		this.optionsListNode.setAttribute("tabindex", -1);
		this.optionsListNode.style.display = "none";
		this.optionsListNode.style.position="absolute";
		this.optionsListNode.style.overflow="scroll";
		//dijit.form._DropDownTextBox.superclass.postCreate.apply(this, arguments);
	},
	_clearResultList: function(){
		// detach instead of delete
		if(this.optionsListNode.innerHTML){
			this.optionsListNode.innerHTML = "";  // browser natively knows how to collect this memory
		}
	},
	
	_hideResultList: function(){
		this.popupWidget.close(this);
		this._arrowIdle();
		//this._clearResultList();
	},
	_openResultList:function(){
		// summary:
		// any code that needs to happen before the popup appears
		// creating the optionsListNode contents etc.
		this._showResultList();
	},
	onblur:function(){
			// removeClass dojoInputFieldFocused
		dojo.removeClass(this.nodeWithBorder, "dojoInputFieldFocused");
		if(!this.popupWidget.isShowingNow)	this.setValue(this.getValue());
		// sometimes the tooltip gets stuck; confused by dropdown
		dijit.MasterTooltip.hide();
	},
	onkeypress:function() {
		
	},
	focus: function(){
		try{
			this.textbox.focus();
		}catch (e){
				// element isn't focusable if disabled, or not visible etc - not easy to test for.
		};
	},
	_showResultList: function(){
			// Our dear friend IE doesnt take max-height so we need to calculate that on our own every time
 		
		// optionsListNode could either be a widget or a node
		// if it is a widget, it will have a domNode
		// otherwise, it will have children
		var childs = this.optionsListNode.domNode ? [this.optionsListNode.domNode]: this.optionsListNode.childNodes;
		this.popupWidget.open(this.optionsListNode.domNode ? this.optionsListNode.domNode : this.optionsListNode, this);
		if(childs.length){
				var visibleCount = Math.min(childs.length,this.maxListLength);
				with(this.optionsListNode.domNode ? this.optionsListNode.domNode.style : this.optionsListNode.style)
				{
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
					width = childs[0].width+"px";
				}
				
			}
			else{
				this._hideResultList();
			}
	
	}
});
dojo.declare(
			"dijit.form._DropDownTextBox.Popup",
	dijit.base.Widget,
{
	// summary:
	//	prevents onBlur timers from accidentally closing another widget's popup, or upsetting PopupManager

	isShowingNow:false,
	aroundWidget:null,
	open:function(/*Node*/ optionsListNode, /*Widget*/ aroundWidget){
		// summary: open node optionsListNode around widget aroundwidget
		if(!this.isShowingNow){
			aroundWidget._arrowPressed();
			document.body.appendChild(optionsListNode);
			this.aroundWidget=aroundWidget;
			// trickery for popupmanager
			this.domNode=optionsListNode;
			this.isShowingNow=true;
			setTimeout(dojo.hitch(this, "_open"), 10);
			//this._open();
		}
	},
	_open:function() {
		dijit.util.PopupManager.openAround(this.aroundWidget.textbox, this,{'BL':'TL', 'TL':'BL'}, [0,0]);
	},
	close:function(/*[Widget || Boolean]*/ aroundWidget){
		// summary: close popup belonging to aroundWidget
		if(this.isShowingNow) {
			// did PopupManager initiate the close?
			// if not, call close through PopupManager
			if(this.aroundWidget==aroundWidget) {
				try {
					dijit.util.PopupManager.close();
				}
				catch(e) {
					// Popup already closed; a blur event is calling this close
					// call close manually to clean up
					this.close(true);
				}
			}
			// if PopupManager calls close, aroundWidget is a boolean
			// then it is ok to clean up
			else if(this.isShowingNow&&typeof(aroundWidget)=="boolean") {
				
				this.isShowingNow=false;
				// detach optionsListNode in case it is a widget
				document.body.removeChild(this.domNode);
				this.domNode=null;
				this.aroundwidget=null;
			}
		}
	},
	processKey:function(/*Event*/ e){
			// required by PopupManager
			// PopupManager eats the user input otherwise
		return false;
	}
}

);
dojo.addOnLoad(function(){
	if(!dijit.form._DropDownTextBox.MasterPopup){	
		dijit.form._DropDownTextBox.MasterPopup=new dijit.form._DropDownTextBox.Popup(null, document.createElement('div'));
	}
});