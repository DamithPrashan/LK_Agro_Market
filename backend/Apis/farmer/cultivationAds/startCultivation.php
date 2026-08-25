<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../../../create_notification.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') cultivation_json(405, ['success' => false, 'message' => 'Method not allowed.']);
$farmer = cultivation_require_farmer(true);
$input = isset($mockInput) ? $mockInput : cultivation_json_input();
$id = (int)($input['cultivation_ad_id'] ?? 0);
if ($id <= 0) cultivation_json(422, ['success' => false, 'message' => 'Select a valid cultivation opportunity.']);

try {
    $pdo->beginTransaction();
    $lock = $pdo->prepare('SELECT cultivation_ad_id, crop_name, timing_model, growing_period_days, cultivation_started_at, status, capacity_quantity, committed_quantity FROM cultivation_ad WHERE cultivation_ad_id = ? AND farmer_id = ? FOR UPDATE');
    $lock->execute([$id, $farmer['farmer_id']]);
    $ad = $lock->fetch(PDO::FETCH_ASSOC);
    if (!$ad) { $pdo->rollBack(); cultivation_json(404, ['success' => false, 'message' => 'Cultivation opportunity not found.']); }
    if ($ad['timing_model'] !== 'growing_period') { $pdo->rollBack(); cultivation_json(409, ['success' => false, 'message' => 'Start Cultivation is only available for growing-period opportunities.']); }
    if (!in_array($ad['status'], ['open', 'capacity_reached'], true) || $ad['cultivation_started_at'] !== null) { $pdo->rollBack(); cultivation_json(409, ['success' => false, 'message' => 'Cultivation has already started or this opportunity is not eligible.']); }
    $period = (int)$ad['growing_period_days'];
    if ($period <= 0 || $period > CULTIVATION_AD_MAX_GROWING_PERIOD_DAYS) { $pdo->rollBack(); cultivation_json(409, ['success' => false, 'message' => 'The opportunity does not have a valid growing period.']); }

    $counts = $pdo->prepare("SELECT SUM(request_status='pending') pending_count, SUM(request_status='accepted') accepted_count FROM cultivation_request WHERE cultivation_ad_id = ?");
    $counts->execute([$id]);
    $requestCounts = $counts->fetch(PDO::FETCH_ASSOC);
    if ((int)$requestCounts['pending_count'] > 0) { $pdo->rollBack(); cultivation_json(409, ['success' => false, 'message' => 'Resolve all pending buyer requests before starting cultivation.']); }
    if ((int)$requestCounts['accepted_count'] <= 0) { $pdo->rollBack(); cultivation_json(409, ['success' => false, 'message' => 'At least one accepted buyer request is required before starting cultivation.']); }

    $accepted = $pdo->prepare("SELECT cr.cultivation_request_id, cr.agreed_total_amount, r.reservation_id, r.transaction_status
        FROM cultivation_request cr
        LEFT JOIN reservation r ON r.cultivation_request_id=cr.cultivation_request_id AND r.reservation_source='cultivation'
        WHERE cr.cultivation_ad_id=? AND cr.request_status='accepted'
        FOR UPDATE");
    $accepted->execute([$id]);
    $advancePayments = $pdo->prepare("SELECT payment_id, amount FROM payment
        WHERE reservation_id=? AND payment_type='advance' AND payment_status='completed'
        FOR UPDATE");
    foreach ($accepted->fetchAll(PDO::FETCH_ASSOC) as $request) {
        if ($request['reservation_id'] === null || $request['transaction_status'] !== 'partially_paid') {
            $pdo->rollBack();
            cultivation_json(409, ['success' => false, 'message' => 'Every accepted request must have a reservation with its advance payment completed before cultivation can start.']);
        }
        $advancePayments->execute([(int)$request['reservation_id']]);
        $payments = $advancePayments->fetchAll(PDO::FETCH_ASSOC);
        $expectedAdvance = round((float)$request['agreed_total_amount'] / 3);
        if (count($payments) !== 1 || abs((float)$payments[0]['amount'] - $expectedAdvance) > 0.00001) {
            $pdo->rollBack();
            cultivation_json(409, ['success' => false, 'message' => 'Every accepted request must have exactly one valid completed advance payment before cultivation can start.']);
        }
    }

    $update = $pdo->prepare("UPDATE cultivation_ad SET status='cultivating', cultivation_started_at=NOW() WHERE cultivation_ad_id=? AND cultivation_started_at IS NULL AND status IN ('open','capacity_reached')");
    $update->execute([$id]);
    if ($update->rowCount() !== 1) throw new RuntimeException('Cultivation opportunity changed before it could be started.');
    $timing = $pdo->prepare('SELECT cultivation_started_at, DATE(DATE_ADD(cultivation_started_at, INTERVAL growing_period_days DAY)) estimated_harvest_date FROM cultivation_ad WHERE cultivation_ad_id=?');
    $timing->execute([$id]);
    $started = $timing->fetch(PDO::FETCH_ASSOC);
    $startedAt = $started['cultivation_started_at'];
    $estimatedHarvest = $started['estimated_harvest_date'];

    $buyers = $pdo->prepare("SELECT cr.cultivation_request_id, r.reservation_id, b.user_id FROM cultivation_request cr JOIN buyer b ON b.buyer_id=cr.buyer_id LEFT JOIN reservation r ON r.cultivation_request_id=cr.cultivation_request_id AND r.reservation_source='cultivation' WHERE cr.cultivation_ad_id=? AND cr.request_status='accepted'");
    $buyers->execute([$id]);
    foreach ($buyers->fetchAll(PDO::FETCH_ASSOC) as $buyer) {
        $data = json_encode(['cultivation_ad_id'=>$id, 'requestId'=>(int)$buyer['cultivation_request_id'], 'orderId'=>$buyer['reservation_id'] === null ? null : (int)$buyer['reservation_id'], 'cropName'=>$ad['crop_name'], 'cultivation_started_at'=>$startedAt, 'estimated_harvest_date'=>$estimatedHarvest, 'link'=>'/buyer/cultivation-requests']);
        if (!create_notification((int)$buyer['user_id'], 'Cultivation Started', "Cultivation has started for {$ad['crop_name']}.", 'cultivationStarted', $data)) throw new RuntimeException('Buyer notification failed.');
    }
    $pdo->commit();
    cultivation_json(200, ['success'=>true, 'message'=>'Cultivation started successfully.', 'data'=>['cultivation_ad_id'=>$id, 'status'=>'cultivating', 'cultivation_started_at'=>$startedAt, 'estimated_harvest_date'=>$estimatedHarvest]]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    cultivation_json(500, ['success'=>false, 'message'=>'Unable to start cultivation.']);
}
