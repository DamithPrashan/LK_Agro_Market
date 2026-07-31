<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

require_once '../connection/db.php';
require_once 'auth_check.php';

// Ensure buyer is logged in
require_login();

try {
    $days = isset($_GET['days']) && is_numeric($_GET['days']) ? intval($_GET['days']) : 60;
    
    $sql = "
        SELECT 
            c.crop_id,
            c.crop_name,
            c.category,
            u.name AS farmer_name,
            u.location AS district,
            c.quantity,
            c.price_per_unit,
            c.harvest_date
        FROM crop c
        JOIN farmer f ON c.farmer_id = f.farmer_id
        JOIN user u ON f.user_id = u.user_id
        WHERE c.crop_status = 'active'
          AND c.harvest_date >= CURDATE()
          AND c.harvest_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        ORDER BY c.harvest_date ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$days]);
    $calendarItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format fields
    foreach ($calendarItems as &$item) {
        $item['crop_id'] = intval($item['crop_id']);
        $item['quantity'] = floatval($item['quantity']);
        $item['price_per_unit'] = floatval($item['price_per_unit']);
    }

    echo json_encode([
        "success" => true,
        "calendar" => $calendarItems
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
