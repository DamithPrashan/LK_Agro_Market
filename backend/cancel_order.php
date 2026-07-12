<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in as buyer
require_role('buyer');

$user_id = $_SESSION['user']['id'];
global $pdo;

// Parse JSON payload
$input = isset($mockInput) ? $mockInput : json_decode(file_get_contents("php://input"), true);
$orderIdRaw = isset($input['orderId']) ? trim($input['orderId']) : '';
$orderId = intval(str_replace('ORD', '', $orderIdRaw));

if ($orderId <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid order ID format."
    ]);
    exit;
}

try {
    // 1. Get buyer_id for the logged-in buyer
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

    // 2. Fetch reservation details along with crop and farmer information
    $sql = "
        SELECT 
            r.reservation_id,
            r.reservation_status,
            r.transaction_status,
            r.collection_date,
            rc.buyer_id,
            cr.crop_name,
            f.user_id as farmer_user_id
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop cr ON rc.crop_id = cr.crop_id
        JOIN farmer f ON cr.farmer_id = f.farmer_id
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

    $status = strtolower($order['reservation_status']);
    
    // Check if order is already completed or cancelled
    if ($status === 'completed') {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Completed orders cannot be cancelled."
        ]);
        exit;
    }
    
    if ($status === 'cancelled') {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "This order is already cancelled."
        ]);
        exit;
    }

    // Process cancellation rules based on order status (pending vs accepted)
    if ($status === 'pending') {
        // Pending orders can be cancelled freely
        $pdo->beginTransaction();
        
        // Update reservation status to cancelled
        $updateStmt = $pdo->prepare("UPDATE reservation SET reservation_status = 'cancelled' WHERE reservation_id = ?");
        $updateStmt->execute([$orderId]);

        $pdo->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Pre-order reservation request cancelled successfully."
        ]);
        exit;

    } else if ($status === 'confirmed' || $status === 'ready') {
        // Accepted orders: check if current date is more than 48 hours before collection date
        $collection_date = $order['collection_date']; // format YYYY-MM-DD
        
        $now = new DateTime();
        $collection_dt = new DateTime($collection_date . ' 00:00:00'); // Assume start of collection day
        
        // Calculate difference in hours
        $diff = $now->diff($collection_dt);
        $hours_remaining = ($diff->days * 24) + $diff->h;
        
        // If collection date is in the past, or diff is negative
        if ($collection_dt < $now) {
            $hours_remaining = 0;
        }

        if ($hours_remaining <= 48) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "This order can only be cancelled more than 48 hours before the collection date. If there's a genuine issue, please raise a complaint instead."
            ]);
            exit;
        }

        // More than 48 hours: allow cancellation, payment is non-refundable (forfeited)
        $pdo->beginTransaction();

        // Update reservation status to cancelled
        $updateStmt = $pdo->prepare("UPDATE reservation SET reservation_status = 'cancelled' WHERE reservation_id = ?");
        $updateStmt->execute([$orderId]);

        // Insert notification to farmer
        $farmer_msg = "Buyer has cancelled the accepted pre-order ORD{$orderId} for {$order['crop_name']}. The 1/3 pre-payment has been forfeited to you.";
        $notifyStmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message) VALUES (?, 'Pre-Order Cancelled', ?)");
        $notifyStmt->execute([$order['farmer_user_id'], $farmer_msg]);

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Order ORD{$orderId} has been successfully cancelled. Note: The 1/3 pre-payment is non-refundable and has been forfeited."
        ]);
        exit;
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
