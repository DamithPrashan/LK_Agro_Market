<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$email = isset($data['email']) ? trim($data['email']) : '';
$token = isset($data['token']) ? trim($data['token']) : '';
$newPassword = isset($data['new_password']) ? $data['new_password'] : '';

if (empty($email) || empty($token) || empty($newPassword)) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}

if (strlen($newPassword) < 6) {
    echo json_encode(["success" => false, "message" => "Password must be at least 6 characters long."]);
    exit;
}

// Ensure reset columns exist
try {
    $pdo->exec("ALTER TABLE user ADD COLUMN reset_token VARCHAR(255) NULL");
} catch (Exception $e) {}
try {
    $pdo->exec("ALTER TABLE user ADD COLUMN reset_token_expiry DATETIME NULL");
} catch (Exception $e) {}

try {
    $stmt = $pdo->prepare("SELECT user_id, reset_token, reset_token_expiry FROM user WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["success" => false, "message" => "User account not found."]);
        exit;
    }

    if (empty($user['reset_token']) || $user['reset_token'] !== $token) {
        echo json_encode(["success" => false, "message" => "Invalid or expired reset token."]);
        exit;
    }

    if (empty($user['reset_token_expiry']) || strtotime($user['reset_token_expiry']) < time()) {
        echo json_encode(["success" => false, "message" => "Reset link has expired. Please request a new password reset."]);
        exit;
    }

    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    $updateStmt = $pdo->prepare("UPDATE user SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?");
    $updateStmt->execute([$hashedPassword, $email]);

    echo json_encode([
        "success" => true,
        "message" => "Your password has been reset successfully. You can now log in."
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error resetting password: " . $e->getMessage()]);
}
