<?php
	// this just bounces a message as a response, and optionally emulates network latency.

	// default delay is 0 sec, to change:
	// getResponse.php?delay=[Int milliseconds]

	// to change the message returned
	// getResponse.php?mess=whatever%20string%20you%20want.

	// to select a predefined message
	// getResponse.php?messId=0

	$delay = 0;
	if(isset($_GET['delay']) && is_numeric($_GET['delay'])){
		$delay = (intval($_GET['delay']) * 1000);
	}

	if(isset($_GET['messId']) && is_numeric($_GET['messId'])){
		switch($_GET['messId']){
			case 0:
				echo "<h3>WARNING This should NEVER be seen, delayed by 2 sec!</h3>";
				$delay = 2;
				break;
			case 1:
				echo "<div dojotype='dijit.TestWidget'>Testing setHref</div>";
				break;
			case 2:
				echo "<div dojotype='dijit.TestWidget'>Delayed setHref test</div>
					  <div dojotype='dijit.TestWidget'>Delayed by $delay sec.</div>";
				break;
			default:
				echo "unknown messId:{$_GET['messId']}";
		}
	}

	if($_GET['bounceGetStr']){
		echo "<div id='bouncedGetStr'>{$_SERVER["QUERY_STRING"]}</div>";
	}

	if($_GET['message']){
		echo $_GET['message'];
	}

	usleep($delay);

?>
