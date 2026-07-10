<?php

header("Access-Control-Allow-Origin:*");
header("Content-Type:application/json");

require_once __DIR__ . '/../../connection/db.php';

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
        fv.verification_id,
        fv.nic_number,
        fv.farm_location,
        fv.verification_status,
        u.name AS farmer_name
    FROM farmer_verification fv
    INNER JOIN farmer f ON fv.farmer_id = f.farmer_id
    INNER JOIN user u ON f.user_id = u.user_id
    WHERE fv.verification_status='pending'"
);

$response["pendingVerification"]=
$stmt->fetchAll();


echo json_encode($response);

?>