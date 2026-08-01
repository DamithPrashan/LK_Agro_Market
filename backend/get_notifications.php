<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

require_login();
$user_id = $_SESSION['user']['id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Missing authenticated user id."]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT id, title, message AS `desc`, type, data, is_read, created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50"
    );
    $stmt->execute([$user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $notifications = [];
    foreach ($rows as $row) {
        $title = $row['title'];
        $type = 'info';
        if (stripos($title, 'accept') !== false || stripos($title, 'success') !== false || stripos($title, 'resolve') !== false) {
            $type = 'success';
        } elseif (stripos($title, 'decline') !== false || stripos($title, 'cancel') !== false || stripos($title, 'fail') !== false || stripos($title, 'dispute') !== false) {
            $type = 'warning';
        } elseif (stripos($title, 'payment') !== false || stripos($title, 'receive') !== false) {
            $type = 'success';
        }

        $notifications[] = [
            "id" => intval($row['id']),
            "title" => $row['title'],
            "desc" => $row['desc'],
            "unread" => intval($row['is_read']) === 0,
            "created_at" => $row['created_at'],
            "type" => $type,
            "notif_type" => $row['type'],
            "notif_data" => $row['data'] ? json_decode($row['data'], true) : null
        ];
    }

    echo json_encode([
        "success" => true,
        "notifications" => $notifications
    ], JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log("get_notifications.php failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
