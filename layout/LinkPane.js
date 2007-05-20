dojo.provide("dijit.layout.LinkPane");

dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.base.TemplatedWidget");

dojo.declare("dijit.layout.LinkPane", 
	[dijit.layout.ContentPane, dijit.base.TemplatedWidget],
{
	// summary
	//	LinkPane is just a ContentPane that loads data remotely (via the href attribute),
	//	and has markup similar to an anchor.  The anchor's body (the words between <a> and </a>)
	//	become the label of the widget (used for TabContainer, AccordionContainer, etc.)
	// usage
	//	<a href="foo.html">my label</a>

	// I'm using a template because the user may specify the input as
	// <a href="foo.html">label</a>, in which case we need to get rid of the
	// <a> because we don't want a link.
	templateString: '<div class="dijitLinkPane"></div>',

	postCreate: function(){
		
		// If user has specified node contents, they become the label
		// (the link must be plain text)
		this.label += this.domNode.innerHTML;
		
		dijit.layout.LinkPane.superclass.postCreate.apply(this, arguments);

	}
});
