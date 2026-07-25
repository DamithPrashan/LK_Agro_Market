<?php
function create_notification($user_id, $title, $message) {
    global $pdo;
    if (!isset($pdo)) {
        require_once __DIR__ . '/connection/db.php';
    }
    try {
        $stmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)");
        return $stmt->execute([$user_id, $title, $message]);
    } catch (Exception $e) {
        error_log("Failed to create notification: " . $e->getMessage());
        return false;
    }
}
?>
