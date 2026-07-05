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

    // Get farmer details
    $farmerQuery = $pdo->prepare("
        SELECT farmer_id
        FROM farmer
        WHERE user_id = ?
    ");

    $farmerQuery->execute([$user_id]);

    $farmer = $farmerQuery->fetch(PDO::FETCH_ASSOC);

    if (!$farmer) {
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized: Farmer not found."
        ]);
        exit;
    }

    $farmer_id = $farmer['farmer_id'];

    // Read JSON data
    $data = json_decode(file_get_contents("php://input"), true);

    $crop_id = isset($data['crop_id']) ? intval($data['crop_id']) : 0;
    $cropName = isset($data['cropName']) ? trim($data['cropName']) : "";
    $category = isset($data['category']) ? trim($data['category']) : "";
    $quantity = isset($data['quantity']) ? floatval($data['quantity']) : 0;
    $price = isset($data['price']) ? floatval($data['price']) : 0;
    $growthStage = isset($data['growthStage']) ? trim($data['growthStage']) : "planted";
    $harvestDate = isset($data['harvestDate']) ? trim($data['harvestDate']) : "";

    // Validation
    if (
        $crop_id <= 0 ||
        empty($cropName) ||
        empty($category) ||
        $quantity <= 0 ||
        $price <= 0 ||
        empty($harvestDate)
    ) {
        echo json_encode([
            "success" => false,
            "message" => "Please fill all fields correctly."
        ]);
        exit;
    }

    // Validate growth stage
    $allowedStages = [
        "planted",
        "growing",
        "ready_for_harvest",
        "harvested"
    ];

    if (!in_array($growthStage, $allowedStages)) {
        $growthStage = "planted";
    }

    // Check ownership
    $check = $pdo->prepare("
        SELECT crop_id
        FROM crop
        WHERE crop_id = ?
        AND farmer_id = ?
    ");

    $check->execute([$crop_id, $farmer_id]);

    if ($check->rowCount() == 0) {
        echo json_encode([
            "success" => false,
            "message" => "Crop not found or permission denied."
        ]);
        exit;
    }

    // Update crop
    $sql = "
        UPDATE crop
        SET
            crop_name = ?,
            category = ?,
            quantity = ?,
            price_per_unit = ?,
            growth_stage = ?,
            harvest_date = ?
        WHERE crop_id = ?
        AND farmer_id = ?
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        $cropName,
        $category,
        $quantity,
        $price,
        $growthStage,
        $harvestDate,
        $crop_id,
        $farmer_id
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Crop listing updated successfully."
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Database Error: " . $e->getMessage()
    ]);

}