<?php

require dirname(__FILE__) .'/../vendor/autoload.php';

//define('DB_HOST', 'localhost');
define('DB_HOST', 'edl-rds-master.cspq5bemq759.us-east-1.rds.amazonaws.com');


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

	$dbo = getDbo();
	$query = 'INSERT INTO event VALUES (null,"'. $obj->user .'","'. $obj->time .'","'. addslashes($json) .'")';
	
	$stmt = $dbo->prepare($query);
	$result = $stmt->execute();

	if ($result) {
		$obj->id = $dbo->lastInsertId();
	}

	$errors = $stmt->errorInfo();
	$success = $errors[0] == "00000" ? 1 : 0;

	$return = new stdClass();
	$return->success = $success;
	$return->record = $obj;

	if (!$success) {
		$return->errors = $errors;
	}
	echo json_encode($return);
});



$app->get('/report/:account/:enddate(/:days)', function ($account, $enddate, $days=0) use ($app) {
	
	$endtime = strtotime($enddate);
	$start = date('Y-m-d 00:00:00', strtotime("-". $days ." days", $endtime));
	$end = date('Y-m-d 23:59:59', $endtime);

	$dbo = getDbo();
	$query = 'SELECT id, details FROM event WHERE user = "'. $account .'" AND datetime BETWEEN "'. $start .'" AND "'. $end .'" ORDER BY `datetime` ASC';

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

	$errors = $stmt->errorInfo();
	$success = $errors[0] == "00000" ? 1 : 0;
	echo '{"success":'. $success .',"entries":'. json_encode($entries) .'}';
});


$app->run();



function getDbo() {
	return new PDO('mysql:host='. DB_HOST .';dbname=everydaylog;charset=utf8', 'edlUser', 'edlK3y$');
}
