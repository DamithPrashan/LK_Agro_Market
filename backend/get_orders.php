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

try {
    // Find buyer_id for user_id
    $buyerQuery = $pdo->prepare("SELECT buyer_id FROM buyer WHERE user_id = ?");
    $buyerQuery->execute([$user_id]);
    $buyer = $buyerQuery->fetch();
    
    if (!$buyer) {
        echo json_encode(["success" => true, "orders" => []]);
        exit;
    }
    
    $buyer_id = $buyer['buyer_id'];

    // Select completed reservations to display in the dropdown
    $sql = "
        SELECT 
            r.reservation_id as id, 
            c.crop_name, 
            rc.quantity, 
            rc.price_per_unit,
            (rc.quantity * rc.price_per_unit) as total_price,
            DATE_FORMAT(r.created_at, '%b %d, %Y') as date,
            u_farmer.name as farmer_name
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop c ON rc.crop_id = c.crop_id
        JOIN farmer f ON c.farmer_id = f.farmer_id
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        WHERE rc.buyer_id = ?
        ORDER BY r.reservation_id DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$buyer_id]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
