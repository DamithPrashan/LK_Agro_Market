<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
require_once __DIR__ . '/_common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') cultivation_json(405, ['success' => false, 'message' => 'Method not allowed.']);
$farmer = cultivation_require_farmer();
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$id = (int)($input['cultivation_ad_id'] ?? 0);
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("UPDATE cultivation_ad SET status='closed' WHERE cultivation_ad_id=? AND farmer_id=? AND status='open'");
    $stmt->execute([$id, $farmer['farmer_id']]);
    if ($stmt->rowCount() !== 1) { $pdo->rollBack(); cultivation_json(409, ['success' => false, 'message' => 'Only an open cultivation opportunity can be closed.']); }
    $pdo->commit();
    cultivation_json(200, ['success' => true, 'message' => 'Cultivation opportunity closed.', 'data' => ['cultivation_ad_id' => $id, 'status' => 'closed']]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    cultivation_json(500, ['success' => false, 'message' => 'Unable to close cultivation opportunity.']);
}
