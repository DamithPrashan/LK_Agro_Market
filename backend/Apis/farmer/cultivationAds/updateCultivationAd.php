<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
require_once __DIR__ . '/_common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') cultivation_json(405, ['success' => false, 'message' => 'Method not allowed.']);
$farmer = cultivation_require_farmer();
$id = (int)($_POST['cultivation_ad_id'] ?? 0);
$photos = cultivation_photo_files();
$createdFiles = [];
$preflight = $pdo->prepare('SELECT * FROM cultivation_ad WHERE cultivation_ad_id = ? AND farmer_id = ?');
$preflight->execute([$id, $farmer['farmer_id']]);
$existing = $preflight->fetch(PDO::FETCH_ASSOC);
if (!$existing) cultivation_json(404, ['success' => false, 'message' => 'Cultivation opportunity not found.']);
if (!in_array($existing['status'], ['draft', 'open'], true)) cultivation_json(409, ['success' => false, 'message' => 'This cultivation opportunity is read-only.']);
if ($existing['status'] === 'open' && (int)$farmer['verified_status'] !== 1) cultivation_json(403, ['success' => false, 'message' => 'Only verified farmers can maintain an open cultivation opportunity.']);
$data = cultivation_fields($_POST, (float)$existing['committed_quantity'], $existing['timing_model']);
try {
    $pdo->beginTransaction();
    $lock = $pdo->prepare('SELECT * FROM cultivation_ad WHERE cultivation_ad_id = ? AND farmer_id = ? FOR UPDATE');
    $lock->execute([$id, $farmer['farmer_id']]);
    $locked = $lock->fetch(PDO::FETCH_ASSOC);
    if (!$locked || !in_array($locked['status'], ['draft', 'open'], true)) throw new DomainException('This cultivation opportunity changed and can no longer be edited.');
    if ($data['capacity_quantity'] < (float)$locked['committed_quantity']) throw new DomainException('Capacity cannot be lower than the committed quantity.');
    $requestStats = $pdo->prepare("SELECT
        SUM(request_status='pending') AS pending_count,
        SUM(request_status='accepted') AS accepted_count,
        COALESCE(MAX(CASE WHEN request_status='pending' THEN requested_quantity END), 0) AS largest_pending_quantity
        FROM cultivation_request WHERE cultivation_ad_id=?");
    $requestStats->execute([$id]);
    $stats = $requestStats->fetch(PDO::FETCH_ASSOC);
    $termsChanged = $data['crop_name'] !== $locked['crop_name']
        || $data['unit'] !== $locked['unit']
        || abs($data['estimated_unit_price'] - (float)$locked['estimated_unit_price']) > 0.00001
        || $data['expected_harvest_date'] !== $locked['expected_harvest_date']
        || $data['growing_period_days'] !== ($locked['growing_period_days'] === null ? null : (int)$locked['growing_period_days']);
    if ((int)$stats['pending_count'] > 0 && $termsChanged) {
        throw new DomainException('Crop, unit, estimated price, and cultivation timing cannot change while buyer requests are pending.');
    }
    if ((int)$stats['accepted_count'] > 0 && ($data['crop_name'] !== $locked['crop_name'] || $data['unit'] !== $locked['unit'] || $data['expected_harvest_date'] !== $locked['expected_harvest_date'] || $data['growing_period_days'] !== ($locked['growing_period_days'] === null ? null : (int)$locked['growing_period_days']))) {
        throw new DomainException('Crop, unit, and cultivation timing cannot change after an agreement is accepted.');
    }
    if ((int)$stats['pending_count'] > 0 && $data['capacity_quantity'] < (float)$stats['largest_pending_quantity']) {
        throw new DomainException('Capacity cannot be reduced below the largest pending buyer request.');
    }
    $count = $pdo->prepare('SELECT COUNT(*) FROM cultivation_ad_photos WHERE cultivation_ad_id = ?');
    $count->execute([$id]);
    if ((int)$count->fetchColumn() + count($photos) > CULTIVATION_AD_MAX_PHOTOS) { $pdo->rollBack(); cultivation_json(422, ['success' => false, 'message' => 'A maximum of 5 photos is allowed.']); }
    $stmt = $pdo->prepare("UPDATE cultivation_ad SET crop_name=?, category=?, district=?, capacity_quantity=?, unit=?, estimated_unit_price=?, expected_harvest_date=?, growing_period_days=?, cultivation_area=?, area_unit=?, description=?, status=CASE WHEN status='open' AND ? <= committed_quantity THEN 'capacity_reached' ELSE status END WHERE cultivation_ad_id=? AND farmer_id=?");
    $stmt->execute([$data['crop_name'], $data['category'], $data['district'], $data['capacity_quantity'], $data['unit'], $data['estimated_unit_price'], $data['expected_harvest_date'], $data['growing_period_days'], $data['cultivation_area'], $data['area_unit'], $data['description'], $data['capacity_quantity'], $id, $farmer['farmer_id']]);
    cultivation_store_photos($pdo, $id, $photos, $createdFiles);
    $pdo->commit();
    cultivation_json(200, ['success' => true, 'message' => 'Cultivation opportunity updated successfully.', 'data' => ['cultivation_ad_id' => $id]]);
} catch (DomainException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    cultivation_cleanup_files($createdFiles);
    cultivation_json(409, ['success' => false, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    cultivation_cleanup_files($createdFiles);
    cultivation_json(500, ['success' => false, 'message' => 'Unable to update cultivation opportunity.']);
}
