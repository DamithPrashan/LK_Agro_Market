<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET');
header('Content-Type: application/json');

require_once __DIR__ . '/../../connection/db.php';
require_once __DIR__ . '/../auth_check.php';

require_login();
require_role('buyer');

$userId = (int)$_SESSION['user']['id'];

try {
    $buyerStmt = $pdo->prepare('SELECT buyer_id FROM buyer WHERE user_id=? LIMIT 1');
    $buyerStmt->execute([$userId]);
    $buyerId = $buyerStmt->fetchColumn();
    if ($buyerId === false) {
        http_response_code(404);
        echo json_encode(['success' => false, 'eligible' => false, 'message' => 'Buyer account not found.']);
        exit;
    }

    $reservationStmt = $pdo->prepare("
        SELECT r.reservation_id
        FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source='crop' AND r.reserve_crop_id=rc.reserve_crop_id
        LEFT JOIN cultivation_request cr ON r.reservation_source='cultivation' AND r.cultivation_request_id=cr.cultivation_request_id
        LEFT JOIN platform_reviews pr ON pr.reservation_id=r.reservation_id AND pr.buyer_id=?
        WHERE CASE WHEN r.reservation_source='crop' THEN rc.buyer_id ELSE cr.buyer_id END = ?
          AND r.reservation_status IN ('ready', 'completed')
          AND r.transaction_status='paid'
          AND EXISTS (
              SELECT 1 FROM payment p
              WHERE p.reservation_id=r.reservation_id
                AND p.payment_type='final' AND p.payment_status='completed'
          )
          AND pr.id IS NULL
        ORDER BY r.reservation_id DESC
        LIMIT 1
    ");
    $reservationStmt->execute([(int)$buyerId, (int)$buyerId]);
    $reservationId = $reservationStmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'eligible' => $reservationId !== false,
        ...($reservationId !== false ? ['order_id' => (int)$reservationId] : []),
    ]);
} catch (PDOException $error) {
    error_log('Platform review eligibility failed: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'eligible' => false, 'message' => 'Unable to check platform review eligibility.']);
}
