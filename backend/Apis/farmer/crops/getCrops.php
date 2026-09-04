<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';

// Ensure user is logged in
require_login();

$user_id = $_SESSION['user']['id'];
$role = $_SESSION['user']['role'];

try {
    if ($role === 'farmer') {
        // Fetch only crops belonging to the logged in farmer,
        // plus a boolean flag indicating whether the listing has any active order.
        $sql = "
            SELECT
                c.crop_id,
                c.farmer_id,
                c.crop_name,
                c.category,
                c.location,
                c.quantity,
                c.price_per_unit,
                c.growth_stage,
                c.harvest_date,
                c.crop_status,
                c.image_url,
                CASE WHEN (
                    SELECT COUNT(*)
                    FROM reserve_crop rc
                    JOIN reservation r ON r.reserve_crop_id = rc.reserve_crop_id
                    WHERE rc.crop_id = c.crop_id
                      AND r.reservation_status IN ('pending','confirmed','ready')
                ) > 0 THEN 1 ELSE 0 END AS has_active_orders
            FROM crop c
            JOIN farmer f ON c.farmer_id = f.farmer_id
            WHERE f.user_id = ? AND c.crop_status <> 'removed'
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $crops = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // Cast has_active_orders to a proper boolean for JSON
        foreach ($crops as &$crop) {
            $crop['has_active_orders'] = (bool)$crop['has_active_orders'];
        }
        unset($crop);

    } else {
        // Non-farmers see all crops or empty list
        $sql = "SELECT * FROM crop";
        $stmt = $pdo->query($sql);
        $crops = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode($crops);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
