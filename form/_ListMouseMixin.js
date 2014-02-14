define([
	"dojo/_base/declare", // declare
	"dojo/_base/event", // event.stop
	"dojo/touch",
	"./_ListBase"
], function(declare, event, touch, _ListBase){

/*=====
var _ListBase = dijit.form._ListBase;
=====*/

// module:
//		dijit/form/_ListMouseMixin
// summary:
//		a mixin to handle mouse or touch events for a focus-less menu

return declare( "dijit.form._ListMouseMixin", _ListBase, {
	// summary:
	//		a Mixin to handle mouse or touch events for a focus-less menu
	//		Abstract methods that must be defined externally:
	//			onClick: item was chosen (mousedown somewhere on the menu and mouseup somewhere on the menu)
	// tags:
	//		private

	postCreate: function(){
		this.inherited(arguments);
		this.connect(this.domNode, "onclick", function(evt){ this._onClick(evt, this._getTarget(evt)); });
		this.connect(this.domNode, "onmousedown", "_onMouseDown");
		this.connect(this.domNode, "onmouseup", "_onMouseUp");
		this.connect(this.domNode, "onmouseover", "_onMouseOver");
		this.connect(this.domNode, "onmouseout", "_onMouseOut");
	},

	_onClick: function(/*Event*/ evt, /*DomNode*/ target){
		this._setSelectedAttr(target);
		if(this._deferredClick){
			this._deferredClick.remove();
		}
		this._deferredClick = this.defer(function(){
			this._deferredClick = null;
			this.onClick(target);
		});
	},

	_onMouseDown: function(/*Event*/ evt){
		if(!/^touch/.test(evt.type)){
			event.stop(evt);
		}
		if(this._hoveredNode){
			this.onUnhover(this._hoveredNode);
			this._hoveredNode = null;
		}
		this._isDragging = true;
		this._setSelectedAttr(this._getTarget(evt));
	},

	_onMouseUp: function(/*Event*/ evt){
		if(!/^touch/.test(evt.type)){
			event.stop(evt);
		}
		this._isDragging = false;
		var selectedNode = this._getSelectedAttr();
		var target = this._getTarget(evt);
		var hoveredNode = this._hoveredNode;
		if(selectedNode && target == selectedNode){
			this.defer(function(){ this._onClick(evt, selectedNode); });
		}else if(hoveredNode){ // drag to select
			this.defer(function(){ this._onClick(evt, hoveredNode); });
		}
	},

	_onMouseOut: function(/*Event*/ /*===== evt ====*/){
		if(this._hoveredNode){
			this.onUnhover(this._hoveredNode);
			if(this._getSelectedAttr() == this._hoveredNode){
				this.onSelect(this._hoveredNode);
			}
			this._hoveredNode = null;
		}
		if(this._isDragging){
			this._cancelDrag = (new Date()).getTime() + 1000; // cancel in 1 second if no _onMouseOver fires
		}
	},

	_onMouseOver: function(/*Event*/ evt){
		if(this._cancelDrag){
			var time = (new Date()).getTime();
			if(time > this._cancelDrag){
				this._isDragging = false;
			}
			this._cancelDrag = null;
		}
		var node = this._getTarget(evt);
		if(!node){ return; }
		if(this._hoveredNode != node){
			if(this._hoveredNode){
				this._onMouseOut({ target: this._hoveredNode });
			}
			if(node && node.parentNode == this.containerNode){
				if(this._isDragging){
					this._setSelectedAttr(node);
				}else{
					this._hoveredNode = node;
					this.onHover(node);
				}
			}
		}
	}
});

});
