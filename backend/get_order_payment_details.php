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
            r.reservation_source,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.crop_name ELSE c.crop_name END AS crop_name,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_unit_price ELSE rc.unit_price END AS unit_price,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_total_amount ELSE rc.total_amount END AS total_amount,
            r.collection_date,
            r.reservation_status,
            r.transaction_status,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_quantity ELSE rc.quantity_requested END AS quantity_requested,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.unit ELSE 'kg' END AS unit,
            cr.request_status AS cultivation_request_status,
            (SELECT COUNT(*) FROM payment p WHERE p.reservation_id = r.reservation_id AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_count,
            (SELECT COALESCE(SUM(p.amount), 0) FROM payment p WHERE p.reservation_id = r.reservation_id AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_amount,
            (SELECT COALESCE(SUM(p.amount), 0) FROM payment p WHERE p.reservation_id = r.reservation_id AND p.payment_status = 'completed') AS amount_already_paid,
            u_farmer.name as farmer_name,
            f.verified_status as farmer_verified
        FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source = 'crop' AND r.reserve_crop_id = rc.reserve_crop_id
        LEFT JOIN crop c ON rc.crop_id = c.crop_id
        LEFT JOIN cultivation_request cr ON r.reservation_source = 'cultivation' AND r.cultivation_request_id = cr.cultivation_request_id
        LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id = ca.cultivation_ad_id
        JOIN farmer f ON f.farmer_id = CASE WHEN r.reservation_source = 'cultivation' THEN ca.farmer_id ELSE c.farmer_id END
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        WHERE r.reservation_id = ?
          AND ((r.reservation_source = 'crop' AND rc.buyer_id = ?)
            OR (r.reservation_source = 'cultivation' AND cr.buyer_id = ?))
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$orderId, $buyer_id, $buyer_id]);
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

    $isCultivation = $order['reservation_source'] === 'cultivation';
    $cultivationAccepted = !$isCultivation || $order['cultivation_request_status'] === 'accepted';
    $isAdvancePayable = $resStatus === 'confirmed' && $txStatus === 'unpaid' && $cultivationAccepted;
    $expectedAdvance = round((float)$order['total_amount'] / 3);
    $validCultivationAdvance = !$isCultivation || ((int)$order['completed_advance_count'] === 1
        && abs((float)$order['completed_advance_amount'] - $expectedAdvance) <= 0.01);
    $isFinalPayable = $resStatus === 'ready' && $txStatus === 'partially_paid' && $cultivationAccepted && $validCultivationAdvance;
    if (!$isAdvancePayable && !$isFinalPayable) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "This order is not in a payable status. Current status: " . strtoupper($resStatus)
        ]);
        exit;
    }

    // Server-side calculation of amounts
    $quantity = floatval($order['quantity_requested']);
    $pricePerUnit = floatval($order['unit_price']);
    $subtotal = floatval($order['total_amount']);
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
            "source" => $order['reservation_source'],
            "cropName" => $order['crop_name'],
            "cropEmoji" => $cropEmoji,
            "pricePerUnit" => $pricePerUnit,
            "farmerName" => $order['farmer_name'],
            "farmerVerified" => intval($order['farmer_verified']) === 1,
            "quantity" => $quantity,
            "unit" => $order['unit'],
            "collectionDate" => $order['collection_date'],
            "reservationStatus" => $resStatus,
            "transactionStatus" => $txStatus,
            "paymentStatus" => $isAdvancePayable ? 'pending' : 'partial',
            "paymentStage" => $isAdvancePayable ? 'advance' : 'final',
            "subtotal" => $subtotal,
            "amountAlreadyPaid" => floatval($order['amount_already_paid']),
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
