<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in and is a farmer
require_login();
require_role('farmer');

$user_id = $_SESSION['user']['id'];

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

    // 2. Fetch orders
    $sql = "
        SELECT 
            r.reservation_id as id,
            r.reservation_source,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.crop_name ELSE c.crop_name END as crop,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_quantity ELSE rc.quantity_requested END as quantity,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_unit_price ELSE rc.unit_price END as unit_price,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_total_amount ELSE rc.total_amount END as total_amount,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.unit ELSE 'kg' END as unit,
            DATE_FORMAT(r.collection_date, '%Y-%m-%d') as date,
            r.reservation_status as status,
            r.transaction_status as payment,
            u_buyer.name as buyer,
            u_buyer.user_id as buyer_user_id,
            u_buyer.location as buyer_location,
            rr.rating as buyer_rating,
            rr.comment as buyer_comment,
            (SELECT COUNT(*) FROM message WHERE reservation_id = r.reservation_id AND sender_id = u_buyer.user_id AND is_read = 0) as unread_messages
        FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source = 'crop' AND r.reserve_crop_id = rc.reserve_crop_id
        LEFT JOIN crop c ON rc.crop_id = c.crop_id
        LEFT JOIN cultivation_request cr ON r.reservation_source = 'cultivation' AND r.cultivation_request_id = cr.cultivation_request_id
        LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id = ca.cultivation_ad_id
        JOIN buyer b ON b.buyer_id = CASE WHEN r.reservation_source = 'cultivation' THEN cr.buyer_id ELSE rc.buyer_id END
        JOIN user u_buyer ON b.user_id = u_buyer.user_id
        LEFT JOIN ratings_review rr ON r.reservation_id = rr.reservation_id AND rr.reviewer_id = u_buyer.user_id AND rr.is_removed = 0
        WHERE (r.reservation_source = 'crop' AND c.farmer_id = ?)
           OR (r.reservation_source = 'cultivation' AND ca.farmer_id = ? AND cr.request_status = 'accepted')
        ORDER BY r.reservation_id DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$farmer_id, $farmer_id]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format for frontend
    $formattedOrders = [];
    foreach ($orders as $order) {
        // Map status
        $statusUI = 'Pending';
        if ($order['status'] === 'confirmed') {
            $statusUI = 'Accepted';
        } elseif ($order['status'] === 'ready') {
            $statusUI = 'Ready';
        } elseif ($order['status'] === 'completed') {
            $statusUI = 'Completed';
        } elseif ($order['status'] === 'cancelled') {
            $statusUI = 'Declined';
        }

        // Map payment
        $paymentUI = 'Unpaid';
        if ($order['payment'] === 'paid') {
            $paymentUI = 'Paid (Full)';
        } elseif ($order['payment'] === 'partially_paid') {
            $paymentUI = 'Paid (1/3)';
        }

        $formattedOrders[] = [
            "id" => "#" . $order['id'],
            "reservation_source" => $order['reservation_source'],
            "buyer" => $order['buyer'],
            "crop" => $order['crop'],
            "quantity" => floatval($order['quantity']) . " " . $order['unit'],
            "unit_price" => floatval($order['unit_price']),
            "total_amount" => floatval($order['total_amount']),
            "date" => $order['date'],
            "status" => $statusUI,
            "payment" => $paymentUI,
            "lifecycle_status" => $order['status'] === 'cancelled' ? 'cancelled'
                : ($order['status'] === 'completed' && $order['payment'] === 'paid' ? 'completed'
                : ($order['status'] === 'confirmed' && $order['payment'] === 'unpaid' ? 'waiting_advance'
                : ($order['status'] === 'confirmed' && $order['payment'] === 'partially_paid' ? 'advance_paid'
                : ($order['status'] === 'ready' && $order['payment'] === 'partially_paid' ? 'waiting_final'
                : ($order['status'] === 'ready' && $order['payment'] === 'paid' ? 'ready_to_complete' : 'pending'))))),
            "db_id" => intval($order['id']), // keep actual numeric ID for requests
            "buyer_user_id" => intval($order['buyer_user_id']),
            "buyer_location" => $order['buyer_location'],
            "buyer_rating" => $order['buyer_rating'] !== null ? intval($order['buyer_rating']) : null,
            "buyer_comment" => $order['buyer_comment'],
            "unreadMessages" => intval($order['unread_messages'])
        ];
    }

    echo json_encode([
        "success" => true,
        "orders" => $formattedOrders
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
