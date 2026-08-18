<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once '../Apis/auth_check.php';
require_once '../services/order_resolver.php';

// Ensure user is logged in
require_login();

$user_id = $_SESSION['user']['id'];
$role = $_SESSION['user']['role'];

try {
    if (!in_array($role, ['buyer', 'farmer'], true)) {
        echo json_encode(["success" => true, "orders" => []]);
        exit;
    }

    $orders = find_completed_unrated_orders($pdo, (int)$user_id, $role);

    echo json_encode([
        "success" => true,
        "orders" => $orders
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
