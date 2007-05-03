dojo.provide("dijit.form._DropDownTextBox");

dojo.require("dijit.base.FormElement");
dojo.require("dijit.util.PopupManager");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.util.wai");

dojo.declare(
			"dijit.form._DropDownTextBox",
	[dijit.base.FormElement, dijit.base.TemplatedWidget],
{
		// summary:
		//		Text box with drop down
	templatePath: dojo.moduleUrl("dijit.form", "templates/AutoCompleter.html"),
	_arrowPressed: function(){
		dojo.addClass(this.downArrowNode, "dojoArrowButtonPushed");
	},

	_arrowIdle: function(){
		if(!this.popupWidget.autocompleter!=this){
			dojo.removeClass(this.downArrowNode, "dojoArrowButtonPushed");
		}
	},
	arrowClicked: function(){
			// summary: callback when arrow is clicked
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
		this.optionsListNode=document.createElement('div');
		/*dojo.connect(this.downArrowNode, "onmousedown", this, "_arrowPressed");
		dojo.connect(this.downArrowNode, "onmouseout", this, "_arrowIdle");
		dojo.connect(this.downArrowNode, "onmouseup", this, "arrowClicked");*/
	},
	_clearResultList: function(){
		if(this.optionsListNode.innerHTML){
			this.optionsListNode.innerHTML = "";  // browser natively knows how to collect this memory
		}
	},

	_hideResultList: function(){
		
			this._arrowIdle();
			this.popupWidget.close(this);
		
		
	},
});
dojo.declare(
			"dijit.form._DropDownTextBox.Popup",
	[dijit.base.FormElement, dijit.base.TemplatedWidget],
{
	templateString: "<div></div>",
	isShowingNow:false,
	autocompleter:null,
	open:function(/*Node*/ optionsListNode, /*Widget*/ autocompleter){
		this.autocompleter=autocompleter;
		this.isShowingNow=true;
		while(this.domNode.firstChild){
			this.domNode.removeChild(this.domNode.firstChild);
		}
		this.domNode.appendChild(optionsListNode);
		//var coord = dojo.html.abs(autocompleter.domNode, true);
			//dijit.util.PopupManager.open({pageX:coord.x, pageY:coord.y, target:autocompleter.domNode}, this, [0, 0]);
		dijit.util.PopupManager.openAround(autocompleter.domNode, this,{'BL':'TL', 'TL':'BL'}, [0,0]);
	},
	close:function(/*Widget*/ autocompleter){
		if(!this.isShowingNow||this.autocompleter!=autocompleter){ return; }
		
			this.isShowingNow=false;
			dijit.util.PopupManager.close();
		
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
		var popup=document.createElement("div");
		document.body.appendChild(popup);
	
		dijit.form._DropDownTextBox.MasterPopup=new dijit.form._DropDownTextBox.Popup(null, popup);
	
		with(dijit.form._DropDownTextBox.MasterPopup.domNode){
			setAttribute("tabindex", -1);
			style.display = "none";
			style.position="absolute";
		}
	}
});