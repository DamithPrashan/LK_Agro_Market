<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';

require_role('admin');

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = (int)($input['user_id'] ?? 0);
$currentUserId = (int)$_SESSION['user']['id'];

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A valid user is required.']);
    exit;
}

if ($userId === $currentUserId) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'You cannot delete your own account.']);
    exit;
}

try {
    $pdo->beginTransaction();
    $userStmt = $pdo->prepare('SELECT user_id, role FROM user WHERE user_id = ? FOR UPDATE');
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit;
    }

    if ($user['role'] === 'admin') {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Administrator accounts cannot be deleted.']);
        exit;
    }

    $references = $pdo->prepare("SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'user'");
    $references->execute();
    foreach ($references->fetchAll(PDO::FETCH_ASSOC) as $reference) {
        $table = str_replace('`', '``', $reference['TABLE_NAME']);
        $column = str_replace('`', '``', $reference['COLUMN_NAME']);
        $count = $pdo->prepare("SELECT COUNT(*) FROM `{$table}` WHERE `{$column}` = ?");
        $count->execute([$userId]);
        if ((int)$count->fetchColumn() > 0) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'This user cannot be deleted because related marketplace history exists. Deactivate the account instead.']);
            exit;
        }
    }

    $delete = $pdo->prepare('DELETE FROM user WHERE user_id = ?');
    $delete->execute([$userId]);
    if ($delete->rowCount() !== 1) throw new RuntimeException('User deletion failed.');

    $pdo->commit();
    echo json_encode(['success' => true, 'user_id' => $userId, 'message' => 'User deleted successfully.']);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to delete user.']);
}
