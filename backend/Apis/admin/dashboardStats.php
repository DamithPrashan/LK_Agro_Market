<?php

header("Access-Control-Allow-Origin:*");
header("Content-Type:application/json");

require "../../config/database.php";

$response=[];


/* total farmers */

$stmt=$pdo->query(

"SELECT COUNT(*) total
FROM farmer"

);

$response["farmers"]=
$stmt->fetch()['total'];


/* total buyers */

$stmt=$pdo->query(

"SELECT COUNT(*) total
FROM buyer"

);

$response["buyers"]=
$stmt->fetch()['total'];


/* total reservations */

$stmt=$pdo->query(

"SELECT COUNT(*) total
FROM reserve_crop"

);

$response["orders"]=
$stmt->fetch()['total'];


/* complaints */

$stmt=$pdo->query(

"SELECT COUNT(*) total
FROM complaint
WHERE complaint_status='pending'"

);

$response["complaints"]=
$stmt->fetch()['total'];


/* pending farmer verification */

$stmt=$pdo->query(

"SELECT
verification_id,
nic_number,
farm_location,
verification_status

FROM farmer_verification

WHERE verification_status='pending'"

);

$response["pendingVerification"]=
$stmt->fetchAll();


echo json_encode($response);

?>