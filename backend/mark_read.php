<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

require_login();
$user_id = $_SESSION['user']['id'];

$data = json_decode(file_get_contents("php://input"), true);
$notification_id = isset($data['notification_id']) ? intval($data['notification_id']) : 0;
$mark_all = isset($data['mark_all']) ? filter_var($data['mark_all'], FILTER_VALIDATE_BOOLEAN) : false;

if (!$mark_all && $notification_id <= 0) {
    echo json_encode(["success" => false, "message" => "Please provide a valid notification_id or mark_all=true."]);
    exit;
}

try {
    if ($mark_all) {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $message = "All notifications marked as read.";
    } else {
        // Verify ownership before updating
        $checkStmt = $pdo->prepare("SELECT id FROM notifications WHERE id = ? AND user_id = ?");
        $checkStmt->execute([$notification_id, $user_id]);
        if (!$checkStmt->fetch()) {
            echo json_encode(["success" => false, "message" => "Notification not found or access denied."]);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
        $stmt->execute([$notification_id]);
        $message = "Notification marked as read.";
    }

    echo json_encode([
        "success" => true,
        "message" => $message
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
