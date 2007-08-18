// Mail demo javascript code

// Display list of messages (upper right pane)
function displayList(){
    this.update = function(message) {
        var clickedTreeNode = message.node;
        var listPane = dijit.byId("listPane");
        var url = "Mail/"+clickedTreeNode.title.replace(" ","") + ".html";
        listPane.setUrl(url);
    };
}

// Display a single message (in bottom right pane)
function displayMessage(name){
    var contentPane = dijit.byId("contentPane");
    var url = "Mail/"+name.replace(" ","") + ".html";
    contentPane.setUrl(url);
}

dojo.addOnLoad(function(){
    //var selector = dijit.byId('treePaneSelector');
    //dojo.topic.subscribe(selector.eventNames.select, new displayList(), 'update');
});
