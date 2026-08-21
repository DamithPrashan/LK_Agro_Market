<?php
require_once __DIR__ . '/../cultivationAds/_common.php';
require_once __DIR__ . '/../../../create_notification.php';

function cultivation_farmer_request(int $id, int $farmerId, bool $lock=true): array|false
{
 global $pdo; $suffix=$lock?' FOR UPDATE':'';
 $stmt=$pdo->prepare("SELECT cr.*,ca.farmer_id,ca.crop_name,ca.capacity_quantity,ca.committed_quantity,ca.estimated_unit_price,ca.unit,ca.timing_model,ca.growing_period_days,ca.cultivation_started_at,ca.status ad_status,b.user_id buyer_user_id,u.name buyer_name FROM cultivation_request cr JOIN cultivation_ad ca ON ca.cultivation_ad_id=cr.cultivation_ad_id JOIN buyer b ON b.buyer_id=cr.buyer_id JOIN user u ON u.user_id=b.user_id WHERE cr.cultivation_request_id=? AND ca.farmer_id=?$suffix");
 $stmt->execute([$id,$farmerId]); return $stmt->fetch(PDO::FETCH_ASSOC);
}
