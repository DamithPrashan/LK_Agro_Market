<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once 'auth_check.php';

// Ensure user is logged in
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$name = isset($data['name']) ? trim($data['name']) : '';
$contact = isset($data['contact']) ? trim($data['contact']) : '';
$district = isset($data['district']) ? trim($data['district']) : '';
$language = isset($data['language']) ? trim($data['language']) : '';

if (empty($name) || empty($contact) || empty($district) || empty($language)) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}

$userId = $_SESSION['user']['id'];

try {
    // Map contact -> phone, district -> location, id -> user_id
    $stmt = $pdo->prepare("UPDATE user SET name = ?, phone = ?, location = ?, language = ? WHERE user_id = ?");
    $stmt->execute([$name, $contact, $district, $language, $userId]);

    // Update session data
    $_SESSION['user']['name'] = $name;
    $_SESSION['user']['contact'] = $contact;
    $_SESSION['user']['district'] = $district;
    $_SESSION['user']['language'] = $language;

    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully."
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
