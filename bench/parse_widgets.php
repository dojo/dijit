<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
        "http://www.w3.org/TR/html4/strict.dtd">

<html>
        <head>
		<title>PARSE - Dojo Widget Instantiation Test</title>
	<script type="text/javascript" src="../../dojo/dojo.js" XdjConfig='isDebug: true, debugAtAllCosts: true'></script>

	<script type="text/javascript">
		dojo.registerModulePath("dijit", "../dijit");

<script language="php">
	$count  		= (array_key_exists('count', $_GET)   ? $_GET['count'] : 100);
	$className  	= (array_key_exists('class', $_GET)   ? $_GET['class'] : 'form.Button');
	
	echo 	"dojo.require('dijit.$className');";
	echo	"var count = $count;";
	echo	"var className = '$className';";
</script>

		// start the timer right before the parser is loaded
		dojo.addOnLoad(
			function(){
				// start the timer
				window.t0 = new Date().getTime();
			}
		);
		dojo.require("dijit.util.parser");
		// this should end the timer right AFTER the parser finishes
		dojo.addOnLoad(
			function(){
				window.t1 = new Date().getTime();
				dojo.byId("results").innerHTML = "It took " + (t1 - t0) + " msec to parse (and create) " + count + " " + className + " instances.";
			}
		);
		logMessage = window.alert;
	</script>

<style>
	
	@import "../themes/tundra/tundra.css";

	#widgetContainer {
		border:1px solid black;
		width:100%;
	}

	#results {
		color:darkred;
	}

</style>
        </head>
<body class=tundra>

<script language="php">
	echo	"<h2>Currently Parsing $count $className instances</h2>";
	echo 	"Pass <code>?count=<i><b>100</b></i></code> in the query string to change the number of widgets.<br>";
	echo 	"Pass <code>?class=<i><b>form.Button</b></i></code> in the query string to change the widget class.";
</script>

<h3 id="results"></h3>

<div id="widgetContainer" class='box'>

<script language="php">
	for($i=1; $i <= $count; $i++){
		echo "<div dojoType='dijit.$className'>$className $i </div>";
	}
</script>
</div><br>
</body>
</html>
