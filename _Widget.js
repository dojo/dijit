dojo.provide("dijit._Widget");

dojo.require("dijit.util.manager");

dojo.declare("dijit._Widget", null,
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

	// for garbage collection
	this._connects=[];

	//mixin our passed parameters
	if(this.srcNodeRef && (typeof this.srcNodeRef.id == "string")){ this.id = this.srcNodeRef.id; }
	if(params){
		dojo.mixin(this,params);
	}

	this.postMixInProperties();
	dijit.util.manager.add(this);
	this.buildRendering();
	if(this.domNode){
		this.domNode.setAttribute("widgetId", this.id);
		if(this.srcNodeRef && this.srcNodeRef.dir){
			this.domNode.dir = this.srcNodeRef.dir;
		}
	}
	this.postCreate();

	// If srcNodeRef has been processed and removed from the DOM (e.g. TemplatedWidget) then delete it to allow GC.
	if(this.srcNodeRef && !this.srcNodeRef.parentNode){
		delete this.srcNodeRef;
	}
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

	// dir: String
	//  Bi-directional support, as defined by the HTML DIR attribute. Either left-to-right "ltr" or right-to-left "rtl".
	dir: "",

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

	startup: function(){
		// summary:
		//		Called after a widget's children, and other widgets on the page, have been created.
		//		Provides an opportunity to manipulate any children before they are displayed
		//		This is useful for composite widgets that need to control or layout sub-widgets
		//		Many layout widgets can use this as a wiring phase
	},

	//////////// DESTROY FUNCTIONS ////////////////////////////////

	destroyRecursive: function(/*Boolean*/ finalize){
		// summary:
		// 		Destroy this widget and it's descendants. This is the generic
		// 		"destructor" function that all widget users should call to
		// 		cleanly discard with a widget. Once a widget is destroyed, it's
		// 		removed from the manager object.
		// finalize: Boolean
		//		is this function being called part of global environment
		//		tear-down?

		this.destroyDescendants();
		this.destroy();
	},

	destroy: function(/*Boolean*/ finalize){
		// summary:
		// 		Destroy this widget, but not its descendents
		// finalize: Boolean
		//		is this function being called part of global environment
		//		tear-down?
		this.uninitialize();
		dojo.forEach(this._connects, dojo.disconnect);
		this.destroyRendering(finalize);
		dijit.util.manager.remove(this.id);
	},

	destroyRendering: function(/*Boolean*/ finalize){
		// summary:
		//		Destroys the DOM nodes associated with this widget
		// finalize: Boolean
		//		is this function being called part of global environment
		//		tear-down?

		if(this.bgIframe){
			this.bgIframe.remove();
			delete this.bgIframe;
		}

		if(this.domNode){
			//			dojo.dom.destroyNode(this.domNode);
			//PORT #2931
			if(this.domNode.parentNode){
				this.domNode.parentNode.removeChild(this.domNode);
			}
			delete this.domNode;
		}

		if(this.srcNodeRef && this.srcNodeRef.parentNode){
//			dojo.dom.destroyNode(this.srcNodeRef);
//PORT #2931
			this.srcNodeRef.parentNode.removeChild(this.srcNodeRef);
			delete this.srcNodeRef;
		}
	},

	destroyDescendants: function(){
		// summary:
		//		Recursively destroy the children of this widget and their
		//		descendants.

		// TODO: should I destroy in the reverse order, to go bottom up?
		dojo.forEach(this.getDescendants(), function(widget){ widget.destroy(); });
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
		var list = dojo.query('[widgetId]', this.domNode);
		return list.map(dijit.util.manager.byNode);		// Array
	},

	connect: function(
			/*Object|null*/ obj,
			/*String*/ event,
			/*String|Function*/ method){

		// summary:
		//		Connects specified obj/event to specified method of this object
		//		and registers for disconnect() on widget destroy.
		//		Similar to dojo.connect() but takes three arguments rather than four.
		var handle=dojo.connect(obj, event, this, method);
		this._connects.push(handle);
		// return handle for FormElement and ComboBox
		return handle;
	},

	disconnect: function(/*Object*/ handle){
		// summary:
		//		Disconnects handle created by this.connect.
		//		Also removes handle from this widget's list of connects
		for(var i=0; i<this._connects.length; i++){
			if(this._connects[i]==handle){
				dojo.disconnect(handle);
				this._connects.splice(i, 1);
				return;
			}
		}
	},

	isLeftToRight: function(){
		// summary:
		//		Checks the DOM to for the text direction for bi-directional support
		//		See HTML spec, DIR attribute for more information.

		if(typeof this._ltr == "undefined"){
			this._ltr = (this.dir || dojo.getComputedStyle(this.domNode).direction) != "rtl";
		}
		return this._ltr; //Boolean
	}
});

//PORT - where does this go?  dijit.util?  dojo.html?
dijit._disableSelection = function(/*DomNode*/element){
	// summary: disable selection on a node

	if(dojo.isMozilla){
		element.style.MozUserSelect = "none";
	}else if(dojo.isKhtml){
		element.style.KhtmlUserSelect = "none";
	}else if(dojo.isIE){
		element.unselectable = "on";
	}
	//FIXME: else?  Opera?
};
