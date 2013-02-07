define([
	"dojo/dom", // dom.byId
	"dojo/_base/lang",
	"dojo/sniff", // has("ie") has("opera")
	"dojo/_base/window"
], function(dom, lang, has, baseWindow){

	// module:
	//		dijit/selection

	// Note that this class is using feature detection, but doesn't use has() because sometimes on IE the outer window
	// may be running in standards mode (ie, IE9 mode) but an iframe may be in compatibility mode.   So the code path
	// used will vary based on the window.

	var SelectionManager = function(win){
		// summary:
		//		Class for monitoring / changing the selection (typically highlighted text) in a given window
		// win: Window
		//		The window to monitor/adjust the selection on.

		var doc = win.document;

		this.getType = function(){
			// summary:
			//		Get the selection type (like doc.select.type in IE).
			if(doc.getSelection){
				// W3C path
				var stype = "text";

				// Check if the actual selection is a CONTROL (IMG, TABLE, HR, etc...).
				var oSel;
				try{
					oSel = win.getSelection();
				}catch(e){ /*squelch*/ }

				if(oSel && oSel.rangeCount == 1){
					var oRange = oSel.getRangeAt(0);
					if(	(oRange.startContainer == oRange.endContainer) &&
						((oRange.endOffset - oRange.startOffset) == 1) &&
						(oRange.startContainer.nodeType != 3 /* text node*/)
						){
						stype = "control";
					}
				}
				return stype; //String
			}else{
				// IE6-8
				return doc.selection.type.toLowerCase();
			}
		};

		this.getSelectedText = function(){
			// summary:
			//		Return the text (no html tags) included in the current selection or null if no text is selected
			if(doc.getSelection){
				// W3C path
				var selection = win.getSelection();
				return selection ? selection.toString() : ""; //String
			}else{
				// IE6-8
				if(this.getType() == 'control'){
					return null;
				}
				return doc.selection.createRange().text;
			}
		};

		this.getSelectedHtml = function(){
			// summary:
			//		Return the html text of the current selection or null if unavailable
			if(doc.getSelection){
				// W3C path
				var selection = win.getSelection();
				if(selection && selection.rangeCount){
					var i;
					var html = "";
					for(i = 0; i < selection.rangeCount; i++){
						//Handle selections spanning ranges, such as Opera
						var frag = selection.getRangeAt(i).cloneContents();
						var div = doc.createElement("div");
						div.appendChild(frag);
						html += div.innerHTML;
					}
					return html; //String
				}
				return null;
			}else{
				// IE6-8
				if(this.getType() == 'control'){
					return null;
				}
				return doc.selection.createRange().htmlText;
			}
		};

		this.getSelectedElement = function(){
			// summary:
			//		Retrieves the selected element (if any), just in the case that
			//		a single element (object like and image or a table) is
			//		selected.
			if(this.getType() == "control"){
				if(doc.getSelection){
					// W3C path
					var selection = win.getSelection();
					return selection.anchorNode.childNodes[ selection.anchorOffset ];
				}else{
					// IE6-8
					var range = doc.selection.createRange();
					if(range && range.item){
						return doc.selection.createRange().item(0);
					}
				}
			}
			return null;
		};

		this.getParentElement = function(){
			// summary:
			//		Get the parent element of the current selection
			if(this.getType() == "control"){
				var p = this.getSelectedElement();
				if(p){ return p.parentNode; }
			}else{
				if(doc.getSelection){
					var selection = doc.getSelection();
					if(selection){
						var node = selection.anchorNode;
						while(node && (node.nodeType != 1)){ // not an element
							node = node.parentNode;
						}
						return node;
					}
				}else{
					var r = doc.selection.createRange();
					r.collapse(true);
					return r.parentElement();
				}
			}
			return null;
		};

		this.hasAncestorElement = function(/*String*/ tagName /* ... */){
			// summary:
			//		Check whether current selection has a  parent element which is
			//		of type tagName (or one of the other specified tagName)
			// tagName: String
			//		The tag name to determine if it has an ancestor of.
			return this.getAncestorElement.apply(this, arguments) != null; //Boolean
		};

		this.getAncestorElement = function(/*String*/ tagName /* ... */){
			// summary:
			//		Return the parent element of the current selection which is of
			//		type tagName (or one of the other specified tagName)
			// tagName: String
			//		The tag name to determine if it has an ancestor of.
			var node = this.getSelectedElement() || this.getParentElement();
			return this.getParentOfType(node, arguments); //DOMNode
		};

		function isTag(/*DomNode*/ node, /*String[]*/ tags){
			// summary:
			//		Function to determine if a node is one of an array of tags.
			// node:
			//		The node to inspect.
			// tags:
			//		An array of tag name strings to check to see if the node matches.
			if(node && node.tagName){
				var _nlc = node.tagName.toLowerCase();
				for(var i=0; i<tags.length; i++){
					var _tlc = String(tags[i]).toLowerCase();
					if(_nlc == _tlc){
						return _tlc; // String
					}
				}
			}
			return "";
		}

		this.getParentOfType = function(/*DomNode*/ node, /*String[]*/ tags){
			// summary:
			//		Function to locate a parent node that matches one of a set of tags
			// node:
			//		The node to inspect.
			// tags:
			//		An array of tag name strings to check to see if the node matches.
			while(node){
				if(isTag(node, tags).length){
					return node; // DOMNode
				}
				node = node.parentNode;
			}
			return null;
		};

		this.collapse = function(/*Boolean*/ beginning){
			// summary:
			//		Function to collapse (clear), the current selection
			// beginning: Boolean
			//		Indicates whether to collapse the cursor to the beginning of the selection or end.
			if(doc.getSelection){
				// W3C path
				var selection = win.getSelection();
				if(selection.removeAllRanges){ // Mozilla
					if(beginning){
						selection.collapseToStart();
					}else{
						selection.collapseToEnd();
					}
				}else{ // Safari
					// pulled from WebCore/ecma/kjs_window.cpp, line 2536
					selection.collapse(beginning);
				}
			}else{
				// IE6-8
				var range = doc.selection.createRange();
				range.collapse(beginning);
				range.select();
			}
		};

		this.remove = function(){
			// summary:
			//		Function to delete the currently selected content from the document.
			var sel = doc.selection;
			if(doc.getSelection){
				// W3C path
				sel = win.getSelection();
				sel.deleteFromDocument();
				return sel; //Selection
			}else{
				// IE6-8
				if(sel.type.toLowerCase() != "none"){
					sel.clear();
				}
				return sel; //Selection
			}
		};

		this.selectElementChildren = function(/*DomNode*/ element, /*Boolean?*/ nochangefocus){
			// summary:
			//		clear previous selection and select the content of the node
			//		(excluding the node itself)
			// element: DOMNode
			//		The element you wish to select the children content of.
			// nochangefocus: Boolean
			//		Indicates if the focus should change or not.

			var range;
			element = dom.byId(element);
			if(doc.getSelection){
				// W3C
				var selection = win.getSelection();
				if(has("opera")){
					//Opera's selectAllChildren doesn't seem to work right
					//against <body> nodes and possibly others ... so
					//we use the W3C range API
					if(selection.rangeCount){
						range = selection.getRangeAt(0);
					}else{
						range = doc.createRange();
					}
					range.setStart(element, 0);
					range.setEnd(element,(element.nodeType == 3) ? element.length : element.childNodes.length);
					selection.addRange(range);
				}else{
					selection.selectAllChildren(element);
				}
			}else{
				// IE6-8
				range = element.ownerDocument.body.createTextRange();
				range.moveToElementText(element);
				if(!nochangefocus){
					try{
						range.select(); // IE throws an exception here if the widget is hidden.  See #5439
					}catch(e){ /* squelch */}
				}
			}
		};

		this.selectElement = function(/*DomNode*/ element, /*Boolean?*/ nochangefocus){
			// summary:
			//		clear previous selection and select element (including all its children)
			// element: DOMNode
			//		The element to select.
			// nochangefocus: Boolean
			//		Boolean indicating if the focus should be changed.  IE only.
			var range;
			element = dom.byId(element);	// TODO: remove for 2.0 or sooner, spec listed above doesn't allow for string
			if(doc.getSelection){
				// W3C path
				var selection = doc.getSelection();
				range = doc.createRange();
				if(selection.removeAllRanges){ // Mozilla
					// FIXME: does this work on Safari?
					if(has("opera")){
						//Opera works if you use the current range on
						//the selection if present.
						if(selection.getRangeAt(0)){
							range = selection.getRangeAt(0);
						}
					}
					range.selectNode(element);
					selection.removeAllRanges();
					selection.addRange(range);
				}
			}else{
				// IE6-8
				try{
					var tg = element.tagName ? element.tagName.toLowerCase() : "";
					if(tg === "img" || tg === "table"){
						range = baseWindow.body(doc).createControlRange();
					}else{
						range = baseWindow.body(doc).createRange();
					}
					range.addElement(element);
					if(!nochangefocus){
						range.select();
					}
				}catch(e){
					this.selectElementChildren(element, nochangefocus);
				}
			}
		};

		this.inSelection = function(node){
			// summary:
			//		This function determines if 'node' is
			//		in the current selection.
			// tags:
			//		public
			if(node){
				var newRange;
				var range;

				if(doc.getSelection){
					// WC3
					var sel = win.getSelection();
					if(sel && sel.rangeCount > 0){
						range = sel.getRangeAt(0);
					}
					if(range && range.compareBoundaryPoints && doc.createRange){
						try{
							newRange = doc.createRange();
							newRange.setStart(node, 0);
							if(range.compareBoundaryPoints(range.START_TO_END, newRange) === 1){
								return true;
							}
						}catch(e){ /* squelch */}
					}
				}else{
					// IE6-8, so we can't use the range object as the pseudo
					// range doesn't implement the boundary checking, we have to
					// use IE specific crud.
					range = doc.selection.createRange();
					try{
						newRange = node.ownerDocument.body.createControlRange();
						if(newRange){
							newRange.addElement(node);
						}
					}catch(e1){
						try{
							newRange = node.ownerDocument.body.createTextRange();
							newRange.moveToElementText(node);
						}catch(e2){/* squelch */}
					}
					if(range && newRange){
						// We can finally compare similar to W3C
						if(range.compareEndPoints("EndToStart", newRange) === 1){
							return true;
						}
					}
				}
			}
			return false; // Boolean
		}
	};

	// singleton on the main window
	var selection = new SelectionManager(window);

	// hook for editor to use class
	selection.SelectionManager = SelectionManager;

	return selection;
});
