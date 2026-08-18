<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../connection/db.php';
require_once __DIR__ . '/auth_check.php';

// Ensure user is logged in
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$reservation_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
$payment_type_raw = isset($_POST['payment_type']) ? trim($_POST['payment_type']) : '';
$amount = isset($_POST['amount']) ? floatval($_POST['amount']) : 0.0;
$method = isset($_POST['method']) ? trim($_POST['method']) : '';

if ($reservation_id === 0 || empty($payment_type_raw) || $amount <= 0 || empty($method)) {
    echo json_encode(["success" => false, "message" => "Invalid payment data submitted."]);
    exit;
}

if ($method === 'bank') {
    if (!isset($_FILES['proof']) || $_FILES['proof']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(["success" => false, "message" => "Please upload a valid payment proof."]);
        exit;
    }
}

// Accept only known client or normalized values.
$payment_type_map = [
    'prepayment' => 'advance',
    'advance' => 'advance',
    'balance' => 'final',
    'final' => 'final'
];
if (!isset($payment_type_map[$payment_type_raw])) {
    echo json_encode(["success" => false, "message" => "Invalid payment type."]);
    exit;
}
$payment_type = $payment_type_map[$payment_type_raw];

// Validate order ownership, status, and server-calculated amount
try {
    $buyerQuery = $pdo->prepare("SELECT buyer_id FROM buyer WHERE user_id = ?");
    $buyerQuery->execute([$_SESSION['user']['id']]);
    $buyer = $buyerQuery->fetch();

    if (!$buyer) {
        echo json_encode(["success" => false, "message" => "Buyer account not found."]);
        exit;
    }
    $buyer_id = intval($buyer['buyer_id']);

    $resQuery = $pdo->prepare("
        SELECT 
            r.reservation_id, 
            r.reservation_source,
            r.reservation_status, 
            r.transaction_status,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.buyer_id ELSE rc.buyer_id END AS buyer_id,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_total_amount ELSE rc.total_amount END AS total_amount,
            cr.request_status AS cultivation_request_status,
            (SELECT COUNT(*) FROM payment p WHERE p.reservation_id = r.reservation_id AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_count,
            (SELECT COALESCE(SUM(p.amount), 0) FROM payment p WHERE p.reservation_id = r.reservation_id AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_amount
        FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source = 'crop' AND r.reserve_crop_id = rc.reserve_crop_id
        LEFT JOIN cultivation_request cr ON r.reservation_source = 'cultivation' AND r.cultivation_request_id = cr.cultivation_request_id
        WHERE r.reservation_id = ?
          AND ((r.reservation_source = 'crop' AND rc.buyer_id = ?)
            OR (r.reservation_source = 'cultivation' AND cr.buyer_id = ?))
    ");
    $resQuery->execute([$reservation_id, $buyer_id, $buyer_id]);
    $order = $resQuery->fetch();

    if (!$order) {
        echo json_encode(["success" => false, "message" => "Reservation not found or access denied."]);
        exit;
    }

    $resStatus = strtolower($order['reservation_status']);
    $txStatus = strtolower($order['transaction_status']);

    $total_amount = floatval($order['total_amount']);
    $expected_prepayment = round($total_amount / 3);
    $expected_balance = $total_amount - $expected_prepayment;

    if ($payment_type === 'advance') {
        if ($resStatus !== 'confirmed' || $txStatus !== 'unpaid' ||
            ($order['reservation_source'] === 'cultivation' && $order['cultivation_request_status'] !== 'accepted')) {
            echo json_encode(["success" => false, "message" => "Advance payment requires a confirmed, unpaid order."]);
            exit;
        }
        $expected_amount = $expected_prepayment;
    } else {
        if ($resStatus !== 'ready' || $txStatus !== 'partially_paid' ||
            ($order['reservation_source'] === 'cultivation' &&
                ($order['cultivation_request_status'] !== 'accepted' || (int)$order['completed_advance_count'] !== 1))) {
            echo json_encode(["success" => false, "message" => "Final payment requires a ready order with its advance already paid."]);
            exit;
        }
        $expected_amount = $expected_balance;
        if ($order['reservation_source'] === 'cultivation' && abs((float)$order['completed_advance_amount'] - $expected_prepayment) > 0.01) {
            echo json_encode(["success" => false, "message" => "The completed advance payment is inconsistent with this agreement."]);
            exit;
        }
    }

    if (abs($amount - $expected_amount) > 1.0) {
        echo json_encode(["success" => false, "message" => "Payment amount mismatch. Expected: Rs " . $expected_amount . ", Submitted: Rs " . $amount]);
        exit;
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Validation error: " . $e->getMessage()]);
    exit;
}

try {
    $proof_file_path = 'online';
    if ($method === 'bank') {
        $upload_dir = '../uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        // Process proof file
        $ext = pathinfo($_FILES['proof']['name'], PATHINFO_EXTENSION);
        $filename = 'pay_' . time() . '_' . uniqid() . '.' . $ext;
        $proof_file_path = 'backend/uploads/' . $filename;

        if (!move_uploaded_file($_FILES['proof']['tmp_name'], $upload_dir . $filename)) {
            echo json_encode(["success" => false, "message" => "Failed to save uploaded proof file."]);
            exit;
        }
    }

    // Lock and revalidate the order inside the write transaction to prevent
    // concurrent duplicate or out-of-sequence payments.
    $pdo->beginTransaction();

    $lockStmt = $pdo->prepare("
        SELECT r.reservation_source, r.reservation_status, r.transaction_status,
               CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_total_amount ELSE rc.total_amount END AS total_amount,
               cr.request_status AS cultivation_request_status,
               (SELECT COUNT(*) FROM payment p WHERE p.reservation_id = r.reservation_id AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_count,
               (SELECT COALESCE(SUM(p.amount), 0) FROM payment p WHERE p.reservation_id = r.reservation_id AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_amount
        FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source = 'crop' AND r.reserve_crop_id = rc.reserve_crop_id
        LEFT JOIN cultivation_request cr ON r.reservation_source = 'cultivation' AND r.cultivation_request_id = cr.cultivation_request_id
        WHERE r.reservation_id = ?
          AND ((r.reservation_source = 'crop' AND rc.buyer_id = ?)
            OR (r.reservation_source = 'cultivation' AND cr.buyer_id = ?))
        FOR UPDATE
    ");
    $lockStmt->execute([$reservation_id, $buyer_id, $buyer_id]);
    $lockedOrder = $lockStmt->fetch();
    if (!$lockedOrder) {
        throw new RuntimeException('Reservation not found or access denied.');
    }

    $lockedResStatus = strtolower($lockedOrder['reservation_status']);
    $lockedTxStatus = strtolower($lockedOrder['transaction_status']);
    $lockedIsCultivation = $lockedOrder['reservation_source'] === 'cultivation';
    if (($payment_type === 'advance' && ($lockedResStatus !== 'confirmed' || $lockedTxStatus !== 'unpaid' ||
            ($lockedIsCultivation && $lockedOrder['cultivation_request_status'] !== 'accepted'))) ||
        ($payment_type === 'final' && ($lockedResStatus !== 'ready' || $lockedTxStatus !== 'partially_paid' ||
            ($lockedIsCultivation && ($lockedOrder['cultivation_request_status'] !== 'accepted' || (int)$lockedOrder['completed_advance_count'] !== 1))))) {
        throw new RuntimeException('Payment state changed. Please refresh and try again.');
    }

    $lockedTotal = floatval($lockedOrder['total_amount']);
    $lockedExpectedAdvance = round($lockedTotal / 3);
    $lockedExpectedAmount = $payment_type === 'advance' ? $lockedExpectedAdvance : $lockedTotal - $lockedExpectedAdvance;
    if ($lockedIsCultivation && $payment_type === 'final' && abs((float)$lockedOrder['completed_advance_amount'] - $lockedExpectedAdvance) > 0.01) {
        throw new RuntimeException('The completed advance payment is inconsistent with this agreement.');
    }
    if (abs($amount - $lockedExpectedAmount) > 1.0) {
        throw new RuntimeException('Payment amount does not match the order total.');
    }

    $duplicateStmt = $pdo->prepare("SELECT payment_id FROM payment WHERE reservation_id = ? AND payment_type = ? LIMIT 1");
    $duplicateStmt->execute([$reservation_id, $payment_type]);
    if ($duplicateStmt->fetch()) {
        throw new RuntimeException('This payment has already been recorded.');
    }

    // Insert payment record into payment table (not payments)
    $sql = "INSERT INTO payment (reservation_id, payment_type, amount, method, proof_file, payment_status) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$reservation_id, $payment_type, $amount, $method, $proof_file_path, 'completed']);

    if ($lockedIsCultivation && $payment_type === 'final') {
        $ledgerStmt = $pdo->prepare("SELECT COUNT(*) AS payment_count, COALESCE(SUM(amount), 0) AS paid_total
            FROM payment WHERE reservation_id = ? AND payment_type IN ('advance', 'final') AND payment_status = 'completed'");
        $ledgerStmt->execute([$reservation_id]);
        $ledger = $ledgerStmt->fetch();
        if ((int)$ledger['payment_count'] !== 2 || abs((float)$ledger['paid_total'] - $lockedTotal) > 0.01) {
            throw new RuntimeException('Payment ledger does not match the cultivation agreement total.');
        }
    }

    // Update reservation transaction status
    $new_status = ($payment_type === 'advance') ? 'partially_paid' : 'paid';
    $updateReservation = $pdo->prepare("UPDATE reservation SET transaction_status = ? WHERE reservation_id = ?");
    $updateReservation->execute([$new_status, $reservation_id]);

    $pdo->commit();

    // Trigger Notification to Buyer and Farmer
    try {
        require_once __DIR__ . '/../create_notification.php';
        
        $paymentInfoStmt = $pdo->prepare("
            SELECT 
                CASE WHEN r.reservation_source = 'cultivation' THEN cb.user_id ELSE b.user_id END as buyer_user_id,
                u_farmer.user_id as farmer_user_id,
                CASE WHEN r.reservation_source = 'cultivation' THEN ca.crop_name ELSE c.crop_name END as crop_name,
                r.reservation_source
            FROM reservation r
            LEFT JOIN reserve_crop rc ON r.reservation_source = 'crop' AND r.reserve_crop_id = rc.reserve_crop_id
            LEFT JOIN crop c ON rc.crop_id = c.crop_id
            LEFT JOIN buyer b ON rc.buyer_id = b.buyer_id
            LEFT JOIN cultivation_request cr ON r.reservation_source = 'cultivation' AND r.cultivation_request_id = cr.cultivation_request_id
            LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id = ca.cultivation_ad_id
            LEFT JOIN buyer cb ON cr.buyer_id = cb.buyer_id
            JOIN farmer f ON f.farmer_id = CASE WHEN r.reservation_source = 'cultivation' THEN ca.farmer_id ELSE c.farmer_id END
            JOIN user u_farmer ON f.user_id = u_farmer.user_id
            WHERE r.reservation_id = ?
        ");
        $paymentInfoStmt->execute([$reservation_id]);
        $paymentInfo = $paymentInfoStmt->fetch();
        
        if ($paymentInfo) {
            $buyer_user_id = $paymentInfo['buyer_user_id'];
            $farmer_user_id = $paymentInfo['farmer_user_id'];
            $crop_name = $paymentInfo['crop_name'];
            
            $notif_data = json_encode([
                "amount" => $amount,
                "orderId" => $reservation_id
            ]);

            // Notify Buyer
            $buyer_msg = "Your payment of Rs {$amount} for order ORD{$reservation_id} ({$crop_name}) has been confirmed.";
            create_notification($buyer_user_id, "Payment Confirmed", $buyer_msg, 'paymentConfirmed', $notif_data);
            
            // Notify Farmer
            $isCultivationFinal = $paymentInfo['reservation_source'] === 'cultivation' && $payment_type === 'final';
            $farmer_msg = $isCultivationFinal
                ? "Final payment received for cultivation order ORD{$reservation_id} ({$crop_name})."
                : "Payment of Rs {$amount} has been received for order ORD{$reservation_id} ({$crop_name}).";
            create_notification($farmer_user_id, $isCultivationFinal ? "Cultivation Final Payment Received" : "Payment Received", $farmer_msg, $isCultivationFinal ? 'cultivationFinalPaymentReceived' : 'paymentReceived', $notif_data);
        }
    } catch (Exception $e) {
        error_log("Notification error in submit_payment.php: " . $e->getMessage());
    }

    echo json_encode([
        "success" => true,
        "message" => "Payment proof submitted successfully."
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
