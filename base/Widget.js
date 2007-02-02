dojo.provide("dijit.base.Widget");

dojo.require("dojo.lang.common");
dojo.require("dojo.lang.declare");
dojo.require("dojo.event.browser");

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
			dojo.lang.mixin(this,params);
		}

		//dojo.profile.start(this.widgetType + " create");
		// dojo.debug(this.widgetType, "create");

		// dojo.debug(this.widgetType, "-> postMixInProperties");
		//dojo.profile.start(this.widgetType + " postMixInProperties");
		this.postMixInProperties();
		//dojo.profile.end(this.widgetType + " postMixInProperties");

		// dojo.debug(this.widgetType, "-> dojo.widget.manager.add");
		dijit.util.manager.add(this);

		// dojo.debug(this.widgetType, "-> buildRendering");
		//dojo.profile.start(this.widgetType + " buildRendering");
		this.buildRendering();
		//dojo.profile.end(this.widgetType + " buildRendering");

		this.domNode.widgetId = this.id;

		// dojo.debug(this.widgetType, "-> postCreate");
		//dojo.profile.start(this.widgetType + " postCreate");
		this.postCreate();
		//dojo.profile.end(this.widgetType + " postCreate");

		// dojo.debug(this.widgetType, "done!");
		
		//dojo.profile.end(this.widgetType + " create");

},
{
	// id: String
	//		a unique, opaque ID string that can be assigned by users or by the
	//		system. If the developer passes an ID which is known not to be
	//		unique, the specified ID is ignored and the system-generated ID is
	//		used instead.
	id: "",

	// class: String
	//		This CSS class name will be used as the base name for various nodes inside
	//		the widget.  For example, if the class name is "dojoTitlePane" then there
	//		might be two dom nodes, labeled as "dojoTitlePaneCaption" and "dojoTitlePaneContent"
	// TODO: probably will be replaced by theme and/or dropped altogether
	"class": "",

	// lang: String
	//	Language to display this widget in (like en-us).
	//	Defaults to brower's specified preferred language (typically the language of the OS)
	lang: "",

	// parent: Widget
	//		If this widget is contained by a container widget, pointer to that widget
	//	TODO: replace with getParent() function?
	parent: null,

	// widgetType: String
	//		name of the widget, such as "Button" or "Combobox"
	widgetType: "Widget",

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

	destroy: function(finalize){
		// summary:
		// 		Destroy this widget and it's descendants. This is the generic
		// 		"destructor" function that all widget users should call to
		// 		cleanly discard with a widget. Once a widget is destroyed, it's
		// 		removed from the manager object.
		// finalize: Boolean
		//		is this function being called part of global environment
		//		tear-down?

		this.destroyChildren();
		this.uninitialize();
		this.destroyRendering(finalize);
		dijit.util.manager.removeById(this.id);
	},

	destroyRendering: function(/*Boolean*/ finalize){
		try{
			if(this.bgIframe){
				this.bgIframe.remove();
				delete this.bgIframe;
			}
			if(!finalize && this.domNode){
				dojo.event.browser.clean(this.domNode);
			}
			dojo.widget.HtmlWidget.superclass.destroyRendering.call(this);
		}catch(e){ /* squelch! */ }
		try{
			dojo.dom.destroyNode(this.domNode);
			delete this.domNode;
		}catch(e){ /* squelch! */ }
		if(this.srcNodeRef){
			try{
				dojo.dom.destroyNode(this._sourceNodeRef);
			}catch(e){ /* squelch! */ }
		}
	},
	
	destroyChildren: function(){
		// summary:
		//		Recursively destroy the children of this widget and their
		//		descendents.
		//	TODO: we don't know who are children are anymore
		var widget;
		var i=0;
		while(this.children.length > i){
			widget = this.children[i];
			if (widget instanceof dojo.widget.Widget) { // find first widget
				this.removeChild(widget);
				widget.destroy();
				continue;
			}
			
			i++; // skip data object
		}
				
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

	////////////////// PARENT/CHILD METHODS ///////////////////
	// TODO: all of these are broken, and maybe should be removed anyway
	getChildrenOfType: function(/*String*/type, recurse){
		// summary: 
		//		return an array of descendant widgets who match the passed type
		// recurse: Boolean
		//		should we try to get all descendants that match? Defaults to
		//		false.
		var ret = [];
		var isFunc = dojo.lang.isFunction(type);
		if(!isFunc){
			type = type.toLowerCase();
		}
		for(var x=0; x<this.children.length; x++){
			if(isFunc){
				if(this.children[x] instanceof type){
					ret.push(this.children[x]);
				}
			}else{
				if(this.children[x].widgetType.toLowerCase() == type){
					ret.push(this.children[x]);
				}
			}
			if(recurse){
				ret = ret.concat(this.children[x].getChildrenOfType(type, recurse));
			}
		}
		return ret; // Array
	},

	getDescendants: function(){
		// returns: a flattened array of all direct descendants including self
		var result = [];
		var stack = [this];
		var elem;
		while ((elem = stack.pop())){
			result.push(elem);
			// a child may be data object without children field set (not widget)
			if (elem.children) {
				dojo.lang.forEach(elem.children, function(elem) { stack.push(elem); });
			}
		}
		return result; // Array
	},

	getPreviousSibling: function(){
		// summary:
		//		returns null if this is the first child of the parent,
		//		otherwise returns the next sibling to the "left".
		var idx = this.getParentIndex();
 
		 // first node is idx=0 not found is idx<0
		if (idx<=0) return null;
 
		return this.parent.children[idx-1]; // Widget
	},
 
	getSiblings: function(){
		// summary: gets an array of all children of our parent, including "this"
		return this.parent.children; // Array
	},
 

	getNextSibling: function(){
		// summary:
		//		returns null if this is the last child of the parent,
		//		otherwise returns the next sibling to the "right".
 
		var idx = this.getParentIndex();
 
		if (idx == this.parent.children.length-1){return null;} // last node
		if (idx < 0){return null;} // not found
 
		return this.parent.children[idx+1]; // Widget
	}
});
