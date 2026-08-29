<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../connection/db.php';
require_once __DIR__ . '/auth_check.php';

// Payments can only be submitted by the buyer who owns the reservation.
require_login();
require_role('buyer');

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

if (!in_array($method, ['bank', 'lanka'], true)) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "Invalid payment method."]);
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
            ca.timing_model,
            ca.planned_start_date,
            (SELECT COUNT(*) FROM payment p WHERE p.reservation_id = r.reservation_id AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_count,
            (SELECT COALESCE(SUM(p.amount), 0) FROM payment p WHERE p.reservation_id = r.reservation_id AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_amount
        FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source = 'crop' AND r.reserve_crop_id = rc.reserve_crop_id
        LEFT JOIN cultivation_request cr ON r.reservation_source = 'cultivation' AND r.cultivation_request_id = cr.cultivation_request_id
        LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id = ca.cultivation_ad_id
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
        if ($order['reservation_source'] === 'cultivation' && $order['timing_model'] === 'growing_period' && $order['planned_start_date'] === null) {
            echo json_encode(["success" => false, "message" => "The farmer must confirm the planned cultivation start date before advance payment."]);
            exit;
        }
        if ($resStatus !== 'confirmed' || $txStatus !== 'unpaid' ||
            ($order['reservation_source'] === 'cultivation' && $order['cultivation_request_status'] !== 'accepted')) {
            echo json_encode(["success" => false, "message" => "Advance payment requires a confirmed, unpaid order."]);
            exit;
        }
        $expected_amount = $expected_prepayment;
    } else {
        if ($resStatus !== 'ready' || $txStatus !== 'partially_paid' ||
            (int)$order['completed_advance_count'] !== 1 ||
            ($order['reservation_source'] === 'cultivation' && $order['cultivation_request_status'] !== 'accepted')) {
            echo json_encode(["success" => false, "message" => "Final payment requires a ready order with its advance already paid."]);
            exit;
        }
        $expected_amount = $expected_balance;
        if (abs((float)$order['completed_advance_amount'] - $expected_prepayment) > 0.01) {
            echo json_encode(["success" => false, "message" => "The completed advance payment is inconsistent with this agreement."]);
            exit;
        }
    }

    if (abs($amount - $expected_amount) > 0.01) {
        echo json_encode(["success" => false, "message" => "Payment amount mismatch. Expected: Rs " . $expected_amount . ", Submitted: Rs " . $amount]);
        exit;
    }
} catch (PDOException $e) {
    error_log('Payment validation failed: '.$e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to validate this payment. Please try again."]);
    exit;
}

$created_proof_file = null;
$old_proof_file = null;
try {
    $proof_file_path = 'online';
    if ($method === 'bank') {
        $upload_dir = __DIR__ . '/../storage/bank_receipts/';
        if (!is_dir($upload_dir)) {
            if (!mkdir($upload_dir, 0750, true) && !is_dir($upload_dir)) {
                throw new RuntimeException('Unable to prepare secure receipt storage.');
            }
        }

        if ((int)$_FILES['proof']['size'] <= 0 || (int)$_FILES['proof']['size'] > 5 * 1024 * 1024) {
            throw new DomainException('Payment proof must be no larger than 5 MB.');
        }
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($_FILES['proof']['tmp_name']);
        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'application/pdf' => 'pdf',
        ];
        if (!isset($allowedMimes[$mime])) {
            throw new DomainException('Payment proof must be a JPEG, PNG, WebP, or PDF file.');
        }
        $filename = 'bank_' . bin2hex(random_bytes(24)) . '.' . $allowedMimes[$mime];
        $proof_file_path = 'backend/storage/bank_receipts/' . $filename;

        if (!move_uploaded_file($_FILES['proof']['tmp_name'], $upload_dir . $filename)) {
            throw new RuntimeException('Failed to save uploaded proof file.');
        }
        $created_proof_file = $upload_dir . $filename;
    }

    // Lock and revalidate the order inside the write transaction to prevent
    // concurrent duplicate or out-of-sequence payments.
    $pdo->beginTransaction();

    $lockStmt = $pdo->prepare("
        SELECT r.reservation_source, r.reservation_status, r.transaction_status,
               CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_total_amount ELSE rc.total_amount END AS total_amount,
               cr.request_status AS cultivation_request_status,
               ca.timing_model,
               ca.planned_start_date,
               (SELECT COUNT(*) FROM payment p WHERE p.reservation_id = r.reservation_id AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_count,
               (SELECT COALESCE(SUM(p.amount), 0) FROM payment p WHERE p.reservation_id = r.reservation_id AND p.payment_type = 'advance' AND p.payment_status = 'completed') AS completed_advance_amount
        FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source = 'crop' AND r.reserve_crop_id = rc.reserve_crop_id
        LEFT JOIN cultivation_request cr ON r.reservation_source = 'cultivation' AND r.cultivation_request_id = cr.cultivation_request_id
        LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id = ca.cultivation_ad_id
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
    if ($payment_type === 'advance' && $lockedIsCultivation && $lockedOrder['timing_model'] === 'growing_period' && $lockedOrder['planned_start_date'] === null) {
        throw new DomainException('The farmer must confirm the planned cultivation start date before advance payment.');
    }
    if (($payment_type === 'advance' && ($lockedResStatus !== 'confirmed' || $lockedTxStatus !== 'unpaid' ||
            ($lockedIsCultivation && $lockedOrder['cultivation_request_status'] !== 'accepted'))) ||
        ($payment_type === 'final' && ($lockedResStatus !== 'ready' || $lockedTxStatus !== 'partially_paid' ||
            (int)$lockedOrder['completed_advance_count'] !== 1 ||
            ($lockedIsCultivation && $lockedOrder['cultivation_request_status'] !== 'accepted')))) {
        throw new RuntimeException('Payment state changed. Please refresh and try again.');
    }

    $lockedTotal = floatval($lockedOrder['total_amount']);
    $lockedExpectedAdvance = round($lockedTotal / 3);
    $lockedExpectedAmount = $payment_type === 'advance' ? $lockedExpectedAdvance : $lockedTotal - $lockedExpectedAdvance;
    if ($payment_type === 'final' && abs((float)$lockedOrder['completed_advance_amount'] - $lockedExpectedAdvance) > 0.01) {
        throw new RuntimeException('The completed advance payment is inconsistent with this agreement.');
    }
    if (abs($amount - $lockedExpectedAmount) > 0.01) {
        throw new RuntimeException('Payment amount does not match the order total.');
    }

    $duplicateStmt = $pdo->prepare("SELECT payment_id, method, payment_status, proof_file FROM payment WHERE reservation_id = ? AND payment_type = ? LIMIT 1 FOR UPDATE");
    $duplicateStmt->execute([$reservation_id, $payment_type]);
    $existingPayment = $duplicateStmt->fetch(PDO::FETCH_ASSOC);

    if ($existingPayment) {
        $canRetryBank = $method === 'bank'
            && $existingPayment['method'] === 'bank'
            && $existingPayment['payment_status'] === 'failed';
        if (!$canRetryBank) {
            throw new RuntimeException($existingPayment['payment_status'] === 'pending'
                ? 'This Bank payment is already awaiting Farmer verification.'
                : 'This payment has already been recorded.');
        }
        $old_proof_file = $existingPayment['proof_file'];
        $stmt = $pdo->prepare("UPDATE payment SET amount=?, method='bank', proof_file=?, payment_status='pending', payment_date=NOW() WHERE payment_id=?");
        $stmt->execute([$lockedExpectedAmount, $proof_file_path, $existingPayment['payment_id']]);
    } else {
        $status = $method === 'bank' ? 'pending' : 'completed';
        $sql = "INSERT INTO payment (reservation_id, payment_type, amount, method, proof_file, payment_status) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$reservation_id, $payment_type, $lockedExpectedAmount, $method, $proof_file_path, $status]);
    }

    if ($method === 'lanka' && $payment_type === 'final') {
        $ledgerStmt = $pdo->prepare("SELECT COUNT(*) AS payment_count, COALESCE(SUM(amount), 0) AS paid_total
            FROM payment WHERE reservation_id = ? AND payment_type IN ('advance', 'final') AND payment_status = 'completed'");
        $ledgerStmt->execute([$reservation_id]);
        $ledger = $ledgerStmt->fetch();
        if ((int)$ledger['payment_count'] !== 2 || abs((float)$ledger['paid_total'] - $lockedTotal) > 0.01) {
            throw new RuntimeException('Payment ledger does not match the cultivation agreement total.');
        }
    }

    // Bank slips remain pending until the owning Farmer verifies them.
    if ($method === 'lanka') {
        $new_status = ($payment_type === 'advance') ? 'partially_paid' : 'paid';
        $updateReservation = $pdo->prepare("UPDATE reservation SET transaction_status = ? WHERE reservation_id = ?");
        $updateReservation->execute([$new_status, $reservation_id]);
    }

    $pdo->commit();

    if ($old_proof_file) {
        $oldAbsolute = dirname(__DIR__) . '/../' . ltrim(str_replace('\\', '/', $old_proof_file), '/');
        $receiptRoot = realpath(__DIR__ . '/../storage/bank_receipts');
        $oldReal = realpath($oldAbsolute);
        if ($receiptRoot && $oldReal && str_starts_with($oldReal, $receiptRoot . DIRECTORY_SEPARATOR)) {
            @unlink($oldReal);
        }
    }

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
            
            $buyer_notif_data = json_encode([
                "amount" => $amount,
                "orderId" => $reservation_id,
                "source" => $paymentInfo['reservation_source'],
                "link" => "/buyer/BuyerOrderHistory"
            ]);
            $farmer_notif_data = json_encode([
                "amount" => $amount,
                "orderId" => $reservation_id,
                "source" => $paymentInfo['reservation_source'],
                "link" => "/farmer/orders"
            ]);

            if ($method === 'bank') {
                $stage = $payment_type === 'advance' ? 'Advance' : 'Final';
                create_notification($buyer_user_id, 'Payment Submitted', "Your Bank {$stage} payment for order ORD{$reservation_id} is awaiting Farmer verification.", 'bankPaymentSubmitted', $buyer_notif_data);
                create_notification($farmer_user_id, 'Bank Payment Verification Required', "A Bank receipt was submitted for the {$stage} payment on order ORD{$reservation_id} ({$crop_name}).", 'bankPaymentVerificationRequired', $farmer_notif_data);
            } else {
                // Existing Lanka/PayHere notification behavior remains unchanged.
                $buyer_msg = "Your payment of Rs {$amount} for order ORD{$reservation_id} ({$crop_name}) has been confirmed.";
                create_notification($buyer_user_id, "Payment Confirmed", $buyer_msg, 'paymentConfirmed', $buyer_notif_data);
                $isCultivationFinal = $paymentInfo['reservation_source'] === 'cultivation' && $payment_type === 'final';
                $farmer_msg = $isCultivationFinal
                    ? "Final payment received for cultivation order ORD{$reservation_id} ({$crop_name})."
                    : "Payment of Rs {$amount} has been received for order ORD{$reservation_id} ({$crop_name}).";
                create_notification($farmer_user_id, $isCultivationFinal ? "Cultivation Final Payment Received" : "Payment Received", $farmer_msg, $isCultivationFinal ? 'cultivationFinalPaymentReceived' : 'paymentReceived', $farmer_notif_data);
            }
        }
    } catch (Exception $e) {
        error_log("Notification error in submit_payment.php: " . $e->getMessage());
    }

    echo json_encode([
        "success" => true,
        "message" => $method === 'bank' ? "Payment submitted for Farmer verification." : "Payment proof submitted successfully.",
        "verification_pending" => $method === 'bank'
    ]);

} catch (DomainException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($created_proof_file && is_file($created_proof_file)) unlink($created_proof_file);
    http_response_code(422);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($created_proof_file && is_file($created_proof_file)) unlink($created_proof_file);
    error_log('Payment database write failed: '.$e->getMessage());
    http_response_code($e->getCode() === '23000' ? 409 : 500);
    echo json_encode(["success" => false, "message" => $e->getCode() === '23000' ? "This payment has already been recorded." : "Unable to submit payment. Please try again."]);
} catch (RuntimeException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($created_proof_file && is_file($created_proof_file)) unlink($created_proof_file);
    http_response_code(409);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($created_proof_file && is_file($created_proof_file)) unlink($created_proof_file);
    error_log('Payment submission failed: '.$e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Unable to submit payment. Please try again."]);
}
