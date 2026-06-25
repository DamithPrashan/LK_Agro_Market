<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once 'auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';

if (empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Please enter your email and password."]);
    exit;
}

try {
    // Select user and left join with farmer to get verified_status
    $stmt = $pdo->prepare("
        SELECT u.*, f.verified_status 
        FROM user u 
        LEFT JOIN farmer f ON u.user_id = f.user_id 
        WHERE u.email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Map user fields to what the frontend expects
        $userResponse = [
            "id" => intval($user['user_id']),
            "name" => $user['name'],
            "email" => $user['email'],
            "contact" => $user['phone'],
            "district" => $user['location'],
            "language" => $user['language'] ?? 'sinhala',
            "role" => $user['role'],
            "verified" => (isset($user['verified_status']) && intval($user['verified_status']) === 1)
        ];

        // Start session
        $_SESSION['user'] = $userResponse;

        echo json_encode([
            "success" => true,
            "user" => $userResponse
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Invalid email or password."
        ]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
