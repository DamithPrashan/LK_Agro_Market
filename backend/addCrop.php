<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in
require_login();
require_role('farmer');

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
    $crop_status = "active";

    // Extracting from $_POST
    $cropName = isset($_POST['cropName']) ? trim($_POST['cropName']) : '';
    $category = isset($_POST['category']) ? trim($_POST['category']) : '';
    $quantity = isset($_POST['quantity']) ? floatval($_POST['quantity']) : 0.0;
    // Use the district selected in the Add Listing form.
    // Fall back to the farmer's profile location only if none was submitted.
    $location = isset($_POST['location']) && trim($_POST['location']) !== ''
        ? trim($_POST['location'])
        : $farmer['location'];
    $price = isset($_POST['price']) ? floatval($_POST['price']) : 0.0;
    $growthStage = isset($_POST['growthStage']) ? strtolower(trim($_POST['growthStage'])) : 'planted';
    $harvestDate = isset($_POST['harvestDate']) ? trim($_POST['harvestDate']) : '';

    if (empty($cropName) || empty($category) || $quantity <= 0 || $price <= 0 || empty($harvestDate) || empty($location)) {
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
        district,
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
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $farmer_id,
        $location,
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

    // Ensure uploads directory exists
    if (!is_dir('uploads')) {
        mkdir('uploads', 0777, true);
    }

    $first_photo_path = null;

    // --- PHOTO PROCESSING LOGIC ---
    if (isset($_FILES['photos'])) {
        $uploadedFiles = $_FILES['photos'];
        
        // Loop through each submitted array item file
        for ($i = 0; $i < count($uploadedFiles['name']); $i++) {
            if ($uploadedFiles['error'][$i] === UPLOAD_ERR_OK) {
                $tmpName = $uploadedFiles['tmp_name'][$i];
                $name = time() . "_" . $i . "_" . basename($uploadedFiles['name'][$i]);
                $targetPath = "uploads/" . $name; // Make sure this folder exists & is writable!

                if (move_uploaded_file($tmpName, $targetPath)) {
                    // Save path string mapping entries to the crop_photos table
                    $imgSql = "INSERT INTO crop_photos (crop_id, photo_path) VALUES (?, ?)";
                    $pdo->prepare($imgSql)->execute([$crop_id, $targetPath]);
                    
                    if ($first_photo_path === null) {
                        $first_photo_path = $targetPath;
                    }
                }
            }
        }

        // Update the main image_url in the crop table with the first uploaded photo path
        if ($first_photo_path !== null) {
            $updateSql = "UPDATE crop SET image_url = ? WHERE crop_id = ?";
            $pdo->prepare($updateSql)->execute([$first_photo_path, $crop_id]);
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
?>
