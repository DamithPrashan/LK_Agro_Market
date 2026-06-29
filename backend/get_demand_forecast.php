<?php
// Set headers for JSON response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 1. Database Connection Configuration
$host = "127.0.0.1";
$db_name = "lk_agro_market";
$username = "root";
$password = "";
$conn = null;

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $exception->getMessage()
    ]);
    exit();
}

// 2. Validate GET Parameters
$crop_name = isset($_GET['crop_name']) ? trim($_GET['crop_name']) : null;
$location  = isset($_GET['location']) ? trim($_GET['location']) : null;
$days      = isset($_GET['days']) ? intval($_GET['days']) : 30;

// Restrict lookback days to standard options
if (!in_array($days, [7, 14, 30])) {
    $days = 30; 
}

if (empty($crop_name) || empty($location)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Missing required query parameters: 'crop_name' and 'location' are mandatory."
    ]);
    exit();
}

try {
    // 3. Demand Forecast & Price Aggregation Query (From pre-orders / reserve_crop)
    $demand_query = "SELECT 
                        COUNT(rc.reserve_crop_id) as total_pre_orders,
                        SUM(rc.quantity_requested) as forecasted_demand_qty,
                        COUNT(DISTINCT rc.buyer_id) as unique_buyers,
                        AVG(rc.quantity_requested) as average_order_size,
                        MIN(rc.unit_price) as min_pre_order_price,
                        MAX(rc.unit_price) as max_pre_order_price,
                        AVG(rc.unit_price) as avg_pre_order_price
                      FROM reserve_crop rc
                      INNER JOIN crop c ON rc.crop_id = c.crop_id
                      WHERE LOWER(c.crop_name) = LOWER(:crop_name)
                        AND LOWER(c.location) = LOWER(:location)
                        AND rc.reserved_date >= DATE_SUB(NOW(), INTERVAL :days DAY)
                        AND rc.status != 'cancelled'";

    $demand_stmt = $conn->prepare($demand_query);
    $demand_stmt->bindParam(':crop_name', $crop_name);
    $demand_stmt->bindParam(':location', $location);
    $demand_stmt->bindParam(':days', $days, PDO::PARAM_INT);
    $demand_stmt->execute();
    $demand_row = $demand_stmt->fetch(PDO::FETCH_ASSOC);

    // 4. Farmer Cultivation Metrics Query (From crop listings in the same district)
    $cultivation_query = "SELECT 
                            COUNT(DISTINCT farmer_id) as active_farmers,
                            SUM(cultivate_area) as total_cultivated_area,
                            AVG(cultivate_area) as avg_cultivated_area,
                            AVG(quantity) as avg_farmer_available_qty
                          FROM crop
                          WHERE LOWER(crop_name) = LOWER(:crop_name)
                            AND LOWER(location) = LOWER(:location)
                            AND crop_status = 'active'";

    $cultivation_stmt = $conn->prepare($cultivation_query);
    $cultivation_stmt->bindParam(':crop_name', $crop_name);
    $cultivation_stmt->bindParam(':location', $location);
    $cultivation_stmt->execute();
    $cultivation_row = $cultivation_stmt->fetch(PDO::FETCH_ASSOC);

    // Format metrics cleanly
    $total_demand   = $demand_row['forecasted_demand_qty'] ? floatval($demand_row['forecasted_demand_qty']) : 0.00;
    $unique_buyers  = $demand_row['unique_buyers'] ? intval($demand_row['unique_buyers']) : 0;
    $avg_order_size = $demand_row['average_order_size'] ? floatval($demand_row['average_order_size']) : 0.00;

    // Output JSON structure
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "meta" => [
            "crop_name" => strtolower($crop_name),
            "location" => strtolower($location),
            "lookback_period_days" => $days,
            "generated_at" => date("Y-m-d H:i:s")
        ],
        "demand_metrics" => [
            "total_pre_orders_placed" => $demand_row['total_pre_orders'] ? intval($demand_row['total_pre_orders']) : 0,
            "total_quantity_demanded" => $total_demand,
            "unique_buyers_count" => $unique_buyers,
            "average_quantity_per_order" => round($avg_order_size, 2)
        ],
        "pricing_insights" => [
            "min_pre_order_price" => $demand_row['min_pre_order_price'] ? floatval($demand_row['min_pre_order_price']) : 0.00,
            "max_pre_order_price" => $demand_row['max_pre_order_price'] ? floatval($demand_row['max_pre_order_price']) : 0.00,
            "avg_pre_order_price" => $demand_row['avg_pre_order_price'] ? round(floatval($demand_row['avg_pre_order_price']), 2) : 0.00
        ],
        "supply_cultivation_insights" => [
            "active_farmers_count" => $cultivation_row['active_farmers'] ? intval($cultivation_row['active_farmers']) : 0,
            "total_cultivated_area" => $cultivation_row['total_cultivated_area'] ? floatval($cultivation_row['total_cultivated_area']) : 0.00,
            "average_cultivated_area_per_farmer" => $cultivation_row['avg_cultivated_area'] ? round(floatval($cultivation_row['avg_cultivated_area']), 2) : 0.00,
            "average_available_quantity_per_farmer" => $cultivation_row['avg_farmer_available_qty'] ? round(floatval($cultivation_row['avg_farmer_available_qty']), 2) : 0.00
        ]
    ]);

} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "An error occurred while building the report: " . $exception->getMessage()
    ]);
}
?>