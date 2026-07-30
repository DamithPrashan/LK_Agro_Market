<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../connection/db.php';
require_once __DIR__ . '/../controller/RatingController.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

try {
    $controller = new RatingController($pdo);
    $response = $controller->getRatings($user_id);
    echo json_encode($response);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
