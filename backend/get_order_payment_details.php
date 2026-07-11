<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in as buyer
require_role('buyer');

$orderIdRaw = isset($_GET['orderId']) ? trim($_GET['orderId']) : '';
$orderId = intval(str_replace('ORD', '', $orderIdRaw));

if ($orderId <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid order ID format."
    ]);
    exit;
}

$user_id = $_SESSION['user']['id'];
global $pdo;

try {
    // 1. Get buyer_id
    $buyerQuery = $pdo->prepare("SELECT buyer_id FROM buyer WHERE user_id = ?");
    $buyerQuery->execute([$user_id]);
    $buyer = $buyerQuery->fetch();

    if (!$buyer) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Buyer account not found for current session."
        ]);
        exit;
    }

    $buyer_id = intval($buyer['buyer_id']);

    // 2. Query order payment details
    $sql = "
        SELECT 
            r.reservation_id,
            c.crop_name,
            c.price_per_unit,
            r.collection_date,
            r.reservation_status,
            r.transaction_status,
            rc.quantity_requested,
            u_farmer.name as farmer_name,
            f.verified_status as farmer_verified
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop c ON rc.crop_id = c.crop_id
        JOIN farmer f ON c.farmer_id = f.farmer_id
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        WHERE r.reservation_id = ? AND rc.buyer_id = ?
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$orderId, $buyer_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Order not found or access denied."
        ]);
        exit;
    }

    // 3. Verify status
    $resStatus = strtolower($order['reservation_status']);
    $txStatus = strtolower($order['transaction_status']);

    // Only orders in 'confirmed' or 'ready' status are payable
    if (!in_array($resStatus, ['confirmed', 'ready'], true)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "This order is not in a payable status. Current status: " . strtoupper($resStatus)
        ]);
        exit;
    }

    // Check transaction status (should not be already paid)
    if ($txStatus === 'paid') {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "This order is already fully paid."
        ]);
        exit;
    }

    // Server-side calculation of amounts
    $quantity = floatval($order['quantity_requested']);
    $pricePerUnit = floatval($order['price_per_unit']);
    
    $subtotal = $quantity * $pricePerUnit;
    $prePaymentDue = round($subtotal / 3);
    $balanceOnCollection = $subtotal - $prePaymentDue;

    // Use emoji based on crop name
    $cropEmoji = "🥦"; // default
    $nameLower = strtolower($order['crop_name']);
    if (strpos($nameLower, 'tomato') !== false) $cropEmoji = "🍅";
    elseif (strpos($nameLower, 'carrot') !== false) $cropEmoji = "🥕";
    elseif (strpos($nameLower, 'potato') !== false) $cropEmoji = "🥔";
    elseif (strpos($nameLower, 'onion') !== false) $cropEmoji = "🧅";
    elseif (strpos($nameLower, 'banana') !== false) $cropEmoji = "🍌";
    elseif (strpos($nameLower, 'watermelon') !== false) $cropEmoji = "🍉";
    elseif (strpos($nameLower, 'grapes') !== false) $cropEmoji = "🍇";
    elseif (strpos($nameLower, 'pineapple') !== false) $cropEmoji = "🍍";

    echo json_encode([
        "success" => true,
        "order" => [
            "id" => intval($order['reservation_id']),
            "orderId" => "ORD" . $order['reservation_id'],
            "cropName" => $order['crop_name'],
            "cropEmoji" => $cropEmoji,
            "pricePerUnit" => $pricePerUnit,
            "farmerName" => $order['farmer_name'],
            "farmerVerified" => intval($order['farmer_verified']) === 1,
            "quantity" => $quantity,
            "collectionDate" => $order['collection_date'],
            "paymentStatus" => ($txStatus === 'unpaid') ? 'pending' : 'partial', // partial means prepayment is already paid, paying balance now
            "subtotal" => $subtotal,
            "prePaymentDue" => $prePaymentDue,
            "balanceOnCollection" => $balanceOnCollection
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
