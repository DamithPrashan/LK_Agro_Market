<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once __DIR__ . '/../../connection/db.php';
require_once __DIR__ . '/../auth_check.php';

require_notification_access();
$user_id = $_SESSION['user']['id'];

try {
    $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
    $stmt->execute([$user_id]);

    echo json_encode([
        "success" => true,
        "message" => "All notifications marked as read."
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>

