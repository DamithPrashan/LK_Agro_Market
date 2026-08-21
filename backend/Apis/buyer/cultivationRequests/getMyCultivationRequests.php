<?php
header('Content-Type: application/json'); require_once __DIR__ . '/_common.php'; $buyer=cultivation_require_buyer();
$stmt=$pdo->prepare("SELECT cr.cultivation_request_id,cr.cultivation_ad_id,cr.requested_quantity,
 cr.requested_collection_date,cr.agreed_quantity,cr.agreed_unit_price,cr.agreed_total_amount,cr.agreed_growing_period_days,
 cr.farmer_note,cr.request_status,cr.requested_at,cr.responded_at,ca.crop_name,ca.unit,ca.timing_model,ca.growing_period_days,ca.planned_start_date,ca.cultivation_started_at,ca.status cultivation_ad_status,
 CASE WHEN ca.cultivation_started_at IS NOT NULL AND cr.agreed_growing_period_days IS NOT NULL THEN DATE(DATE_ADD(ca.cultivation_started_at, INTERVAL cr.agreed_growing_period_days DAY)) END estimated_harvest_date,u.name farmer_name,
 r.reservation_id,r.reservation_status,r.transaction_status,r.collection_date,
 (SELECT p.photo_path FROM cultivation_ad_photos p WHERE p.cultivation_ad_id=ca.cultivation_ad_id ORDER BY p.id LIMIT 1) preview_image
 FROM cultivation_request cr JOIN cultivation_ad ca ON ca.cultivation_ad_id=cr.cultivation_ad_id
 LEFT JOIN reservation r ON r.cultivation_request_id=cr.cultivation_request_id AND r.reservation_source='cultivation'
 JOIN farmer f ON f.farmer_id=ca.farmer_id JOIN user u ON u.user_id=f.user_id
 WHERE cr.buyer_id=? ORDER BY cr.requested_at DESC");
$stmt->execute([$buyer['buyer_id']]); cultivation_request_json(200,['success'=>true,'message'=>'Cultivation requests loaded.','data'=>['requests'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]]);
