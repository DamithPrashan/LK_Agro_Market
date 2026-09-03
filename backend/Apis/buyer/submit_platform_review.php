<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST');
header('Content-Type: application/json');

require_once __DIR__ . '/../../connection/db.php';
require_once __DIR__ . '/../auth_check.php';

require_login();
require_role('buyer');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Request body must contain valid JSON.']);
    exit;
}

$reservationId = isset($data['order_id']) ? filter_var($data['order_id'], FILTER_VALIDATE_INT) : false;
$rating = isset($data['rating']) ? filter_var($data['rating'], FILTER_VALIDATE_INT) : false;
$comment = isset($data['comment']) && is_string($data['comment']) ? trim($data['comment']) : '';

if ($reservationId === false || $reservationId < 1) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A valid reservation ID is required.']);
    exit;
}
if ($rating === false || $rating < 1 || $rating > 5) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please select a valid rating (1 to 5).']);
    exit;
}
if ($comment === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please write a comment before submitting.']);
    exit;
}
$commentLength = function_exists('mb_strlen') ? mb_strlen($comment, 'UTF-8') : strlen($comment);
if ($commentLength > 500) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Comment must not exceed 500 characters.']);
    exit;
}

try {
    $buyerStmt = $pdo->prepare('SELECT buyer_id FROM buyer WHERE user_id=? LIMIT 1');
    $buyerStmt->execute([(int)$_SESSION['user']['id']]);
    $buyerId = $buyerStmt->fetchColumn();
    if ($buyerId === false) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Buyer account not found.']);
        exit;
    }

    $pdo->beginTransaction();
    $reservationStmt = $pdo->prepare("
        SELECT r.reservation_status,r.transaction_status,
               CASE WHEN r.reservation_source='crop' THEN rc.buyer_id ELSE cr.buyer_id END AS owner_buyer_id,
               EXISTS(SELECT 1 FROM payment p WHERE p.reservation_id=r.reservation_id
                   AND p.payment_type='final' AND p.payment_status='completed') AS has_completed_final
        FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source='crop' AND r.reserve_crop_id=rc.reserve_crop_id
        LEFT JOIN cultivation_request cr ON r.reservation_source='cultivation' AND r.cultivation_request_id=cr.cultivation_request_id
        WHERE r.reservation_id=? FOR UPDATE
    ");
    $reservationStmt->execute([(int)$reservationId]);
    $reservation = $reservationStmt->fetch();
    if (!$reservation) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Reservation not found.']);
        exit;
    }
    if ((int)$reservation['owner_buyer_id'] !== (int)$buyerId) {
        $pdo->rollBack();
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'You are not authorized to review this reservation.']);
        exit;
    }
    if (!in_array($reservation['reservation_status'], ['ready', 'completed'], true) || $reservation['transaction_status'] !== 'paid' || !(bool)$reservation['has_completed_final']) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Platform feedback is available only for fully paid reservations.']);
        exit;
    }

    $duplicateStmt = $pdo->prepare('SELECT id FROM platform_reviews WHERE buyer_id=? AND reservation_id=? LIMIT 1');
    $duplicateStmt->execute([(int)$buyerId, (int)$reservationId]);
    if ($duplicateStmt->fetch()) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Platform feedback has already been submitted for this reservation.']);
        exit;
    }

    $insertStmt = $pdo->prepare('INSERT INTO platform_reviews (buyer_id,reservation_id,rating,comment) VALUES (?,?,?,?)');
    $insertStmt->execute([(int)$buyerId, (int)$reservationId, (int)$rating, $comment]);
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Thank you! Your feedback has been submitted successfully.']);
} catch (PDOException $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($error->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Platform feedback has already been submitted for this reservation.']);
        exit;
    }
    error_log('Platform review submission failed: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to submit platform feedback.']);
}
