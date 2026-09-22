<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';

require_role('admin');

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = (int)($input['user_id'] ?? 0);
$forceDelete = ($input['force_delete'] ?? false) === true;
$foreignKeyChecksDisabled = false;

if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A valid user is required.']);
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

    if (!$forceDelete) {
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
                echo json_encode(['success' => false, 'message' => 'This user cannot be deleted because related marketplace history exists. Confirm permanent deletion to continue.']);
                exit;
            }
        }
    }

    // A checked confirmation deliberately permits account removal even when
    // historical marketplace rows still reference it. The setting is scoped to
    // this database connection and is restored immediately below.
    if ($forceDelete) {
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
        $foreignKeyChecksDisabled = true;
    }

    $delete = $pdo->prepare('DELETE FROM user WHERE user_id = ?');
    $delete->execute([$userId]);
    if ($delete->rowCount() !== 1) throw new RuntimeException('User deletion failed.');

    $pdo->commit();
    if ($foreignKeyChecksDisabled) $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    echo json_encode(['success' => true, 'user_id' => $userId, 'message' => 'User deleted successfully.']);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($foreignKeyChecksDisabled) $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to delete user.']);
}
