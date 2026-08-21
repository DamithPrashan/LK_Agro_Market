<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in and is a farmer
require_login();
require_role('farmer');

$user_id = $_SESSION['user']['id'];

// Get POST JSON data
$data = isset($mockInput) ? $mockInput : json_decode(file_get_contents("php://input"), true);
$order_id = isset($data['order_id']) ? intval($data['order_id']) : 0;
$action = isset($data['action']) ? trim($data['action']) : '';
$collection_date = isset($data['collection_date']) ? trim((string)$data['collection_date']) : '';

if ($order_id <= 0 || empty($action)) {
    echo json_encode(["success" => false, "message" => "Invalid parameters."]);
    exit;
}

try {
    // 1. Get farmer details
    $farmerQuery = $pdo->prepare("SELECT farmer_id FROM farmer WHERE user_id = ?");
    $farmerQuery->execute([$user_id]);
    $farmer = $farmerQuery->fetch();
    
    if (!$farmer) {
        echo json_encode(["success" => false, "message" => "Unauthorized: Logged in user is not registered as a farmer."]);
        exit;
    }
    
    $farmer_id = $farmer['farmer_id'];

    $allowed_actions = ['accept', 'decline', 'ready', 'complete'];
    if (!in_array($action, $allowed_actions, true)) {
        echo json_encode(["success" => false, "message" => "Invalid action."]);
        exit;
    }

    $pdo->beginTransaction();

    // Lock the reservation and its source record. This serializes competing
    // status transitions and keeps ownership and payment checks atomic.
    $checkQuery = $pdo->prepare("
        SELECT r.reservation_id, r.reservation_source, r.reservation_status, r.transaction_status, r.collection_date,
               rc.reserve_crop_id, rc.status AS reserve_status,
               rc.quantity_requested, c.crop_id, c.quantity AS available_quantity,
               c.crop_status, cr.request_status AS cultivation_request_status, cr.agreed_growing_period_days,
               ca.timing_model, ca.cultivation_started_at,
               CASE WHEN ca.cultivation_started_at IS NOT NULL AND cr.agreed_growing_period_days IS NOT NULL THEN DATE(DATE_ADD(ca.cultivation_started_at, INTERVAL cr.agreed_growing_period_days DAY)) END AS estimated_harvest_date,
               CASE WHEN r.reservation_source = 'cultivation' THEN cb.user_id ELSE b.user_id END AS buyer_user_id,
               CASE WHEN r.reservation_source = 'cultivation' THEN ca.crop_name ELSE c.crop_name END AS crop_name,
               CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_total_amount ELSE rc.total_amount END AS order_total,
               (SELECT COUNT(*) FROM payment p
                WHERE p.reservation_id = r.reservation_id
                  AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_count,
               (SELECT COALESCE(SUM(p.amount), 0) FROM payment p
                WHERE p.reservation_id = r.reservation_id
                  AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_amount,
               (SELECT COUNT(*) FROM payment p
                WHERE p.reservation_id = r.reservation_id
                  AND p.payment_type = 'final' AND p.payment_status = 'completed') AS completed_final_count,
               (SELECT COALESCE(SUM(p.amount), 0) FROM payment p
                WHERE p.reservation_id = r.reservation_id AND p.payment_status = 'completed'
                  AND p.payment_type IN ('advance', 'final')) AS completed_payment_total
        FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source = 'crop' AND r.reserve_crop_id = rc.reserve_crop_id
        LEFT JOIN crop c ON rc.crop_id = c.crop_id
        LEFT JOIN buyer b ON rc.buyer_id = b.buyer_id
        LEFT JOIN cultivation_request cr ON r.reservation_source = 'cultivation' AND r.cultivation_request_id = cr.cultivation_request_id
        LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id = ca.cultivation_ad_id
        LEFT JOIN buyer cb ON cr.buyer_id = cb.buyer_id
        WHERE r.reservation_id = ?
          AND ((r.reservation_source = 'crop' AND c.farmer_id = ?)
            OR (r.reservation_source = 'cultivation' AND ca.farmer_id = ?))
        FOR UPDATE
    ");
    $checkQuery->execute([$order_id, $farmer_id, $farmer_id]);
    $order = $checkQuery->fetch();
    if (!$order) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "Unauthorized access to this order."]);
        exit;
    }

    $isCultivation = $order['reservation_source'] === 'cultivation';
    if ($isCultivation && !in_array($action, ['ready', 'complete'], true)) {
        throw new DomainException('This transition is not available for cultivation orders.');
    }

    if ($action === 'accept') {
        if ($order['reservation_status'] !== 'pending' || $order['reserve_status'] !== 'pending' || $order['transaction_status'] !== 'unpaid') {
            throw new DomainException('Only a pending, unpaid request can be accepted.');
        }
        if ($order['crop_status'] !== 'active') {
            throw new DomainException('This crop listing is no longer active.');
        }
        $requested = floatval($order['quantity_requested']);
        $available = floatval($order['available_quantity']);
        if ($requested > $available) {
            throw new DomainException("Not enough stock to accept this request. Available quantity is {$available} kg.");
        }
        $remaining = $available - $requested;
        $nextCropStatus = $remaining <= 0 ? 'fulfilled' : 'active';
        $pdo->prepare("UPDATE crop SET quantity = ?, crop_status = ? WHERE crop_id = ?")
            ->execute([$remaining, $nextCropStatus, $order['crop_id']]);
        $pdo->prepare("UPDATE reservation SET reservation_status = 'confirmed' WHERE reservation_id = ?")->execute([$order_id]);
        $pdo->prepare("UPDATE reserve_crop SET status = 'confirmed' WHERE reserve_crop_id = ?")
            ->execute([$order['reserve_crop_id']]);
    } elseif ($action === 'decline') {
        if ($order['reservation_status'] !== 'pending' || $order['reserve_status'] !== 'pending') {
            throw new DomainException('Only a pending request can be declined.');
        }
        $pdo->prepare("UPDATE reservation SET reservation_status = 'cancelled' WHERE reservation_id = ?")->execute([$order_id]);
        $pdo->prepare("UPDATE reserve_crop SET status = 'cancelled' WHERE reserve_crop_id = ?")
            ->execute([$order['reserve_crop_id']]);
    } elseif ($action === 'ready') {
        $sourceReady = $isCultivation
            ? $order['cultivation_request_status'] === 'accepted'
            : $order['reserve_status'] === 'confirmed';
        $validAdvance = (int)$order['completed_advance_count'] === 1
            && abs((float)$order['completed_advance_amount'] - round((float)$order['order_total'] / 3)) <= 0.01;
        if ($order['reservation_status'] !== 'confirmed' || $order['transaction_status'] !== 'partially_paid' || !$sourceReady || !$validAdvance) {
            throw new DomainException('The order can be marked ready only after the advance payment is completed.');
        }
        if ($isCultivation && $order['timing_model'] === 'growing_period') {
            if ($order['cultivation_started_at'] === null || $order['estimated_harvest_date'] === null) {
                throw new DomainException('Cultivation must be started before this order can be marked ready.');
            }
            $date = DateTimeImmutable::createFromFormat('!Y-m-d', $collection_date);
            $today = new DateTimeImmutable('today');
            if (!$date || $date->format('Y-m-d') !== $collection_date || $date < $today) {
                throw new DomainException('Enter a valid collection date that is not in the past.');
            }
            if ($collection_date < $order['estimated_harvest_date']) {
                throw new DomainException('Collection date must be on or after estimated harvest.');
            }
            $pdo->prepare("UPDATE reservation SET collection_date=?, reservation_status='ready' WHERE reservation_id=?")->execute([$collection_date, $order_id]);
        } else {
            $pdo->prepare("UPDATE reservation SET reservation_status = 'ready' WHERE reservation_id = ?")->execute([$order_id]);
        }
        if ($isCultivation) {
            require_once 'create_notification.php';
            $confirmedDate = $order['timing_model'] === 'growing_period' ? $collection_date : $order['collection_date'];
            $notificationData = json_encode(['orderId' => $order_id, 'cropName' => $order['crop_name'], 'collectionDate' => $confirmedDate, 'source' => 'cultivation', 'link' => '/buyer/BuyerOrderHistory']);
            if (!create_notification((int)$order['buyer_user_id'], 'Cultivation Order Ready', 'Your cultivation order is ready.', 'cultivationOrderReady', $notificationData)) {
                throw new RuntimeException('Unable to notify the buyer that the cultivation order is ready.');
            }
        } else {
            $pdo->prepare("UPDATE reserve_crop SET status = 'ready' WHERE reserve_crop_id = ?")
                ->execute([$order['reserve_crop_id']]);
        }
    } elseif ($action === 'complete') {
        $sourceComplete = $isCultivation
            ? $order['cultivation_request_status'] === 'accepted'
            : $order['reserve_status'] === 'ready';
        $validLedger = (int)$order['completed_advance_count'] === 1
            && (int)$order['completed_final_count'] === 1
            && abs((float)$order['completed_advance_amount'] - round((float)$order['order_total'] / 3)) <= 0.01
            && abs((float)$order['completed_payment_total'] - (float)$order['order_total']) <= 0.01;
        if ($order['reservation_status'] !== 'ready' || $order['transaction_status'] !== 'paid' || !$sourceComplete || !$validLedger) {
            throw new DomainException('The order can be completed only after the final payment is completed.');
        }
        $pdo->prepare("UPDATE reservation SET reservation_status = 'completed', completion_date = NOW() WHERE reservation_id = ?")->execute([$order_id]);
        if ($isCultivation) {
            require_once 'create_notification.php';
            $notificationData = json_encode(['orderId' => $order_id, 'cropName' => $order['crop_name'], 'source' => 'cultivation', 'link' => '/buyer/BuyerOrderHistory']);
            if (!create_notification((int)$order['buyer_user_id'], 'Cultivation Order Completed', 'Your cultivation order has been completed.', 'cultivationOrderCompleted', $notificationData)) {
                throw new RuntimeException('Unable to notify the buyer that the cultivation order was completed.');
            }
        } else {
            $pdo->prepare("UPDATE reserve_crop SET status = 'completed' WHERE reserve_crop_id = ?")
                ->execute([$order['reserve_crop_id']]);
        }
    }

    $pdo->commit();

    // Trigger Notification to Buyer
    try {
        if ($action === 'accept' || $action === 'decline') {
            require_once 'create_notification.php';
            
            $buyerInfoStmt = $pdo->prepare("
                SELECT b.user_id as buyer_user_id, c.crop_name 
                FROM reservation r
                JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
                JOIN crop c ON rc.crop_id = c.crop_id
                JOIN buyer b ON rc.buyer_id = b.buyer_id
                WHERE r.reservation_id = ?
            ");
            $buyerInfoStmt->execute([$order_id]);
            $buyerInfo = $buyerInfoStmt->fetch();
            
            if ($buyerInfo) {
                $buyer_user_id = $buyerInfo['buyer_user_id'];
                $crop_name = $buyerInfo['crop_name'];
                
                if ($action === 'accept') {
                    $notif_title = "Reservation Accepted";
                    $notif_msg = "Your order ORD{$order_id} for {$crop_name} has been accepted. Status: confirmed.";
                    $notif_type = 'orderAccepted';
                } else {
                    $notif_title = "Reservation Declined";
                    $notif_msg = "Your order ORD{$order_id} for {$crop_name} has been declined. Status: cancelled.";
                    $notif_type = 'orderDeclined';
                }
                $notif_data = json_encode([
                    "cropName" => $crop_name
                ]);
                
                create_notification($buyer_user_id, $notif_title, $notif_msg, $notif_type, $notif_data);
            }
        }
    } catch (Exception $e) {
        error_log("Notification error in update_order_status.php: " . $e->getMessage());
    }

    echo json_encode(["success" => true, "message" => "Order updated successfully."]);

} catch (DomainException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(409);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Order status update failed: '.$e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to update the order. Please try again."]);
}
?>
