<?php
header('Content-Type: application/json');
require_once __DIR__ . '/_common.php';
$farmer = cultivation_require_farmer();
$stmt = $pdo->prepare("SELECT ca.*, GREATEST(ca.capacity_quantity - ca.committed_quantity, 0) AS remaining_capacity,
    CASE WHEN ca.timing_model='growing_period' AND ca.cultivation_started_at IS NOT NULL THEN DATE(DATE_ADD(ca.cultivation_started_at, INTERVAL ca.growing_period_days DAY)) END AS estimated_harvest_date,
    (SELECT COUNT(*) FROM cultivation_request cr WHERE cr.cultivation_ad_id=ca.cultivation_ad_id AND cr.request_status='pending') AS pending_request_count,
    (SELECT COUNT(*) FROM cultivation_request cr WHERE cr.cultivation_ad_id=ca.cultivation_ad_id AND cr.request_status='accepted') AS accepted_request_count,
    (SELECT COUNT(*) FROM cultivation_request cr
        JOIN reservation r ON r.cultivation_request_id=cr.cultivation_request_id AND r.reservation_source='cultivation'
        WHERE cr.cultivation_ad_id=ca.cultivation_ad_id AND cr.request_status='accepted'
          AND r.transaction_status='partially_paid'
          AND (SELECT COUNT(*) FROM payment p WHERE p.reservation_id=r.reservation_id AND p.payment_type='advance' AND p.payment_status='completed')=1
          AND (SELECT SUM(p.amount) FROM payment p WHERE p.reservation_id=r.reservation_id AND p.payment_type='advance' AND p.payment_status='completed')=ROUND(cr.agreed_total_amount / 3)) AS financially_ready_request_count,
    (SELECT cap.photo_path FROM cultivation_ad_photos cap WHERE cap.cultivation_ad_id = ca.cultivation_ad_id ORDER BY cap.id LIMIT 1) AS primary_photo FROM cultivation_ad ca WHERE ca.farmer_id = ? ORDER BY ca.created_at DESC");
$stmt->execute([$farmer['farmer_id']]);
$ads = $stmt->fetchAll(PDO::FETCH_ASSOC);
$photoStmt = $pdo->prepare('SELECT id, photo_path, created_at FROM cultivation_ad_photos WHERE cultivation_ad_id = ? ORDER BY id');
foreach ($ads as &$ad) {
    $photoStmt->execute([$ad['cultivation_ad_id']]);
    $ad['photos'] = $photoStmt->fetchAll(PDO::FETCH_ASSOC);
}
cultivation_json(200, ['success' => true, 'message' => 'Cultivation opportunities loaded.', 'data' => ['ads' => $ads]]);
