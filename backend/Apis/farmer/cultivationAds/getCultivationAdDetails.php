<?php
header('Content-Type: application/json');
require_once __DIR__ . '/_common.php';
$farmer = cultivation_require_farmer();
$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) cultivation_json(400, ['success' => false, 'message' => 'Invalid cultivation ad ID.']);
$stmt = $pdo->prepare('SELECT ca.*, GREATEST(ca.capacity_quantity - ca.committed_quantity, 0) AS remaining_capacity FROM cultivation_ad ca WHERE ca.cultivation_ad_id = ? AND ca.farmer_id = ?');
$stmt->execute([$id, $farmer['farmer_id']]);
$ad = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$ad) cultivation_json(404, ['success' => false, 'message' => 'Cultivation opportunity not found.']);
$photos = $pdo->prepare('SELECT id, photo_path, created_at FROM cultivation_ad_photos WHERE cultivation_ad_id = ? ORDER BY id');
$photos->execute([$id]);
$ad['photos'] = $photos->fetchAll(PDO::FETCH_ASSOC);
cultivation_json(200, ['success' => true, 'message' => 'Cultivation opportunity loaded.', 'data' => ['ad' => $ad]]);
