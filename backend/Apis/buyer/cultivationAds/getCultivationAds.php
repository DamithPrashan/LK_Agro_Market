<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../cultivationRequests/_common.php';
try {
    $id = (int)($_GET['id'] ?? 0);
    $limit = max(1, min((int)($_GET['limit'] ?? 100), 100));
    $where = "ca.status = 'open' AND ca.committed_quantity < ca.capacity_quantity";
    $params = [];
    if ($id > 0) { $where .= ' AND ca.cultivation_ad_id = ?'; $params[] = $id; }
    $sql = "SELECT ca.cultivation_ad_id, ca.crop_name, ca.category, ca.district,
                   ca.capacity_quantity, ca.committed_quantity,
                   GREATEST(ca.capacity_quantity-ca.committed_quantity,0) remaining_capacity,
                   ca.unit, ca.estimated_unit_price, ca.timing_model, ca.growing_period_days, ca.expected_harvest_date, ca.cultivation_started_at,
                   CASE WHEN ca.timing_model='growing_period' AND ca.cultivation_started_at IS NOT NULL THEN DATE(DATE_ADD(ca.cultivation_started_at, INTERVAL ca.growing_period_days DAY)) END estimated_harvest_date,
                   ca.cultivation_area, ca.area_unit, ca.description, ca.created_at,
                   ca.farmer_id, u.name farmer_name, f.verified_status,
                   COALESCE(
                       (
                           SELECT ROUND(
                               (COALESCE(SUM(rr.rating), 0) + COALESCE(fv.verification_rating, 0)) / 
                               (COUNT(rr.rating) + CASE WHEN fv.verification_rating IS NOT NULL AND fv.verification_rating > 0 THEN 1 ELSE 0 END),
                               1
                           )
                           FROM ratings_review rr
                           WHERE rr.reviewee_id = u.user_id AND rr.is_removed = 0
                           HAVING (COUNT(rr.rating) + CASE WHEN fv.verification_rating IS NOT NULL AND fv.verification_rating > 0 THEN 1 ELSE 0 END) > 0
                       ),
                       NULLIF(u.average_rating, 0.00),
                       fv.verification_rating,
                       0.0
                   ) farmer_rating,
                   (SELECT p.photo_path FROM cultivation_ad_photos p
                    WHERE p.cultivation_ad_id=ca.cultivation_ad_id ORDER BY p.id LIMIT 1) preview_image
            FROM cultivation_ad ca JOIN farmer f ON f.farmer_id=ca.farmer_id
            JOIN user u ON u.user_id=f.user_id
            LEFT JOIN farmer_verification fv ON f.farmer_id=fv.farmer_id AND fv.verification_status='approved' WHERE $where
            ORDER BY ca.created_at DESC, ca.cultivation_ad_id DESC LIMIT $limit";
    $stmt = $pdo->prepare($sql); $stmt->execute($params); $ads = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if ($id > 0 && !$ads) cultivation_request_json(404, ['success'=>false,'message'=>'Cultivation opportunity is unavailable.']);
    if ($id > 0) {
        $photos=$pdo->prepare('SELECT photo_path FROM cultivation_ad_photos WHERE cultivation_ad_id=? ORDER BY id');
        $photos->execute([$id]); $ads[0]['photos']=$photos->fetchAll(PDO::FETCH_COLUMN);
        cultivation_request_json(200, ['success'=>true,'message'=>'Cultivation opportunity loaded.','data'=>['ad'=>$ads[0]]]);
    }
    cultivation_request_json(200, ['success'=>true,'message'=>'Cultivation opportunities loaded.','data'=>['ads'=>$ads]]);
} catch (Throwable $e) {
    cultivation_request_json(500, ['success'=>false,'message'=>'Unable to load cultivation opportunities.']);
}
