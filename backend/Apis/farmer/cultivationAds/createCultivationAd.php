<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
require_once __DIR__ . '/_common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') cultivation_json(405, ['success' => false, 'message' => 'Method not allowed.']);
$farmer = cultivation_require_farmer(true);
$data = cultivation_fields($_POST);
$photos = cultivation_photo_files();
$createdFiles = [];
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('INSERT INTO cultivation_ad (farmer_id, crop_name, category, district, capacity_quantity, committed_quantity, unit, estimated_unit_price, expected_harvest_date, cultivation_area, area_unit, description, status) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, \'open\')');
    $stmt->execute([$farmer['farmer_id'], $data['crop_name'], $data['category'], $data['district'], $data['capacity_quantity'], $data['unit'], $data['estimated_unit_price'], $data['expected_harvest_date'], $data['cultivation_area'], $data['area_unit'], $data['description']]);
    $adId = (int)$pdo->lastInsertId();
    cultivation_store_photos($pdo, $adId, $photos, $createdFiles);
    $pdo->commit();
    cultivation_json(201, ['success' => true, 'message' => 'Cultivation opportunity created successfully.', 'data' => ['cultivation_ad_id' => $adId]]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    cultivation_cleanup_files($createdFiles);
    cultivation_json(500, ['success' => false, 'message' => 'Unable to create cultivation opportunity.']);
}
