<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../../connection/db.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../controller/RatingController.php';

// Ensure user is logged in
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$raw = file_get_contents("php://input");
try { $data = json_decode((string)$raw, true, 512, JSON_THROW_ON_ERROR); }
catch (JsonException $error) { http_response_code(400); echo json_encode(["success" => false, "message" => "Request body must contain valid JSON."]); exit; }
if (!is_array($data)) { http_response_code(400); echo json_encode(["success" => false, "message" => "Request body must be a JSON object."]); exit; }
$reviewer_user_id = $_SESSION['user']['id'];

try {
    $controller = new RatingController($pdo);
    $response = $controller->submitRating($data, $reviewer_user_id);
    echo json_encode($response);
} catch (Exception $e) {
    error_log('Rating submission failed: '.$e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to submit rating."]);
}
