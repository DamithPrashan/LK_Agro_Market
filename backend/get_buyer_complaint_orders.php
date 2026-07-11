<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in
require_login();

$user_id = $_SESSION['user']['id'];
global $pdo;

try {
    // Retrieve buyer_id associated with the logged-in user_id
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

    // Retrieve only accepted (confirmed/ready) or completed reservations for the logged-in buyer
    $sql = "
        SELECT 
            r.reservation_id as id,
            c.crop_name,
            rc.quantity_requested as quantity,
            rc.total_amount as total_price,
            r.collection_date as date,
            u_farmer.name as farmer_name
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop c ON rc.crop_id = c.crop_id
        JOIN farmer f ON c.farmer_id = f.farmer_id
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        WHERE rc.buyer_id = ? AND r.reservation_status IN ('confirmed', 'ready', 'completed')
        ORDER BY r.reservation_id DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$buyer_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orders = [];
    foreach ($rows as $row) {
        $orders[] = [
            "id" => intval($row['id']),
            "orderId" => "ORD" . $row['id'],
            "cropName" => $row['crop_name'],
            "quantity" => floatval($row['quantity']),
            "totalPrice" => floatval($row['total_price']),
            "date" => $row['date'],
            "farmerName" => $row['farmer_name']
        ];
    }

    echo json_encode([
        "success" => true,
        "orders" => $orders
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
