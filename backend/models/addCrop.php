<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'connection/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$cropName = $data['cropName'];
$category = $data['category'];
$quantity = $data['quantity'];
$price = $data['price'];
$growthStage = $data['growthStage'];
$harvestDate = $data['harvestDate'];

/*
 * Replace these with actual values later
 */
$farmer_id = 1;
$location = "Nuwara Eliya";
$crop_status = "active";

try {

    $sql = "INSERT INTO crop
    (
        farmer_id,
        crop_name,
        category,
        location,
        quantity,
        price_per_unit,
        growth_stage,
        harvest_date,
        crop_status
    )
    VALUES
    (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
    )";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        $farmer_id,
        $cropName,
        $category,
        $location,
        $quantity,
        $price,
        $growthStage,
        $harvestDate,
        $crop_status
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Crop added successfully"
    ]);

} catch(PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}