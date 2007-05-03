
dojo.provide("dijit._tree.Listener");

dojo.declare(
	"dijit._tree.Listener",
	null,
{
	// summary:
	//		Mixin for all classes that listen to and respond to tree events
	// TODO: should this be in base/?  Maybe other widgets like PageContainer would use it?
	
	// listenTreeEvents: String[]
	//		List of events that you want to listen to, for each tree
	listenTreeEvents: [],

	// listenTrees: String[]
	//		List of trees that you want to listen to
	listenTrees: [],

	// set of trees we are currently listening to
	_listenedTrees: {},

	listenTree: function(/* String */ treeId) {
		// summary:
		//		For published events from specified tree,
		//		call handlers in this widget.
		
		var _this = this;
		
		if (this._listenedTrees[treeId]) {
			return; // already listening
		}
		
		dojo.lang.forEach(this.listenTreeEvents, function(event) {
			var eventHandler =  "on" + event.charAt(0).toUpperCase() + event.substr(1);
			dojo.event.topic.subscribe(treeId+"/"+event, _this, eventHandler);
		});
		
		/**
		 * remember that I listen to this tree. No unbinding/binding/deselection
		 * needed when transfer between listened trees
		 */
		this._listenedTrees[treeId] = true;
		
	},			
	
	unlistenTree: function(/* String */ treeId) {
		
		// summary:
		//		Stop listening to events from specified tree

		var _this = this;
	
		if (!this._listenedTrees[treeId]) {
			return; 
		}
		
		dojo.lang.forEach(this.listenTreeEvents, function(event) {
			var eventHandler =  "on" + event.charAt(0).toUpperCase() + event.substr(1);
			dojo.event.topic.unsubscribe(treeId+"/"+event, _this, eventHandler);
		});
		
		delete this._listenedTrees[treeId];
	}
});
