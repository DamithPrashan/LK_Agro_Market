<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in as admin
require_role('admin');

try {
    // Select all complaints with buyer, farmer and crop info
    $sql = "
        SELECT 
            c.id as complaint_id,
            c.reservation_id,
            c.reason,
            c.status,
            c.created_at,
            u_buyer.name as buyer_name,
            u_farmer.name as farmer_name,
            cr.crop_name
        FROM complaints c
        JOIN buyer b ON c.buyer_id = b.buyer_id
        JOIN user u_buyer ON b.user_id = u_buyer.user_id
        JOIN reservation r ON c.reservation_id = r.reservation_id
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop cr ON rc.crop_id = cr.crop_id
        JOIN farmer f ON cr.farmer_id = f.farmer_id
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        ORDER BY c.created_at DESC
    ";

    $stmt = $pdo->query($sql);
    $complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "complaints" => $complaints
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
