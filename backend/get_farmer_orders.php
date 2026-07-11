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
            c.crop_name as crop,
            rc.quantity_requested as quantity,
            rc.unit_price,
            rc.total_amount,
            DATE_FORMAT(r.collection_date, '%Y-%m-%d') as date,
            r.reservation_status as status,
            r.transaction_status as payment,
            u_buyer.name as buyer
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop c ON rc.crop_id = c.crop_id
        JOIN buyer b ON rc.buyer_id = b.buyer_id
        JOIN user u_buyer ON b.user_id = u_buyer.user_id
        WHERE c.farmer_id = ?
        ORDER BY r.reservation_id DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$farmer_id]);
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
            "buyer" => $order['buyer'],
            "crop" => $order['crop'],
            "quantity" => floatval($order['quantity']) . " kg",
            "date" => $order['date'],
            "status" => $statusUI,
            "payment" => $paymentUI,
            "db_id" => intval($order['id']) // keep actual numeric ID for requests
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
