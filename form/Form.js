dojo.provide("dijit.form.Form");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare(
	"dijit.form.Form",
	[dijit._Widget, dijit._Templated],
	{
		/*
		summary: 
			Widget corresponding to <form> tag, for validation and serialization
		
		description:
			gets and sets data to and from js-object. With
			this it's easy to create forms to application.
			Just create empty form, then set it's values
			with this and after user pushes submit,
			getValues and send them as json-notation to
			server.

			Note: not all Form widgets are supported ATM
				
		usage: 
			<form dojoType="dijit.form.Form" id="myForm">
				Name: <input type="text" name="name" />
			</form>
			myObj={name: "John Doe"};
			dijit.byId('myForm').setValues(myObj);

			myObj=dijit.byId('myForm').getValues();

		*/

   		templateString: "<form dojoAttachPoint='containerNode' dojoAttachEvent='onsubmit:_onSubmit' enctype='multipart/form-data'></form>",

 		_onSubmit: function(/*event*/e) {
 			// summary: callback when user hits submit button
    		e.preventDefault();
  		},

		submit: function() {
			// summary: programatically submit form
			this.containerNode.submit();
		},

		setValues: function(/*object*/obj) {
			// summary: fill in form values from a JSON structure
			
			// generate map from name --> [list of widgets with that name]
			var map = {};
			dojo.forEach(this.getDescendants(), function(widget){
				if(!widget.name){ return; }
				var entry = map[widget.name] || (map[widget.name] = [] );
				entry.push(widget);
			});

			// call setValue() or setChecked() for each widget, according to obj
			for(var name in map){
				var widgets = map[name],						// array of widgets w/this name
					values = dojo.getObject(name, false, obj);	// list of values for those widgets
				if(!dojo.isArray(values)){
					values = [ values ];
				}
				if(widgets[0].setChecked){
					// for checkbox/radio, values is a list of which widgets should be checked
					dojo.forEach(widgets, function(w, i){
						w.setChecked(dojo.indexOf(values, w.value) != -1);
					});
				}else{
					// otherwise, values is a list of values to be assigned sequentially to each widget
					dojo.forEach(widgets, function(w, i){
						w.setValue(values[i]);
					});					
				}
			}
			
			/***
			 * 	TODO: code for plain input boxes (this shouldn't run for inputs that are part of widgets

			dojo.forEach(this.containerNode.elements, function(element){
				if (element.name == ''){return};	// like "continue"	
				var namePath = element.name.split(".");
				var myObj=obj;
				var name=namePath[namePath.length-1];
				for(var j=1,len2=namePath.length;j<len2;++j) {
					var p=namePath[j - 1];
					// repeater support block
					var nameA=p.split("[");
					if (nameA.length > 1) {
						if(typeof(myObj[nameA[0]]) == "undefined") {
							myObj[nameA[0]]=[ ];
						} // if

						nameIndex=parseInt(nameA[1]);
						if(typeof(myObj[nameA[0]][nameIndex]) == "undefined") {
							myObj[nameA[0]][nameIndex]={};
						}
						myObj=myObj[nameA[0]][nameIndex];
           				continue;
  					 }  // repeater support ends

					if(typeof(myObj[p]) == "undefined") {
						myObj=undefined;
						break;
					};
					myObj=myObj[p];
				}

				if (typeof(myObj) == "undefined") {
					return;		// like "continue"
				}
				if (typeof(myObj[name]) == "undefined" && this.ignoreNullValues) {
					return;		// like "continue"
				}

				// TODO: widget values (just call setValue() on the widget)

				switch(element.type) {
					case "checkbox":
						element.checked = (name in myObj) && 
							dojo.some(myObj[name], function(val){ return val==element.value; });
						break;
					case "radio":
						element.checked = (name in myObj) && myObj[name]==element.value;
						break;
					case "select-multiple":
						element.selectedIndex=-1;
						dojo.forEach(element.options, function(option){
							option.selected = dojo.some(myObj[name], function(val){ return option.value == val; });
						});
						break;
					case "select-one":
						element.selectedIndex="0";
						dojo.forEach(element.options, function(option){
							option.selected = option.value == myObj[name];
						});
						break;
					case "hidden":
					case "text":
					case "textarea":
					case "password":
						element.value = myObj[name] || "";
						break;
				}
      		});
      		*/
		},

		getValues: function() {
			// summary: generate JSON structure from form values

			// get widget values
			var obj = {};
			dojo.forEach(this.getDescendants(), function(widget){
				var value = widget.getValue ? widget.getValue() : widget.value;
				var name = widget.name;
				if(!value || !name){ return; }
				if("checked" in widget && !widget.checked){ return; }

				// store widgets' values as an array, even if there's only value
				// (just for consistency; there might be more than one value at another time)
				var existingObj=dojo.getObject(name, false, obj);
				if(existingObj){
					existingObj.push(value);
				}else{
					dojo.setObject(name, [value], obj);
				}
			});

			/***
			 * code for plain input boxex
			var obj = { };
			dojo.forEach(this.containerNode.elements, function(elm){
				if (!elm.name)	{
					return;		// like "continue"
				}
				var namePath = elm.name.split(".");
				var myObj=obj;
				var name=namePath[namePath.length-1];
				for(var j=1,len2=namePath.length;j<len2;++j) {
					var nameIndex = null;
					var p=namePath[j - 1];
					var nameA=p.split("[");
					if (nameA.length > 1) {
						if(typeof(myObj[nameA[0]]) == "undefined") {
							myObj[nameA[0]]=[ ];
						} // if
						nameIndex=parseInt(nameA[1]);
						if(typeof(myObj[nameA[0]][nameIndex]) == "undefined") {
							myObj[nameA[0]][nameIndex]={};
						}
					} else if(typeof(myObj[nameA[0]]) == "undefined") {
						myObj[nameA[0]]={}
					} // if

					if (nameA.length == 1) {
						myObj=myObj[nameA[0]];
					} else {
						myObj=myObj[nameA[0]][nameIndex];
					} // if
				} // for

				if ((elm.type != "select-multiple" && elm.type != "checkbox" && elm.type != "radio") || (elm.type=="radio" && elm.checked)) {
					if(name == name.split("[")[0]) {
						myObj[name]=elm.value;
					} else {
						// can not set value when there is no name
					}
				} else if (elm.type == "checkbox" && elm.checked) {
					if(typeof(myObj[name]) == 'undefined') {
						myObj[name]=[ ];
					}
					myObj[name].push(elm.value);
				} else if (elm.type == "select-multiple") {
					if(typeof(myObj[name]) == 'undefined') {
						myObj[name]=[ ];
					}
					for (var jdx=0,len3=elm.options.length; jdx<len3; ++jdx) {
						if (elm.options[jdx].selected) {
							myObj[name].push(elm.options[jdx].value);
						}
					}
				} // if
				name=undefined;
			}); // forEach
			***/
			return obj;
		},

	 	isValid: function() {
	 		// TODO: Combobox might need time to process a recently input value.  This should be async?
	 		// make sure that every widget that has a validator function returns true
	 		return dojo.every(this.getDescendants(), function(widget){
	 			return !widget.isValid || widget.isValid();
	 		});
		}
	});
