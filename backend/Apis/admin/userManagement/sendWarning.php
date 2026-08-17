<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';
require_once __DIR__ . '/../../../create_notification.php';
require_once __DIR__ . '/../calendar/logAdminActivity.php';
require_role('admin');

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = (int) ($input['user_id'] ?? 0);
$message = trim($input['message'] ?? '');
if ($userId <= 0 || strlen($message) < 10) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Select a valid user and provide a warning of at least 10 characters.']);
    exit;
}

try {
    $userStmt = $pdo->prepare('SELECT user_id, name FROM user WHERE user_id = ?');
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit;
    }

    $adminStmt = $pdo->prepare('SELECT admin_id FROM admin WHERE user_id = ? LIMIT 1');
    $adminStmt->execute([$_SESSION['user']['id']]);
    $adminId = $adminStmt->fetchColumn() ?: null;
    $pdo->beginTransaction();
    $notified = create_notification($userId, 'Administrative Warning', $message, 'warningIssued', json_encode(['link' => '/profile']));
    $logged = logAdminActivity($pdo, 'warning_issued', 'Warning Issued', "A warning was issued to {$user['name']}: {$message}", $userId, $adminId);
    if (!$notified || !$logged) throw new RuntimeException('Warning notification or calendar log failed.');
    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Warning sent successfully.']);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to send warning: ' . $error->getMessage()]);
}
