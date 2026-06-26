<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'connection/db.php';

$sql = "SELECT * FROM crop";
$stmt = $pdo->query($sql);

$crops = $stmt->fetchAll();

echo json_encode($crops);
?>