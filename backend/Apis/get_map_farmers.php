<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

require_once '../connection/db.php';
require_once '../connection/district_coords.php';
require_once 'auth_check.php';

// Ensure buyer is logged in
require_login();

try {
    $whereClauses = ["c.crop_status = 'active'"];
    $params = [];

    // Filter by District (user's registered location/district or crop location)
    if (isset($_GET['district']) && trim($_GET['district']) !== '' && trim($_GET['district']) !== 'All' && trim($_GET['district']) !== 'All Districts') {
        $whereClauses[] = "(u.location = ? OR c.location = ?)";
        $district = trim($_GET['district']);
        $params[] = $district;
        $params[] = $district;
    }

    // Filter by Crop Category/Type
    if (isset($_GET['crop_type']) && trim($_GET['crop_type']) !== '' && trim($_GET['crop_type']) !== 'All' && trim($_GET['crop_type']) !== 'All Crops') {
        $whereClauses[] = "(c.category = ? OR c.crop_name = ?)";
        $cropType = trim($_GET['crop_type']);
        $params[] = $cropType;
        $params[] = $cropType;
    }

    // Filter by Price range
    if (isset($_GET['min_price']) && trim($_GET['min_price']) !== '') {
        $whereClauses[] = "c.price_per_unit >= ?";
        $params[] = floatval($_GET['min_price']);
    }
    if (isset($_GET['max_price']) && trim($_GET['max_price']) !== '') {
        $whereClauses[] = "c.price_per_unit <= ?";
        $params[] = floatval($_GET['max_price']);
    }

    // Filter by Harvest Date (before a selected date)
    if (isset($_GET['harvest_before']) && trim($_GET['harvest_before']) !== '') {
        $whereClauses[] = "c.harvest_date <= ?";
        $params[] = trim($_GET['harvest_before']);
    }

    // Filter by Verified only
    if (isset($_GET['verified_only']) && ($_GET['verified_only'] === '1' || $_GET['verified_only'] === 'true')) {
        $whereClauses[] = "f.verified_status = 1";
    }

    $sql = "
        SELECT 
            f.farmer_id,
            u.name AS farmer_name,
            u.location AS user_location,
            f.verified_status,
            fv.farm_location,
            c.crop_id,
            c.crop_name,
            c.category,
            c.quantity,
            c.price_per_unit,
            c.harvest_date,
            COALESCE((
                SELECT AVG(r.rating) 
                FROM ratings_review r 
                WHERE r.reviewee_id = u.user_id AND r.is_removed = 0
            ), 5.0) as rating_average,
            COALESCE((
                SELECT COUNT(r.rating) 
                FROM ratings_review r 
                WHERE r.reviewee_id = u.user_id AND r.is_removed = 0
            ), 0) as rating_count
        FROM farmer f
        JOIN user u ON f.user_id = u.user_id
        LEFT JOIN farmer_verification fv ON f.farmer_id = fv.farmer_id
        JOIN crop c ON c.farmer_id = f.farmer_id
    ";

    if (!empty($whereClauses)) {
        $sql .= " WHERE " . implode(" AND ", $whereClauses);
    }

    $sql .= " ORDER BY f.farmer_id, c.harvest_date ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $farmers = [];
    foreach ($rows as $row) {
        $fid = $row['farmer_id'];
        if (!isset($farmers[$fid])) {
            // Parse coordinates
            $lat = null;
            $lng = null;
            if (!empty($row['farm_location'])) {
                if (preg_match('/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/', trim($row['farm_location']), $matches)) {
                    $lat = floatval($matches[1]);
                    $lng = floatval($matches[2]);
                }
            }
            
            if ($lat === null || $lng === null) {
                // Fallback to user_location (district)
                $district = trim($row['user_location']);
                if (defined('DISTRICT_COORDINATES') && isset(DISTRICT_COORDINATES[$district])) {
                    $lat = DISTRICT_COORDINATES[$district][0];
                    $lng = DISTRICT_COORDINATES[$district][1];
                } else {
                    // Center of Sri Lanka fallback
                    $lat = 7.8731;
                    $lng = 80.7718;
                }
            }

            $farmers[$fid] = [
                "farmer_id" => intval($fid),
                "farmer_name" => $row['farmer_name'],
                "location" => $row['user_location'],
                "verified_status" => intval($row['verified_status']),
                "latitude" => $lat,
                "longitude" => $lng,
                "rating_average" => round(floatval($row['rating_average']), 1),
                "rating_count" => intval($row['rating_count']),
                "active_crop_count" => 0,
                "crops" => []
            ];
        }

        $farmers[$fid]['crops'][] = [
            "crop_id" => intval($row['crop_id']),
            "crop_name" => $row['crop_name'],
            "category" => $row['category'],
            "quantity" => floatval($row['quantity']),
            "price_per_unit" => floatval($row['price_per_unit']),
            "harvest_date" => $row['harvest_date']
        ];
    }

    // Set count of crops for each farmer
    foreach ($farmers as $fid => &$f) {
        $f['active_crop_count'] = count($f['crops']);
    }

    echo json_encode([
        "success" => true,
        "farmers" => array_values($farmers)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
