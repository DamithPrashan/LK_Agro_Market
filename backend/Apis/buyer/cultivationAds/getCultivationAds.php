<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../cultivationRequests/_common.php';
try {
    $id = (int)($_GET['id'] ?? 0);
    $where = "ca.status = 'open' AND ca.committed_quantity < ca.capacity_quantity";
    $params = [];
    if ($id > 0) { $where .= ' AND ca.cultivation_ad_id = ?'; $params[] = $id; }
    $sql = "SELECT ca.cultivation_ad_id, ca.crop_name, ca.category, ca.district,
                   ca.capacity_quantity, ca.committed_quantity,
                   GREATEST(ca.capacity_quantity-ca.committed_quantity,0) remaining_capacity,
                   ca.unit, ca.estimated_unit_price, ca.expected_harvest_date,
                   ca.cultivation_area, ca.area_unit, ca.description, ca.created_at,
                   ca.farmer_id, u.name farmer_name, f.verified_status,
                   COALESCE((SELECT AVG(rr.rating) FROM ratings_review rr
                             WHERE rr.reviewee_id=u.user_id AND rr.is_removed=0), 5.0) farmer_rating,
                   (SELECT p.photo_path FROM cultivation_ad_photos p
                    WHERE p.cultivation_ad_id=ca.cultivation_ad_id ORDER BY p.id LIMIT 1) preview_image
            FROM cultivation_ad ca JOIN farmer f ON f.farmer_id=ca.farmer_id
            JOIN user u ON u.user_id=f.user_id WHERE $where ORDER BY ca.expected_harvest_date, ca.created_at DESC";
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
