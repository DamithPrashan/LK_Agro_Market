<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once '../Apis/auth_check.php';

// Ensure user is logged in
require_login();

$user_id = $_SESSION['user']['id'];
$role = $_SESSION['user']['role'];

try {
    if ($role === 'buyer') {
        // Find buyer_id for user_id
        $buyerQuery = $pdo->prepare("SELECT buyer_id FROM buyer WHERE user_id = ?");
        $buyerQuery->execute([$user_id]);
        $buyer = $buyerQuery->fetch();
        if (!$buyer) {
            echo json_encode(["success" => true, "orders" => []]);
            exit;
        }
        $buyer_id = $buyer['buyer_id'];

        // Get completed/partially paid reservations for buyer where reviewer_id has not rated it yet
        $sql = "
            SELECT 
                r.reservation_id as id, 
                c.crop_name, 
                u_farmer.name as other_party_name 
            FROM reservation r
            JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
            JOIN crop c ON rc.crop_id = c.crop_id
            JOIN farmer f ON c.farmer_id = f.farmer_id
            JOIN user u_farmer ON f.user_id = u_farmer.user_id
            LEFT JOIN ratings_review rr ON r.reservation_id = rr.reservation_id AND rr.reviewer_id = ?
            WHERE rc.buyer_id = ? 
              AND r.transaction_status IN ('partially_paid', 'paid') 
              AND r.reservation_status != 'cancelled' 
              AND rr.review_id IS NULL
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id, $buyer_id]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } else if ($role === 'farmer') {
        // Find farmer_id for user_id
        $farmerQuery = $pdo->prepare("SELECT farmer_id FROM farmer WHERE user_id = ?");
        $farmerQuery->execute([$user_id]);
        $farmer = $farmerQuery->fetch();
        if (!$farmer) {
            echo json_encode(["success" => true, "orders" => []]);
            exit;
        }
        $farmer_id = $farmer['farmer_id'];

        // Get completed/partially paid reservations for farmer where reviewer_id has not rated it yet
        $sql = "
            SELECT 
                r.reservation_id as id, 
                c.crop_name, 
                u_buyer.name as other_party_name 
            FROM reservation r
            JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
            JOIN crop c ON rc.crop_id = c.crop_id
            JOIN buyer b ON rc.buyer_id = b.buyer_id
            JOIN user u_buyer ON b.user_id = u_buyer.user_id
            LEFT JOIN ratings_review rr ON r.reservation_id = rr.reservation_id AND rr.reviewer_id = ?
            WHERE c.farmer_id = ? 
              AND r.transaction_status IN ('partially_paid', 'paid') 
              AND r.reservation_status != 'cancelled' 
              AND rr.review_id IS NULL
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id, $farmer_id]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } else {
        echo json_encode(["success" => true, "orders" => []]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "orders" => $orders
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
