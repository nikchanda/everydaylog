<?php

require dirname(__FILE__) .'/../vendor/autoload.php';

define('DB_HOST', 'edl-rds-master.cspq5bemq759.us-east-1.rds.amazonaws.com:3306');


if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']) && (   
       $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] == 'POST' || 
       $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] == 'DELETE' || 
       $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] == 'PUT' )) {
             header('Access-Control-Allow-Origin: *');
             header("Access-Control-Allow-Credentials: true"); 
             header('Access-Control-Allow-Headers: X-Requested-With, Content-type, X-HMAC-Hash, X-HMAC-Token');
             header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT'); 
             header('Access-Control-Max-Age: 86400'); 
      }
  exit;
}



$app = new \Slim\Slim();


$app->post('/event/log', function() use ($app) {

	$json = $app->request->getBody();
	$obj = json_decode($json);

	$datetime = date( "Y-m-d H:m:s", strtotime($obj->time));

	$dbo = getDbo();
	$query = 'INSERT INTO event VALUES (null,"'. $obj->user .'","'. $datetime.'","'. addslashes($json) .'")';
	
	$stmt = $dbo->prepare($query);
	$result = $stmt->execute();

	$success = $result ? true : false;
	echo '{"success":'. $success .',"record":'. $json .'}';
});



$app->get('/report/:account/:enddate(/:days)', function ($account, $enddate, $days=0) use ($app) {
	
	$endtime = strtotime($enddate);
	$start = date('Y-m-d 00:00:00', strtotime("-". $days ." days", $endtime));
	$end = date('Y-m-d 23:59:59', $endtime);

	$dbo = getDbo();
	$query = 'SELECT id, details FROM event WHERE user = "'. $account .'" AND datetime BETWEEN "'. $start .'" AND "'. $end .'" ORDER BY datetime ASC';

	$stmt = $dbo->prepare($query);
	$stmt->execute();
	$rows = $stmt->fetchAll();

	$entries = array();
	if ($rows) {
		foreach($rows as $row) {
			$entry = json_decode( stripslashes($row['details']) );
			$entry->id = $row['id'];
			$entries[] = $entry;
		}
	}

	$success = $rows ? true : false;
	echo '{"success":'. $success .',"entries":'. json_encode($entries) .'}';

});


$app->run();



function getDbo() {
	return new PDO('mysql:host='. DB_HOST .';dbname=everydaylog;charset=utf8', 'dailylogUser', 'dailylogK3y$');
}
