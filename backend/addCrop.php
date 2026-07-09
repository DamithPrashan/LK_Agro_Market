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

    // --- CHANGED HERE: Extracting from $_POST instead of raw JSON payload string ---
    $cropName = isset($_POST['cropName']) ? trim($_POST['cropName']) : '';
    $category = isset($_POST['category']) ? trim($_POST['category']) : '';
    $quantity = isset($_POST['quantity']) ? floatval($_POST['quantity']) : 0.0;
    $price = isset($_POST['price']) ? floatval($_POST['price']) : 0.0;
    $growthStage = isset($_POST['growthStage']) ? strtolower(trim($_POST['growthStage'])) : 'planted';
    $harvestDate = isset($_POST['harvestDate']) ? trim($_POST['harvestDate']) : '';

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

    // Insert data into Crop table
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

    $crop_id = $pdo->lastInsertId();

    // --- PHOTO PROCESSING LOGIC (Optional block depending on your storage structure) ---
    if (isset($_FILES['photos'])) {
        $uploadedFiles = $_FILES['photos'];
        
        // Loop through each submitted array item file
        for ($i = 0; $i < count($uploadedFiles['name']); $i++) {
            if ($uploadedFiles['error'][$i] === UPLOAD_ERR_OK) {
                $tmpName = $uploadedFiles['tmp_name'][$i];
                $name = time() . "_" . basename($uploadedFiles['name'][$i]);
                $targetPath = "uploads/" . $name; // Make sure this folder exists & is writable!

                if (move_uploaded_file($tmpName, $targetPath)) {
                    // Replace this segment with your active logic to save 
                    // path string mapping entries to a 'crop_images' relational child table
                    // Example:
                    // $imgSql = "INSERT INTO crop_photos (crop_id, photo_path) VALUES (?, ?)";
                    // $pdo->prepare($imgSql)->execute([$crop_id, $targetPath]);
                }
            }
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Crop added successfully with images"
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}<?php
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

    // --- CHANGED HERE: Extracting from $_POST instead of raw JSON payload string ---
    $cropName = isset($_POST['cropName']) ? trim($_POST['cropName']) : '';
    $category = isset($_POST['category']) ? trim($_POST['category']) : '';
    $quantity = isset($_POST['quantity']) ? floatval($_POST['quantity']) : 0.0;
    $price = isset($_POST['price']) ? floatval($_POST['price']) : 0.0;
    $growthStage = isset($_POST['growthStage']) ? strtolower(trim($_POST['growthStage'])) : 'planted';
    $harvestDate = isset($_POST['harvestDate']) ? trim($_POST['harvestDate']) : '';

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

    // Insert data into Crop table
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

    $crop_id = $pdo->lastInsertId();

    // --- PHOTO PROCESSING LOGIC (Optional block depending on your storage structure) ---
    if (isset($_FILES['photos'])) {
        $uploadedFiles = $_FILES['photos'];
        
        // Loop through each submitted array item file
        for ($i = 0; $i < count($uploadedFiles['name']); $i++) {
            if ($uploadedFiles['error'][$i] === UPLOAD_ERR_OK) {
                $tmpName = $uploadedFiles['tmp_name'][$i];
                $name = time() . "_" . basename($uploadedFiles['name'][$i]);
                $targetPath = "uploads/" . $name; // Make sure this folder exists & is writable!

                if (move_uploaded_file($tmpName, $targetPath)) {
                    // Replace this segment with your active logic to save 
                    // path string mapping entries to a 'crop_images' relational child table
                    // Example:
                    // $imgSql = "INSERT INTO crop_photos (crop_id, photo_path) VALUES (?, ?)";
                    // $pdo->prepare($imgSql)->execute([$crop_id, $targetPath]);
                }
            }
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Crop added successfully with images"
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}