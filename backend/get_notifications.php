<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

require_login();
$user_id = $_SESSION['user']['id'];

try {
    $stmt = $pdo->prepare("SELECT id, title, message as `desc`, (is_read = 0) as unread, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
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
            "unread" => intval($row['unread']) === 1,
            "created_at" => $row['created_at'],
            "type" => $type
        ];
    }

    echo json_encode([
        "success" => true,
        "notifications" => $notifications
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
