<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';

// Ensure user is logged in
require_login();
require_role('farmer');

$user_id = $_SESSION['user']['id'];

try {
    // Get the logged-in farmer's own farmer_id (used for the ownership check below)
    $farmerQuery = $pdo->prepare("SELECT farmer_id FROM farmer WHERE user_id = ?");
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

    // EditList.jsx sends JSON (Content-Type: application/json), not FormData,
    // so we read the raw body instead of $_POST here.
    $input = json_decode(file_get_contents("php://input"), true);

    $crop_id     = isset($input['crop_id']) ? intval($input['crop_id']) : 0;
    $cropName    = isset($input['cropName']) ? trim($input['cropName']) : '';
    $category    = isset($input['category']) ? trim($input['category']) : '';
    $quantity    = isset($input['quantity']) ? floatval($input['quantity']) : 0.0;
    $location    = isset($input['location']) ? trim($input['location']) : '';
    $price       = isset($input['price']) ? floatval($input['price']) : 0.0;
    $growthStage = isset($input['growthStage']) ? strtolower(trim($input['growthStage'])) : 'planted';
    $harvestDate = isset($input['harvestDate']) ? trim($input['harvestDate']) : '';

    if ($crop_id <= 0 || empty($cropName) || empty($category) || $quantity < 0 || $price <= 0 || empty($harvestDate) || empty($location)) {
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

    $pdo->beginTransaction();
    $lock = $pdo->prepare("SELECT quantity FROM crop WHERE crop_id = ? AND farmer_id = ? AND crop_status <> 'removed' FOR UPDATE");
    $lock->execute([$crop_id, $farmer_id]);
    $currentCrop = $lock->fetch(PDO::FETCH_ASSOC);
    if (!$currentCrop) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "No matching listing found, or you don't have permission to edit it."]);
        exit;
    }

    // Block ALL edits when the listing has any active order
    // (reservation_status: pending = buyer waiting, confirmed = accepted by farmer, ready = awaiting collection)
    $activeOrderCheck = $pdo->prepare("
        SELECT COUNT(*) FROM reserve_crop rc
        JOIN reservation r ON r.reserve_crop_id = rc.reserve_crop_id
        WHERE rc.crop_id = ? AND r.reservation_status IN ('pending','confirmed','ready')
    ");
    $activeOrderCheck->execute([$crop_id]);
    if ((int)$activeOrderCheck->fetchColumn() > 0) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Cannot edit a listing that has active orders."]);
        exit;
    }

    // Ownership is enforced both by the locked preflight row and this update.
    $sql = "UPDATE crop SET
                crop_name = ?,
                category = ?,
                quantity = ?,
                location = ?,
                price_per_unit = ?,
                growth_stage = ?,
                harvest_date = ?,
                crop_status = CASE
                    WHEN ? = 0 THEN 'fulfilled'
                    WHEN crop_status = 'fulfilled' AND ? > 0 THEN 'active'
                    ELSE crop_status
                END
            WHERE crop_id = ? AND farmer_id = ? AND crop_status <> 'removed'";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $cropName,
        $category,
        $quantity,
        $location,
        $price,
        $growthStage,
        $harvestDate,
        $quantity,
        $quantity,
        $crop_id,
        $farmer_id
    ]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Listing updated successfully."
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
