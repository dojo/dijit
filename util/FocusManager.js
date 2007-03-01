dojo.provide("dijit.util.FocusManager");

dojo.require("dojo.html.selection");
dojo.require("dojo.html.util");
dojo.require("dojo.event.*");

dijit.util.FocusManager = new function(){
	// summary:
	//		This class is used to save the current focus / selection on the screen,
	//		and restore it later.   It's typically used for popups (menus and dialogs),
	//		but can also be used for a menubar or toolbar.   (For example, in the editor
	//		the user might type Ctrl-T to focus the toolbar, and then when he/she selects
	//		a menu choice, focus is returned to the editor window.)
	//
	//		Note that it doesn't deal with submenus off of an original menu;
	//		From this class's perspective it's all part of one big menu.
	//
	//		The widget must implement a close() callback, which will close dialogs or
	//		a context menu, and for a menubar, it will close the submenus and remove
	//		highlighting classes on the root node.


	/////////////////////////////////////////////////////////////
	// Keep track of currently focused and previously focused element

	var curFocus, prevFocus;	
	function onFocus(/*DomNode*/ node){
		if(node && node.tagName=="body"){
			node=null;
		}
		if(node !== curFocus){
			prevFocus = curFocus;
			curFocus = node;
			dojo.debug("focused on ", node ? (node.id ? node.id : node.tagName) : "nothing");
		}
	}
	
	dojo.addOnLoad(function(){
		if(dojo.render.html.ie){
			// TODO: to make this more deterministic should delay updating curFocus/prevFocus for 10ms?
			window.setInterval(function(){ onFocus(document.activeElement); }, 100);
		}else{
			dojo.body().addEventListener('focus', function(evt){ onFocus(evt.target); }, true);
		}
	});
	
	/////////////////////////////////////////////////////////////////
	// Main methods, called when a dialog/menu is opened/closed

	// TODO: convert this to a stack, so we can save and restore multiple times?
	// or have save return an object that can be passed to restore?

	var currentMenu = null;	// current menu/dialog
	var closeOnScreenClick = false;	// should clicking the screen close the menu?
	var openedForWindow;	// iframe in which menu was opened
	var restoreFocus;		// focused node before menu opened
	var bookmark;			// selected text before menu opened

	this.save = function(/*Widget*/menu, /*Window*/ _openedForWindow){
		// summary:
		//	called when a popup appears (either a top level menu or a dialog),
		//	or when a toolbar/menubar receives focus
		if (menu == currentMenu){ return; }

		if (currentMenu){
			currentMenu.close();
		}

		currentMenu = menu;
		openedForWindow = _openedForWindow;

		// Find node to restore focus to, when this menu/dialog closes
		restoreFocus = dojo.html.isDescendantOf(curFocus, menu.domNode) ? prevFocus : curFocus;
		dojo.debug("will restore focus to " + ( restoreFocus ? (restoreFocus.id || restoreFocus.tagName) : "nothing") );
		dojo.debug("prev focus is " + prevFocus);

		//Store the current selection and restore it before the action for a menu item
		//is executed. This is required as clicking on an menu item deselects current selection
		if(!dojo.withGlobal(openedForWindow||dojo.global(), dojo.html.selection.isCollapsed)){
			bookmark = dojo.withGlobal(openedForWindow||dojo.global(), dojo.html.selection.getBookmark);
		}else{
			bookmark = null;
		}
	};

	this.restore = function(/*Widget*/menu){
		// summary:
		//	notify the manager that menu is closed; it will return focus to
		//	where it was before the menu got focus
		if (currentMenu == menu){
			// focus on element that was focused before menu stole the focus
			if(restoreFocus){
				restoreFocus.focus();
			}

			//do not need to restore if current selection is not empty
			//(use keyboard to select a menu item)
			if(bookmark && dojo.withGlobal(openedForWindow||dojo.global(), dojo.html.selection.isCollapsed)){
				if(openedForWindow){
					openedForWindow.focus()
				}
				try{
					dojo.withGlobal(openedForWindow||dojo.global(), "moveToBookmark", dojo.html.selection, [bookmark]);
				}catch(e){
					/*squelch IE internal error, see http://trac.dojotoolkit.org/ticket/1984 */
				}
			}

			bookmark = null;
			closeOnScreenClick = false;
			currentMenu = null;
		}
	};
}();
