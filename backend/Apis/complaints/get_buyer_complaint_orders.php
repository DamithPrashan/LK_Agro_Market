<?php
declare(strict_types=1);
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
require_once __DIR__ . '/../../connection/db.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../services/order_resolver.php';
require_role('buyer');

$userId = (int)$_SESSION['user']['id'];
try {
    $buyerStmt = $pdo->prepare('SELECT buyer_id FROM buyer WHERE user_id=?');
    $buyerStmt->execute([$userId]);
    $buyerId = (int)$buyerStmt->fetchColumn();
    if ($buyerId <= 0) { http_response_code(404); echo json_encode(['success'=>false,'message'=>'Buyer profile not found.']); exit; }
    $ids = $pdo->prepare("SELECT r.reservation_id FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source='crop' AND r.reserve_crop_id=rc.reserve_crop_id
        LEFT JOIN cultivation_request cr ON r.reservation_source='cultivation' AND r.cultivation_request_id=cr.cultivation_request_id
        WHERE (CASE WHEN r.reservation_source='cultivation' THEN cr.buyer_id ELSE rc.buyer_id END)=?
          AND r.reservation_status IN ('confirmed','ready','completed') ORDER BY r.reservation_id DESC");
    $ids->execute([$buyerId]);
    $orders=[];
    foreach ($ids->fetchAll(PDO::FETCH_COLUMN) as $reservationId) {
        $order=resolve_order_snapshot($pdo,(int)$reservationId);
        if (!$order || $order['buyer_user_id']!==$userId) continue;
        if ($order['reservation_source']==='cultivation' && $order['source_status']!=='accepted') continue;
        $orders[]=[
            'id'=>$order['reservation_id'], 'orderId'=>'ORD'.$order['reservation_id'], 'reservation_id'=>$order['reservation_id'],
            'reservation_source'=>$order['reservation_source'], 'crop_name'=>$order['crop_name'], 'cropName'=>$order['crop_name'],
            'farmer_name'=>$order['farmer_name'], 'farmerName'=>$order['farmer_name'], 'quantity'=>$order['quantity'],
            'unit'=>$order['unit'], 'unit_price'=>$order['unit_price'], 'total_amount'=>$order['total_amount'],
            'totalPrice'=>$order['total_amount'], 'reservation_status'=>$order['reservation_status'],
            'transaction_status'=>$order['transaction_status'], 'collection_date'=>$order['collection_date'], 'date'=>$order['collection_date'],
            'timing_model'=>$order['timing_model'], 'cultivation_started_at'=>$order['cultivation_started_at'],
            'planned_start_date'=>$order['planned_start_date'],
            'agreed_growing_period_days'=>$order['agreed_growing_period_days'], 'estimated_harvest_date'=>$order['estimated_harvest_date'],
        ];
    }
    echo json_encode(['success'=>true,'orders'=>$orders]);
} catch (PDOException $error) {
    http_response_code(500); echo json_encode(['success'=>false,'message'=>'Unable to load complaint-eligible orders.']);
}
