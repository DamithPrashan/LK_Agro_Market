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

    $pdo->beginTransaction();

    // 2. Fetch crop details inside the transaction and lock the row to avoid race conditions
    $cropQuery = $pdo->prepare("SELECT price_per_unit, quantity, crop_status, harvest_date FROM crop WHERE crop_id = ? FOR UPDATE");
    $cropQuery->execute([$crop_id]);
    $crop = $cropQuery->fetch();
    if (!$crop) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "Crop listing not found."]);
        exit;
    }
    if ($crop['crop_status'] !== 'active') {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "This crop listing is no longer active."]);
        exit;
    }
    if ($quantity > floatval($crop['quantity'])) {
        $pdo->rollBack();
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
        $pdo->rollBack();
        $formatted_max = $max_dt->format('Y-m-d');
        echo json_encode([
            "success" => false, 
            "message" => "Delivery date must be between {$harvest_date} and {$formatted_max}."
        ]);
        exit;
    }

    $unit_price = floatval($crop['price_per_unit']);
    $total_amount = $quantity * $unit_price;
    $new_quantity = floatval($crop['quantity']) - $quantity;

    // 3. Insert into reserve_crop
    $reserveSql = "INSERT INTO reserve_crop (buyer_id, crop_id, quantity_requested, unit_price, total_amount, status, reserved_date) VALUES (?, ?, ?, ?, ?, 'pending', NOW())";
    $reserveStmt = $pdo->prepare($reserveSql);
    $reserveStmt->execute([$buyer_id, $crop_id, $quantity, $unit_price, $total_amount]);
    $reserve_crop_id = $pdo->lastInsertId();

    // 4. Insert into reservation
    $reservationSql = "INSERT INTO reservation (reserve_crop_id, collection_date, reservation_status, transaction_status) VALUES (?, ?, 'pending', 'unpaid')";
    $reservationStmt = $pdo->prepare($reservationSql);
    $reservationStmt->execute([$reserve_crop_id, $collection_date]);

    // 5. Update crop available quantity
    $updateCropSql = "UPDATE crop SET quantity = ? WHERE crop_id = ?";
    $updateCropStmt = $pdo->prepare($updateCropSql);
    $updateCropStmt->execute([$new_quantity, $crop_id]);

    $pdo->commit();

    // Trigger Notification to Farmer
    try {
        require_once 'create_notification.php';
        $buyer_name = $_SESSION['user']['name'] ?? 'A buyer';
        
        $cropInfoStmt = $pdo->prepare("
            SELECT c.crop_name, u.user_id as farmer_user_id
            FROM crop c
            JOIN farmer f ON c.farmer_id = f.farmer_id
            JOIN user u ON f.user_id = u.user_id
            WHERE c.crop_id = ?
        ");
        $cropInfoStmt->execute([$crop_id]);
        $cropInfo = $cropInfoStmt->fetch();
        
        if ($cropInfo) {
            $farmer_user_id = $cropInfo['farmer_user_id'];
            $crop_name = $cropInfo['crop_name'];
            $notif_title = "New Order Received";
            $notif_msg = "{$buyer_name} has placed a new order for {$quantity} kg of {$crop_name}.";
            $notif_data = json_encode([
                "buyerName" => $buyer_name,
                "cropName" => $crop_name,
                "quantity" => $quantity
            ]);
            create_notification($farmer_user_id, $notif_title, $notif_msg, 'orderSubmitted', $notif_data);
        }
    } catch (Exception $e) {
        error_log("Notification error in place_preorder.php: " . $e->getMessage());
    }

    echo json_encode([
        "success" => true, 
        "message" => "Pre-order placed successfully!",
        "updated_quantity" => $new_quantity
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
