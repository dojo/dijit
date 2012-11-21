define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom-attr", // domAttr.set
	"dojo/_base/event", // event.stop
	"dojo/keys", // keys.END keys.HOME, keys.LEFT_ARROW etc.
	"dojo/_base/lang", // lang.hitch
	"dojo/on"
], function(array, declare, domAttr, event, keys, lang, on){

	// module:
	//		dijit/_KeyNavMixin

	return declare("dijit._KeyNavMixin", null, {
		// summary:
		//		A mixin to allow arrow key and letter key navigation of child or descendant widgets.
		//		It can be used by dijit/_Container based widgets with a flat list of children,
		//		or more complex widgets like dijit/Tree.
		//
		//		To use this mixin, the subclass must:
		//
		//			- Implement  focusFirstChild(), focusLastChild(), _onLeftArrow(), _onRightArrow()
		//			  _onDownArrow(), _onUpArrow() methods to handle home/end/left/right/up/down keystrokes.
		//			- Implement _getNextFocusableChild() to find the next or previous child relative to a current child.
		//			  Next and previous in this context refer to a linear ordering of the children or descendants used
		//			  by letter key search.
		//			- tabIndex
		//				- set all descendants' initial tabIndex to "-1"; both initial descendants and any
		//				  descendants added later, by for example addChild()
		//				- when a descendant is focused, set its tabIndex to this.tabIndex, and set this.focusedChild
		//				- when a descendant is blurred, set it's tabIndex back to "-1", and clear
		//
		//		Also, child widgets must implement a focus() method.

		// Possible TODO's:
		//		- set a selector to identify focusable children (ex: .dijitTreeNode); for plain _Container widgets
		//		  it would be "> *".
		//		- track child widget or child node focus/blur events and update this.focusedChild accordingly
		//		- instead of using this.focusedChild, infer it from evt.target
		//

/*=====
		// focusedChild: [protected] Widget
		//		The currently focused child widget, or null if there isn't one
		focusedChild: null,

		// _keyNavCodes: Object
		//		Hash mapping key code (arrow keys and home/end key) to functions to handle those keys.
		//		Usually not used directly, as subclasses can instead override _onLeftArrow() etc.
 		_keyNavCodes: {},
=====*/

		// tabIndex: String
		//		Tab index of the container; same as HTML tabIndex attribute.
		//		Note then when user tabs into the container, focus is immediately
		//		moved to the first item in the container.
		tabIndex: "0",

		postCreate: function(){
			this.inherited(arguments);

			if(!this._keyNavCodes){
				var keyCodes = this._keyNavCodes = {};
				keyCodes[keys.HOME] = lang.hitch(this, "focusFirstChild");
				keyCodes[keys.END] = lang.hitch(this, "focusLastChild");
				keyCodes[this.isLeftToRight() ? keys.LEFT_ARROW : keys.RIGHT_ARROW] = lang.hitch(this, "_onLeftArrow");
				keyCodes[this.isLeftToRight() ? keys.RIGHT_ARROW : keys.LEFT_ARROW] = lang.hitch(this, "_onRightArrow");
				keyCodes[keys.UP_ARROW] = lang.hitch(this, "_onUpArrow");
				keyCodes[keys.DOWN_ARROW] = lang.hitch(this, "_onDownArrow");
			}

			this.own(
				on(this.domNode, "keypress", lang.hitch(this, "_onContainerKeypress")),
				on(this.domNode, "keydown", lang.hitch(this, "_onContainerKeydown")),
				on(this.domNode, "focus", lang.hitch(this, "_onContainerFocus"))
			);
		},

		_onLeftArrow: function(){
			// summary:
			//		Called on left arrow key, or right arrow key if widget is in RTL mode.
			//		Should go back to the previous child in horizontal container widgets like Toolbar.
			// tags:
			//		extension
		},

		_onRightArrow: function(){
			// summary:
			//		Called on right arrow key, or left arrow key if widget is in RTL mode.
			//		Should go to the next child in horizontal container widgets like Toolbar.
			// tags:
			//		extension
		},

		_onUpArrow: function(){
			// summary:
			//		Called on up arrow key. Should go to the previous child in vertical container widgets like Menu.
			// tags:
			//		extension
		},

		_onDownArrow: function(){
			// summary:
			//		Called on down arrow key. Should go to the next child in vertical container widgets like Menu.
			// tags:
			//		extension
		},

		focus: function(){
			// summary:
			//		Default focus() implementation: focus the first child.
			this.focusFirstChild();
		},

		focusFirstChild: function(){
			// summary:
			//		Focus the first focusable child in the container.
			// tags:
			//		abstract extension
		},

		focusLastChild: function(){
			// summary:
			//		Focus the last focusable child in the container.
			// tags:
			//		abstract extension
		},

		focusNext: function(){
			// summary:
			//		Focus the next widget
			// tags:
			//		protected
			this.focusChild(this._getNextFocusableChild(this.focusedChild, 1));
		},

		focusPrev: function(){
			// summary:
			//		Focus the last focusable node in the previous widget
			//		(ex: go to the ComboButton icon section rather than button section)
			// tags:
			//		protected
			this.focusChild(this._getNextFocusableChild(this.focusedChild, -1), true);
		},

		focusChild: function(/*dijit/_WidgetBase*/ widget, /*Boolean*/ last){
			// summary:
			//		Focus specified child widget.
			// widget:
			//		Reference to container's child widget
			// last:
			//		If true and if widget has multiple focusable nodes, focus the
			//		last one instead of the first one
			// tags:
			//		protected

			if(!widget){ return; }

			if(this.focusedChild && widget !== this.focusedChild){
				this._onChildBlur(this.focusedChild);	// used by _MenuBase
			}
			widget.set("tabIndex", this.tabIndex);	// for IE focus outline to appear, must set tabIndex before focus
			widget.focus(last ? "end" : "start");
			this._set("focusedChild", widget);
		},

		_onContainerFocus: function(evt){
			// summary:
			//		Handler for when the container itself gets focus.
			// description:
			//		Initially the container itself has a tabIndex, but when it gets
			//		focus, switch focus to first child...
			// tags:
			//		private

			// Note that we can't use _onFocus() because switching focus from the
			// _onFocus() handler confuses the focus.js code
			// (because it causes _onFocusNode() to be called recursively).
			// Also, _onFocus() would fire when focus went directly to a child widget due to mouse click.

			// Ignore spurious focus events:
			//	1. focus on a child widget bubbles on FF
			//	2. on IE, clicking the scrollbar of a select dropdown moves focus from the focused child item to me
			if(evt.target !== this.domNode || this.focusedChild){ return; }

			this.focusFirstChild();
		},

		_onFocus: function(){
			// When the container gets focus by being tabbed into, or a descendant gets focus by being clicked,
			// set the container's tabIndex to -1 (don't remove as that breaks Safari 4) so that tab or shift-tab
			// will go to the fields after/before the container, rather than the container itself
			domAttr.set(this.domNode, "tabIndex", "-1");

			this.inherited(arguments);
		},

		_onBlur: function(evt){
			// When focus is moved away the container, and its descendant (popup) widgets,
			// then restore the container's tabIndex so that user can tab to it again.
			// Note that using _onBlur() so that this doesn't happen when focus is shifted
			// to one of my child widgets (typically a popup)
			domAttr.set(this.domNode, "tabIndex", this.tabIndex);
			if(this.focusedChild){
				this.focusedChild.set("tabIndex", "-1");
				this._set("focusedChild", null);
			}
			this.inherited(arguments);
		},

		_searchString: "",
		// multiCharSearchDuration: Number
		//		If multiple characters are typed where each keystroke happens within
		//		multiCharSearchDuration of the previous keystroke,
		//		search for nodes matching all the keystrokes.
		//
		//		For example, typing "ab" will search for entries starting with
		//		"ab" unless the delay between "a" and "b" is greater than multiCharSearchDuration.
		multiCharSearchDuration: 1000,

		onKeyboardSearch: function(/*dijit/_WidgetBase*/ item, /*Event*/ evt, /*String*/ searchString, /*Number*/ numMatches){
			// summary:
			//		When a key is pressed that matches a child item,
			//		this method is called so that a widget can take appropriate action is necessary.
			// tags:
			//		protected
			if(item){
				this.focusChild(item);
			}
		},

		_keyboardSearchCompare: function(/*dijit/_WidgetBase*/ item, /*String*/ searchString){
			// summary:
			//		Compares the searchString to the widget's text label, returning:
			//
			//			* -1: a high priority match  and stop searching
			//		 	* 0: not a match
			//		 	* 1: a match but keep looking for a higher priority match
			// tags:
			//		private
			var element = item.domNode,
				text = item.label || (element.focusNode ? element.focusNode.label : '') || element.innerText || element.textContent || "",
				currentString = text.replace(/^\s+/, '').substr(0, searchString.length).toLowerCase();

			return (!!searchString.length && currentString == searchString) ? -1 : 0; // stop searching after first match by default
		},

		_onContainerKeydown: function(evt){
			// summary:
			//		When a key is pressed, if it's an arrow key etc. then it's handled here.
			// tags:
			//		private

			var func = this._keyNavCodes[evt.keyCode];
			if(func){
				func();
				event.stop(evt);
				this._searchString = ''; // so a DOWN_ARROW b doesn't search for ab
			}
		},

		_onContainerKeypress: function(evt){
			// summary:
			//		When a printable key is pressed, it's handled here, searching by letter.
			// tags:
			//		private

			if(evt.charCode <= 32){
				// Avoid duplicate events on firefox (this is an arrow key that will be handled by keydown handler)
				return;
			}

			if(evt.ctrlKey || evt.altKey){ return; }

			var
			matchedItem = null,
			searchString,
			numMatches = 0,
			search = lang.hitch(this, function(){
				if(this._searchTimer){
					this._searchTimer.remove();
				}
				this._searchString += keyChar;
				var allSameLetter = /^(.)\1*$/.test(this._searchString);
				var searchLen = allSameLetter ? 1 : this._searchString.length;
				searchString = this._searchString.substr(0, searchLen);
				// commented out code block to search again if the multichar search fails after a smaller timeout
				//this._searchTimer = this.defer(function(){ // this is the "failure" timeout
				//	this._typingSlowly = true; // if the search fails, then treat as a full timeout
				//	this._searchTimer = this.defer(function(){ // this is the "success" timeout
				//		this._searchTimer = null;
				//		this._searchString = '';
				//	}, this.multiCharSearchDuration >> 1);
				//}, this.multiCharSearchDuration >> 1);
				this._searchTimer = this.defer(function(){ // this is the "success" timeout
					this._searchTimer = null;
					this._searchString = '';
				}, this.multiCharSearchDuration);
				var currentItem = this.focusedChild || null;
				if(searchLen == 1 || !currentItem){
					currentItem = this._getNextFocusableChild(currentItem, 1); // skip current
					if(!currentItem){ return; } // no items
				}
				var stop = currentItem;
				do{
					var rc = this._keyboardSearchCompare(currentItem, searchString);
					if(!!rc && numMatches++ == 0){
						matchedItem = currentItem;
					}
					if(rc == -1){ // priority match
						numMatches = -1;
						break;
					}
					currentItem = this._getNextFocusableChild(currentItem, 1);
				}while(currentItem != stop);
				// commented out code block to search again if the multichar search fails after a smaller timeout
				//if(!numMatches && (this._typingSlowly || searchLen == 1)){
				//	this._searchString = '';
				//	if(searchLen > 1){
				//		// if no matches and they're typing slowly, then go back to first letter searching
				//		search();
				//	}
				//}
			}),
			keyChar = String.fromCharCode(evt.charCode).toLowerCase();

			search();
			// commented out code block to search again if the multichar search fails after a smaller timeout
			//this._typingSlowly = false;
			this.onKeyboardSearch(matchedItem, evt, searchString, numMatches);
		},

		_onChildBlur: function(/*dijit/_WidgetBase*/ /*===== widget =====*/){
			// summary:
			//		Called when focus leaves a child widget to go
			//		to a sibling widget.
			//		Used by MenuBase.js (TODO: move code there)
			// tags:
			//		protected
		},

		_getNextFocusableChild: function(child, dir){
			// summary:
			//		Returns the next or previous focusable child, compared to "child".
			// child: Widget
			//		The current widget
			// dir: Integer
			//		- 1 = after
			//		- -1 = before
			// tags:
			//		abstract extension

			return null;	// dijit/_WidgetBase
		}
	});
});
