<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
require_once __DIR__ . '/_common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') cultivation_json(405, ['success' => false, 'message' => 'Method not allowed.']);
$farmer = cultivation_require_farmer();
$input = cultivation_json_input();
$id = (int)($input['cultivation_ad_id'] ?? 0);
if ($id <= 0) cultivation_json(422, ['success' => false, 'message' => 'Select a valid cultivation opportunity.']);
try {
    $pdo->beginTransaction();
    $lock = $pdo->prepare("SELECT status FROM cultivation_ad WHERE cultivation_ad_id=? AND farmer_id=? FOR UPDATE");
    $lock->execute([$id, $farmer['farmer_id']]);
    $ad = $lock->fetch(PDO::FETCH_ASSOC);
    if (!$ad || $ad['status'] !== 'open') { $pdo->rollBack(); cultivation_json(409, ['success' => false, 'message' => 'Only an open cultivation opportunity can be closed.']); }
    $pending = $pdo->prepare("SELECT COUNT(*) FROM cultivation_request WHERE cultivation_ad_id=? AND request_status='pending'");
    $pending->execute([$id]);
    if ((int)$pending->fetchColumn() > 0) {
        $pdo->rollBack();
        cultivation_json(409, ['success' => false, 'message' => 'Resolve all pending buyer requests before closing this opportunity.']);
    }
    $pdo->prepare("UPDATE cultivation_ad SET status='closed' WHERE cultivation_ad_id=?")->execute([$id]);
    $pdo->commit();
    cultivation_json(200, ['success' => true, 'message' => 'Cultivation opportunity closed.', 'data' => ['cultivation_ad_id' => $id, 'status' => 'closed']]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    cultivation_json(500, ['success' => false, 'message' => 'Unable to close cultivation opportunity.']);
}
