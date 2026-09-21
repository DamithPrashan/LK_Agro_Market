<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once __DIR__ . '/../../connection/db.php';
require_once __DIR__ . '/../auth_check.php';

require_notification_access();
$user_id = $_SESSION['user']['id'];

try {
    $unread_only = isset($_GET['unread_only']) && $_GET['unread_only'] === 'true';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    if ($limit <= 0) $limit = 50;

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0 AND (type IS NULL OR type != 'system')");
    $countStmt->execute([$user_id]);
    $unread_count = (int) $countStmt->fetchColumn();

    $query = "SELECT id, title, message, type, data, is_read, (is_read = 0) as unread, created_at FROM notifications WHERE user_id = ? AND (type IS NULL OR type != 'system')";
    if ($unread_only) {
        $query .= " AND is_read = 0";
    }
    $query .= " ORDER BY created_at DESC LIMIT " . $limit;

    $stmt = $pdo->prepare($query);
    $stmt->execute([$user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $notifications = [];
    foreach ($rows as $row) {
        $title = $row['title'];
        $ui_type = 'info';
        if (stripos($title, 'accept') !== false || stripos($title, 'success') !== false || stripos($title, 'resolve') !== false) {
            $ui_type = 'success';
        } elseif (stripos($title, 'decline') !== false || stripos($title, 'cancel') !== false || stripos($title, 'fail') !== false || stripos($title, 'dispute') !== false) {
            $ui_type = 'warning';
        } elseif (stripos($title, 'payment') !== false || stripos($title, 'receive') !== false) {
            $ui_type = 'success';
        }
        
        $notifData = $row['data'] ? json_decode($row['data'], true) : null;
        $link = null;
        if (is_array($notifData) && !empty($notifData['link'])) {
            $link = $notifData['link'];
        } elseif (is_array($notifData) && (!empty($notifData['complaint_id']) || !empty($notifData['complaintId']))) {
            $cId = !empty($notifData['complaint_id']) ? $notifData['complaint_id'] : $notifData['complaintId'];
            $link = "/buyer/complaints?tab=farmer_response&id=" . $cId;
        }

        // If user is buyer and notification is dispute/complaint related, normalize the link
        if ($_SESSION['user']['role'] === 'buyer') {
            if ($row['type'] === 'farmerResponded' || $row['type'] === 'complaintResolved') {
                $cId = is_array($notifData) ? ($notifData['complaint_id'] ?? $notifData['complaintId'] ?? null) : null;
                if ($cId) {
                    $link = "/buyer/complaints?tab=farmer_response&id=" . $cId;
                } elseif (empty($link) || str_contains($link, '/crop/') || str_contains($link, '/farmer-response')) {
                    $link = "/buyer/complaints?tab=farmer_response";
                }
            }
        }

        $notifications[] = [
            "id" => intval($row['id']),
            "title" => $row['title'],
            "desc" => $row['message'],
            "message" => $row['message'],
            "unread" => intval($row['unread']) === 1,
            "is_read" => intval($row['is_read']) === 1,
            "created_at" => $row['created_at'],
            "type" => $ui_type,
            "notif_type" => $row['type'],
            "notif_data" => $notifData,
            "link" => $link
        ];
    }

    echo json_encode([
        "success" => true,
        "notifications" => $notifications,
        "unread_count" => $unread_count
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>

