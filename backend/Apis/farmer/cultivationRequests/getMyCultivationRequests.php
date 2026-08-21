<?php
header('Content-Type: application/json'); require_once __DIR__.'/_common.php'; $farmer=cultivation_require_farmer();
$stmt=$pdo->prepare("SELECT cr.cultivation_request_id,cr.cultivation_ad_id,cr.requested_quantity,
 cr.requested_collection_date,cr.agreed_quantity,cr.agreed_unit_price,cr.agreed_total_amount,cr.agreed_growing_period_days,
 cr.farmer_note,cr.request_status,cr.requested_at,cr.responded_at,ca.crop_name,ca.unit,
 ca.capacity_quantity,ca.committed_quantity,ca.timing_model,ca.growing_period_days,ca.cultivation_started_at,
 CASE WHEN ca.cultivation_started_at IS NOT NULL AND cr.agreed_growing_period_days IS NOT NULL THEN DATE(DATE_ADD(ca.cultivation_started_at, INTERVAL cr.agreed_growing_period_days DAY)) END estimated_harvest_date,
 GREATEST(ca.capacity_quantity-ca.committed_quantity,0) remaining_capacity,u.name buyer_name FROM cultivation_request cr JOIN cultivation_ad ca ON ca.cultivation_ad_id=cr.cultivation_ad_id JOIN buyer b ON b.buyer_id=cr.buyer_id JOIN user u ON u.user_id=b.user_id WHERE ca.farmer_id=? ORDER BY cr.requested_at DESC");
$stmt->execute([$farmer['farmer_id']]); cultivation_json(200,['success'=>true,'message'=>'Buyer cultivation requests loaded.','data'=>['requests'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]]);
