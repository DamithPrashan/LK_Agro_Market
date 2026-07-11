<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in and is a farmer
require_login();
require_role('farmer');

$user_id = $_SESSION['user']['id'];

// Get POST JSON data
$data = json_decode(file_get_contents("php://input"), true);
$order_id = isset($data['order_id']) ? intval($data['order_id']) : 0;
$action = isset($data['action']) ? trim($data['action']) : '';

if ($order_id <= 0 || empty($action)) {
    echo json_encode(["success" => false, "message" => "Invalid parameters."]);
    exit;
}

try {
    // 1. Get farmer details
    $farmerQuery = $pdo->prepare("SELECT farmer_id FROM farmer WHERE user_id = ?");
    $farmerQuery->execute([$user_id]);
    $farmer = $farmerQuery->fetch();
    
    if (!$farmer) {
        echo json_encode(["success" => false, "message" => "Unauthorized: Logged in user is not registered as a farmer."]);
        exit;
    }
    
    $farmer_id = $farmer['farmer_id'];

    // 2. Verify that this order belongs to a crop of this farmer
    $checkQuery = $pdo->prepare("
        SELECT r.reservation_id 
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop c ON rc.crop_id = c.crop_id
        WHERE r.reservation_id = ? AND c.farmer_id = ?
    ");
    $checkQuery->execute([$order_id, $farmer_id]);
    if (!$checkQuery->fetch()) {
        echo json_encode(["success" => false, "message" => "Unauthorized access to this order."]);
        exit;
    }

    $pdo->beginTransaction();

    if ($action === 'accept') {
        $pdo->prepare("UPDATE reservation SET reservation_status = 'confirmed' WHERE reservation_id = ?")->execute([$order_id]);
        $pdo->prepare("
            UPDATE reserve_crop rc 
            JOIN reservation r ON rc.reserve_crop_id = r.reserve_crop_id 
            SET rc.status = 'confirmed' 
            WHERE r.reservation_id = ?
        ")->execute([$order_id]);
    } elseif ($action === 'decline') {
        $pdo->prepare("UPDATE reservation SET reservation_status = 'cancelled' WHERE reservation_id = ?")->execute([$order_id]);
        $pdo->prepare("
            UPDATE reserve_crop rc 
            JOIN reservation r ON rc.reserve_crop_id = r.reserve_crop_id 
            SET rc.status = 'cancelled' 
            WHERE r.reservation_id = ?
        ")->execute([$order_id]);
    } elseif ($action === 'ready') {
        $pdo->prepare("UPDATE reservation SET reservation_status = 'ready' WHERE reservation_id = ?")->execute([$order_id]);
    } elseif ($action === 'complete') {
        $pdo->prepare("UPDATE reservation SET reservation_status = 'completed', completion_date = NOW() WHERE reservation_id = ?")->execute([$order_id]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid action."]);
        $pdo->rollBack();
        exit;
    }

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Order updated successfully."]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
