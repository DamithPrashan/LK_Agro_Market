<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../../../create_notification.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') cultivation_json(405, ['success' => false, 'message' => 'Method not allowed.']);
$farmer = cultivation_require_farmer();
$input = isset($mockInput) ? $mockInput : cultivation_json_input();
$id = (int)($input['cultivation_ad_id'] ?? 0);
if ($id <= 0) cultivation_json(422, ['success' => false, 'message' => 'Select a valid cultivation opportunity.']);

try {
    $pdo->beginTransaction();
    $lock = $pdo->prepare("SELECT cultivation_ad_id, crop_name, timing_model, growing_period_days, cultivation_started_at, status,
        DATE(DATE_ADD(cultivation_started_at, INTERVAL growing_period_days DAY)) estimated_harvest_date
        FROM cultivation_ad WHERE cultivation_ad_id=? AND farmer_id=? FOR UPDATE");
    $lock->execute([$id, $farmer['farmer_id']]);
    $ad = $lock->fetch(PDO::FETCH_ASSOC);
    if (!$ad) { $pdo->rollBack(); cultivation_json(404, ['success'=>false, 'message'=>'Cultivation opportunity not found.']); }
    if ($ad['timing_model'] !== 'growing_period' || $ad['status'] !== 'cultivating' || $ad['cultivation_started_at'] === null) {
        $pdo->rollBack(); cultivation_json(409, ['success'=>false, 'message'=>'This cultivation opportunity is not eligible to be marked harvested.']);
    }
    if ($ad['estimated_harvest_date'] === null || $ad['estimated_harvest_date'] > date('Y-m-d')) {
        $pdo->rollBack(); cultivation_json(409, ['success'=>false, 'message'=>'The estimated harvest date has not been reached.']);
    }

    $update = $pdo->prepare("UPDATE cultivation_ad SET status='harvested' WHERE cultivation_ad_id=? AND farmer_id=? AND status='cultivating'");
    $update->execute([$id, $farmer['farmer_id']]);
    if ($update->rowCount() !== 1) throw new RuntimeException('Cultivation opportunity changed before it could be marked harvested.');

    $buyers = $pdo->prepare("SELECT cr.cultivation_request_id, r.reservation_id, b.user_id
        FROM cultivation_request cr JOIN buyer b ON b.buyer_id=cr.buyer_id
        LEFT JOIN reservation r ON r.cultivation_request_id=cr.cultivation_request_id AND r.reservation_source='cultivation'
        WHERE cr.cultivation_ad_id=? AND cr.request_status='accepted'");
    $buyers->execute([$id]);
    foreach ($buyers->fetchAll(PDO::FETCH_ASSOC) as $buyer) {
        $data = json_encode(['cultivation_ad_id'=>$id, 'requestId'=>(int)$buyer['cultivation_request_id'],
            'orderId'=>$buyer['reservation_id'] === null ? null : (int)$buyer['reservation_id'],
            'cropName'=>$ad['crop_name'], 'status'=>'harvested', 'estimated_harvest_date'=>$ad['estimated_harvest_date'],
            'link'=>'/buyer/cultivation-requests']);
        if (!create_notification((int)$buyer['user_id'], 'Harvest Completed', "The crop-level harvest for {$ad['crop_name']} has been completed.", 'cultivationHarvested', $data)) {
            throw new RuntimeException('Buyer notification failed.');
        }
    }
    $pdo->commit();
    cultivation_json(200, ['success'=>true, 'message'=>'Cultivation opportunity marked harvested.', 'data'=>[
        'cultivation_ad_id'=>$id, 'status'=>'harvested', 'estimated_harvest_date'=>$ad['estimated_harvest_date']
    ]]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    cultivation_json(500, ['success'=>false, 'message'=>'Unable to mark cultivation as harvested.']);
}