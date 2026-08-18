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

    $pdo->beginTransaction();

    // Lock the order and crop so cancellation can restore accepted stock once.
    $sql = "
        SELECT 
            r.reservation_id,
            r.reservation_status,
            r.transaction_status,
            r.collection_date,
            rc.reserve_crop_id,
            rc.status AS reserve_status,
            rc.quantity_requested,
            rc.buyer_id,
            cr.crop_id,
            cr.quantity AS available_quantity,
            cr.crop_status,
            cr.crop_name,
            f.user_id as farmer_user_id
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop cr ON rc.crop_id = cr.crop_id
        JOIN farmer f ON cr.farmer_id = f.farmer_id
        WHERE r.reservation_id = ? AND rc.buyer_id = ?
        FOR UPDATE
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$orderId, $buyer_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        $pdo->rollBack();
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
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Completed orders cannot be cancelled."
        ]);
        exit;
    }
    
    if ($status === 'cancelled') {
        $pdo->rollBack();
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
        $updateStmt = $pdo->prepare("UPDATE reservation SET reservation_status = 'cancelled' WHERE reservation_id = ?");
        $updateStmt->execute([$orderId]);
        $pdo->prepare("UPDATE reserve_crop SET status = 'cancelled' WHERE reserve_crop_id = ?")
            ->execute([$order['reserve_crop_id']]);

        $pdo->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Pre-order reservation request cancelled successfully."
        ]);
        exit;

    } else if ($status === 'confirmed') {
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
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "This order can only be cancelled more than 48 hours before the collection date. If there's a genuine issue, please raise a complaint instead."
            ]);
            exit;
        }

        // More than 48 hours: allow cancellation, payment is non-refundable (forfeited)
        if ($order['reserve_status'] !== $status) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "Order status is inconsistent and cannot be cancelled safely."]);
            exit;
        }

        $restoredQuantity = floatval($order['available_quantity']) + floatval($order['quantity_requested']);
        $restoredStatus = ($order['crop_status'] === 'fulfilled' && $restoredQuantity > 0)
            ? 'active'
            : $order['crop_status'];

        $pdo->prepare("UPDATE crop SET quantity = ?, crop_status = ? WHERE crop_id = ?")
            ->execute([$restoredQuantity, $restoredStatus, $order['crop_id']]);
        $updateStmt = $pdo->prepare("UPDATE reservation SET reservation_status = 'cancelled' WHERE reservation_id = ?");
        $updateStmt->execute([$orderId]);
        $pdo->prepare("UPDATE reserve_crop SET status = 'cancelled' WHERE reserve_crop_id = ?")
            ->execute([$order['reserve_crop_id']]);

        // Insert notification to farmer
        require_once 'create_notification.php';
        $buyerName = $_SESSION['user']['name'] ?? 'A buyer';
        $notifMsg = "Buyer {$buyerName} has cancelled order ORD{$orderId} ({$order['crop_name']}).";
        $notif_data = json_encode([
            "orderId" => $orderId
        ]);
        create_notification($order['farmer_user_id'], 'Pre-Order Cancelled', $notifMsg, 'preorderCancelled', $notif_data);

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Order ORD{$orderId} has been successfully cancelled. Note: The 1/3 pre-payment is non-refundable and has been forfeited."
        ]);
        exit;
    }

    $pdo->rollBack();
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "Only pending or confirmed crop orders can be cancelled. Ready, completed, and cultivation orders require a separate resolution process."]);

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
