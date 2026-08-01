<?php
function create_notification($user_id, $title, $message, $type = null, $data = null) {
    global $pdo;

    if (!isset($pdo)) {
        require_once __DIR__ . '/connection/db.php';
    }

    if (empty($user_id) || empty($title) || empty($message)) {
        error_log("Notification insert skipped: missing required values. user_id={$user_id}, title={$title}, message={$message}");
        return false;
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO notifications (user_id, title, message, type, data, is_read, created_at)
             VALUES (?, ?, ?, ?, ?, 0, NOW())"
        );

        $ok = $stmt->execute([$user_id, $title, $message, $type, $data]);
        if (!$ok) {
            error_log("Notification insert returned false for user_id={$user_id}, title={$title}");
            return false;
        }

        return true;
    } catch (Throwable $e) {
        error_log("Failed to create notification: " . $e->getMessage());
        return false;
    }
}
?>
