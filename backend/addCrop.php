<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in
require_login();

$user_id = $_SESSION['user']['id'];

try {
    // Get farmer details dynamically
    $farmerQuery = $pdo->prepare("SELECT f.farmer_id, u.location FROM farmer f JOIN user u ON f.user_id = u.user_id WHERE f.user_id = ?");
    $farmerQuery->execute([$user_id]);
    $farmer = $farmerQuery->fetch();
    
    if (!$farmer) {
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized: Logged in user is not registered as a farmer."
        ]);
        exit;
    }
    
    $farmer_id = $farmer['farmer_id'];
    $location = $farmer['location'];
    $crop_status = "active";

    $data = json_decode(file_get_contents("php://input"), true);
    
    $cropName = isset($data['cropName']) ? trim($data['cropName']) : '';
    $category = isset($data['category']) ? trim($data['category']) : '';
    $quantity = isset($data['quantity']) ? floatval($data['quantity']) : 0.0;
    $price = isset($data['price']) ? floatval($data['price']) : 0.0;
    $growthStage = isset($data['growthStage']) ? strtolower(trim($data['growthStage'])) : 'planted';
    $harvestDate = isset($data['harvestDate']) ? trim($data['harvestDate']) : '';

    if (empty($cropName) || empty($category) || $quantity <= 0 || $price <= 0 || empty($harvestDate)) {
        echo json_encode([
            "success" => false,
            "message" => "Please fill in all crop details correctly."
        ]);
        exit;
    }

    // Validate enum options for growth stage
    $allowed_stages = ['planted', 'growing', 'ready_for_harvest', 'harvested'];
    if (!in_array($growthStage, $allowed_stages)) {
        $growthStage = 'planted';
    }

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

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}