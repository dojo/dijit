dojo.provide("dijit.tests._BidiSupport.BidiSupportModule.module");

dojo.require("dojo.has");
dojo.has.add("dojo-bidi", true);

try{

	dojo.require("dijit.tests._BidiSupport.BidiSupportModule.BidiSupportTest");

}catch(e){

	doh.debug(e);

}
