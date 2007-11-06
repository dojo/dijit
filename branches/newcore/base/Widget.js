dojo.provide("dijit.base.Widget");

dojo.require("dijit.util.manager");

dojo.declare("dijit.base.Widget", null,
function(params, srcNodeRef){
		// summary:
		//		To understand the process by which widgets are instantiated, it
		//		is critical to understand what other methods the constructor calls and
		//		which of them you'll want to over-ride. Of course, adventurous
		//		developers could over-ride the constructor entirely, but this should
		//		only be done as a last resort.
		//
		//		Below is a list of the methods that are called, in the order
		//		they are fired, along with notes about what they do and if/when
		//		you should over-ride them in your widget:
		//			
		//			postMixInProperties:
		//				a stub function that you can over-ride to modify
		//				variables that may have been naively assigned by
		//				mixInProperties
		//			# widget is added to manager object here
		//			buildRendering
		//				Subclasses use this method to handle all UI initialization
		//				Sets this.domNode.  Templated widgets do this automatically
		//				and otherwise it just uses the source dom node. 
		//			postCreate
		//				a stub function that you can over-ride to modify take
		//				actions once the widget has been placed in the UI
		// store pointer to original dom tree
		this.srcNodeRef = dojo.byId(srcNodeRef);

		//mixin our passed parameters
		if(params){
			dojo.mixin(this,params);
		}

		//console.profile(this.widgetType + " create");
		// console.debug(this.widgetType, "create");

		// console.debug(this.widgetType, "-> postMixInProperties");
		//console.profile(this.widgetType + " postMixInProperties");
		this.postMixInProperties();
		//console.profileEnd(this.widgetType + " postMixInProperties");

		// console.debug(this.widgetType, "-> dojo.widget.manager.add");
		dijit.util.manager.add(this);

		// console.debug(this.widgetType, "-> buildRendering");
		//console.profile(this.widgetType + " buildRendering");
		this.buildRendering();
		//console.profileEnd(this.widgetType + " buildRendering");

		this.domNode.widgetId = this.id;

		// console.debug(this.widgetType, "-> postCreate");
		//console.profile(this.widgetType + " postCreate");
		this.postCreate();
		//console.profileEnd(this.widgetType + " postCreate");

		// console.debug(this.widgetType, "done!");
		
		//console.profileEnd(this.widgetType + " create");

},
{
	// id: String
	//		a unique, opaque ID string that can be assigned by users or by the
	//		system. If the developer passes an ID which is known not to be
	//		unique, the specified ID is ignored and the system-generated ID is
	//		used instead.
	id: "",

	// lang: String
	//	Language to display this widget in (like en-us).
	//	Defaults to brower's specified preferred language (typically the language of the OS)
	lang: "",

	// srcNodeRef: DomNode
	//		pointer to original dom node
	srcNodeRef: null,

	// domNode DomNode:
	//		this is our visible representation of the widget! Other DOM
	//		Nodes may by assigned to other properties, usually through the
	//		template system's dojoAttachPonit syntax, but the domNode
	//		property is the canonical "top level" node in widget UI.
	domNode: null, 

	//////////// INITIALIZATION METHODS ///////////////////////////////////////

	postMixInProperties: function(){
		// summary
		//	Called after the parameters to the widget have been read-in,
		//	but before the widget template is instantiated.
		//	Especially useful to set properties that are referenced in the widget template.

		if(this.lang === ""){this.lang = null;}
	},

	buildRendering: function(){
		// summary:
		//		Construct the UI for this widget, setting this.domNode.
		//		Most widgets will mixin TemplatedWidget, which overrides this method.
		this.domNode = this.srcNodeRef;
	},

	postCreate: function(){
		// summary:
		//		Called after a widget's dom has been setup
	},

	//////////// DESTROY FUNCTIONS ////////////////////////////////

	destroy: function(/*Boolean*/ finalize){
		// summary:
		// 		Destroy this widget and it's descendants. This is the generic
		// 		"destructor" function that all widget users should call to
		// 		cleanly discard with a widget. Once a widget is destroyed, it's
		// 		removed from the manager object.
		// finalize: Boolean
		//		is this function being called part of global environment
		//		tear-down?

		this.destroyDescendants();
		this._destroy();
	},
	
	_destroy: function(/*Boolean*/ finalize){
		// summary:
		// 		Destroy this widget
		// finalize: Boolean
		//		is this function being called part of global environment
		//		tear-down?
		this.uninitialize();
		this.destroyRendering(finalize);
		dijit.util.manager.remove(this.id);
	},

	destroyRendering: function(/*Boolean*/ finalize){
		try{
			if(this.bgIframe){
				this.bgIframe.remove();
				delete this.bgIframe;
			}
			if(!finalize && this.domNode){
//PORT FIXME				dojo.event.browser.clean(this.domNode);
			}
		}catch(e){ /* squelch! */ }
		try{
//			dojo.dom.destroyNode(this.domNode);
//PORT memory leak?
			this.domNode.parentNode.removeChild(this.domNode);
			delete this.domNode;
		}catch(e){ /* squelch! */ }
		if(this.srcNodeRef){
			try{
//				dojo.dom.destroyNode(this._sourceNodeRef);
//PORT memory leak?
				this._sourceNodeRef.parentNode.removeChild(this._sourceNodeRef);
			}catch(e){ /* squelch! */ }
		}
	},

	destroyDescendants: function(){
		// summary:
		//		Recursively destroy the children of this widget and their
		//		descendents.

		dojo.forEach(this.getDescendants(), function(widget){
			widget._destroy();
		});
	},

	uninitialize: function(){
		// summary: 
		//		stub function. Over-ride to implement custom widget tear-down
		//		behavior.
		return false;
	},

	////////////////// MISCELLANEOUS METHODS ///////////////////
	
	toString: function(){
		// summary:
		//		returns a string that represents the widget. When a widget is
		//		cast to a string, this method will be used to generate the
		//		output. Currently, it does not implement any sort of reversable
		//		serialization.
		return '[Widget ' + this.declaredClass + ', ' + (this.id || 'NO ID') + ']'; // String
	},

	getDescendants: function(){
		// summary:
		//	return all the descendent widgets
		var allNodes = this.domNode.all || this.domNode.getElementsByTagName("*");
		var i=0, node;
		var nodes = [];
		while((node = allNodes[i++])){
			var id = node.widgetId;
			if(id){
				nodes.push(dijit.byId(id));
			}
		}
		return nodes;
	}
});

//PORT - where does this go?  dijit.util?  dojo.html?
dijit._disableSelection = function(/*DomNode*/element){
	// summary: disable selection on a node
	element = dojo.byId(element)||dojo.body();

	if(dojo.isMozilla){
		element.style.MozUserSelect = "none";
	}else if(dojo.isKhtml){
		element.style.KhtmlUserSelect = "none"; 
	}else if(h.ie){
		element.unselectable = "on";
	}
	return false;
};