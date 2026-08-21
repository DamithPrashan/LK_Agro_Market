<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';
require_once __DIR__ . '/../calendar/logAdminActivity.php';

require_role('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = (int)($input['user_id'] ?? 0);
$accountStatus = strtolower(trim((string)($input['account_status'] ?? '')));

if ($userId <= 0 || !in_array($accountStatus, ['active', 'inactive'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A valid user and account status are required.']);
    exit;
}

$currentUserId = (int)$_SESSION['user']['id'];
if ($userId === $currentUserId && $accountStatus === 'inactive') {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'You cannot deactivate your own account.']);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT user_id, name, account_status FROM user WHERE user_id = ? FOR UPDATE');
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit;
    }

    if ($user['account_status'] === $accountStatus) {
        $pdo->rollBack();
        echo json_encode(['success' => true, 'account_status' => $accountStatus, 'message' => 'Account status is already up to date.']);
        exit;
    }

    $update = $pdo->prepare('UPDATE user SET account_status = ? WHERE user_id = ?');
    $update->execute([$accountStatus, $userId]);

    $adminStmt = $pdo->prepare('SELECT admin_id FROM admin WHERE user_id = ? LIMIT 1');
    $adminStmt->execute([$currentUserId]);
    $adminId = $adminStmt->fetchColumn() ?: null;
    $activated = $accountStatus === 'active';
    $logged = logAdminActivity(
        $pdo,
        $activated ? 'user_reactivated' : 'user_deactivated',
        $activated ? 'User Reactivated' : 'User Deactivated',
        $user['name'] . ($activated ? ' was reactivated.' : ' was deactivated.'),
        $userId,
        $adminId
    );
    if (!$logged) {
        throw new RuntimeException('Admin activity logging failed.');
    }

    $pdo->commit();
    echo json_encode([
        'success' => true,
        'account_status' => $accountStatus,
        'message' => $activated ? 'User reactivated successfully.' : 'User deactivated successfully.',
    ]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to update account status.']);
}
