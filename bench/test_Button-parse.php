<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
        "http://www.w3.org/TR/html4/strict.dtd">

<html>
        <head>
		<title>PARSE - Dojo Button Instantiation Test</title>
	<script type="text/javascript" src="../../dojo/dojo.js" XdjConfig='isDebug: true, debugAtAllCosts: true'></script>
	<script type="text/javascript">
		dojo.require("dijit.form.Button");
		// start the timer right before the parser is loaded
		dojo.addOnLoad(
			function(){
				// figure out how many thing's we're dealing with here...
				var list = dojo.query("button");
				window.count = list.length;
				
				// start the timer
				window.t0 = new Date().getTime();
			}
		);
		dojo.require("dojo.parser");
		// this should end the timer right AFTER the parser finishes
		dojo.addOnLoad(
			function(){
				window.t1 = new Date().getTime();
				dojo.byId("results").innerHTML = "It took " + (t1 - t0) + " msec to parse (and create) " + count + " Buttons programmatically.";
			}
		);
		logMessage = window.alert;
	</script>

<style>
	
	@import "../themes/tundra/tundra.css";

	/* group multiple buttons in a row */
	.box {
		display: block;
		text-align: center;
	}
	.box .dojoButton {
		width:80px;
		margin-right: 10px;
	}
	.dojoButtonContents {
		font-size: 1.6em;
	}
	
	#buttonContainer {
		border:1px solid black;
		width:100%;
	}

	#results {
		color:darkred;
	}

</style>
        </head>
<body class=tundra>
<h2>Parsing simple dijit.form.Buttons!</h2>
<h3 id="results"></h3>

<div id="buttonContainer" class='box'>


<script language="php">
	$count  = (array_key_exists('count', $_GET)    ? $_GET['count'] : 100);
	for($i=1; $i <= $count; $i++){
		echo "<button dojoType='dijit.form.Button' onClick='alert(1)'>Button $i </button>";
	}
</script>
</div>

<br>
Pass "?count=<i><b>n</b></i>" in the query string to change the number of buttons.
</body>
</html>
