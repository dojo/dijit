dojo.provide("dijit._base");

dojo.require("dijit._base.focus");
dojo.require("dijit._base.manager");
dojo.require("dijit._base.place");
dojo.require("dijit._base.popup");
dojo.require("dijit._base.scroll");
dojo.require("dijit._base.sniff");
dojo.require("dijit._base.bidi");
dojo.require("dijit._base.typematic");
dojo.require("dijit._base.wai");
dojo.require("dijit._base.window");

//	TODO: Find a better way of solving this bug!
//	Ugly-ass hack to solve bug #5626 for 1.1; basically force Safari to re-layout.
if(dojo.isSafari){
	dojo.addOnLoad(function(){
		window.resizeBy(1,0);
		setTimeout(function(){ window.resizeBy(-1,0); }, 10);
	});
}
