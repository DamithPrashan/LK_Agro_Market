<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once __DIR__ . '/../connection/db.php';
require_once __DIR__ . '/auth_check.php';
require_once __DIR__ . '/../controller/MessageController.php';

// Protect route
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed. Use GET."]);
    exit;
}

$userId = $_SESSION['user']['id'];

try {
    $controller = new MessageController($pdo);
    $controller->getUnreadCount($userId);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
