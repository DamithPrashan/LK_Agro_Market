<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in and is a buyer
require_login();
require_role('buyer');

$user_id = $_SESSION['user']['id'];

// Get POST JSON data
$data = isset($mockInput) ? $mockInput : json_decode(file_get_contents("php://input"), true);
$crop_id = isset($data['crop_id']) ? intval($data['crop_id']) : 0;
$quantity = isset($data['quantity']) ? floatval($data['quantity']) : 0.0;
$collection_date = isset($data['collection_date']) ? trim($data['collection_date']) : '';

if ($crop_id <= 0 || $quantity <= 0 || empty($collection_date)) {
    echo json_encode(["success" => false, "message" => "Please provide valid pre-order details."]);
    exit;
}

try {
    // 1. Get buyer_id for the logged in user
    $buyerQuery = $pdo->prepare("SELECT buyer_id FROM buyer WHERE user_id = ?");
    $buyerQuery->execute([$user_id]);
    $buyer = $buyerQuery->fetch();
    if (!$buyer) {
        echo json_encode(["success" => false, "message" => "Buyer profile not found."]);
        exit;
    }
    $buyer_id = $buyer['buyer_id'];

    // 2. Fetch crop details
    $cropQuery = $pdo->prepare("SELECT price_per_unit, quantity, crop_status, harvest_date FROM crop WHERE crop_id = ?");
    $cropQuery->execute([$crop_id]);
    $crop = $cropQuery->fetch();
    if (!$crop) {
        echo json_encode(["success" => false, "message" => "Crop listing not found."]);
        exit;
    }
    if ($crop['crop_status'] !== 'active') {
        echo json_encode(["success" => false, "message" => "This crop listing is no longer active."]);
        exit;
    }
    if ($quantity > floatval($crop['quantity'])) {
        echo json_encode(["success" => false, "message" => "Requested quantity exceeds available quantity."]);
        exit;
    }

    // Validate delivery date (collection_date) against harvest_date
    $harvest_date = $crop['harvest_date'];
    $harvest_dt = new DateTime($harvest_date);
    $max_dt = clone $harvest_dt;
    $max_dt->modify('+10 days');
    
    $collection_dt = new DateTime($collection_date);
    
    if ($collection_dt < $harvest_dt || $collection_dt > $max_dt) {
        $formatted_max = $max_dt->format('Y-m-d');
        echo json_encode([
            "success" => false, 
            "message" => "Delivery date must be between {$harvest_date} and {$formatted_max}."
        ]);
        exit;
    }

    $unit_price = floatval($crop['price_per_unit']);
    $total_amount = $quantity * $unit_price;

    $pdo->beginTransaction();

    // 3. Insert into reserve_crop
    $reserveSql = "INSERT INTO reserve_crop (buyer_id, crop_id, quantity_requested, unit_price, total_amount, status, reserved_date) VALUES (?, ?, ?, ?, ?, 'pending', NOW())";
    $reserveStmt = $pdo->prepare($reserveSql);
    $reserveStmt->execute([$buyer_id, $crop_id, $quantity, $unit_price, $total_amount]);
    $reserve_crop_id = $pdo->lastInsertId();

    // 4. Insert into reservation
    $reservationSql = "INSERT INTO reservation (reserve_crop_id, collection_date, reservation_status, transaction_status) VALUES (?, ?, 'pending', 'unpaid')";
    $reservationStmt = $pdo->prepare($reservationSql);
    $reservationStmt->execute([$reserve_crop_id, $collection_date]);

    $pdo->commit();

    echo json_encode(["success" => true, "message" => "Pre-order placed successfully!"]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
