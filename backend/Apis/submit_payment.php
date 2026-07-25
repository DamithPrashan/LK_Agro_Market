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

// Map payment type: prepayment -> advance, balance -> final
$payment_type = ($payment_type_raw === 'prepayment') ? 'advance' : 'final';

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
            r.reservation_status, 
            r.transaction_status,
            rc.buyer_id, 
            rc.total_amount
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        WHERE r.reservation_id = ? AND rc.buyer_id = ?
    ");
    $resQuery->execute([$reservation_id, $buyer_id]);
    $order = $resQuery->fetch();

    if (!$order) {
        echo json_encode(["success" => false, "message" => "Reservation not found or access denied."]);
        exit;
    }

    $resStatus = strtolower($order['reservation_status']);
    $txStatus = strtolower($order['transaction_status']);

    if (!in_array($resStatus, ['confirmed', 'ready'], true)) {
        echo json_encode(["success" => false, "message" => "This order is not in a payable status. Current status: " . strtoupper($resStatus)]);
        exit;
    }

    $total_amount = floatval($order['total_amount']);
    $expected_prepayment = round($total_amount / 3);
    $expected_balance = $total_amount - $expected_prepayment;

    if ($payment_type === 'advance') {
        if ($txStatus !== 'unpaid') {
            echo json_encode(["success" => false, "message" => "Pre-payment has already been made."]);
            exit;
        }
        $expected_amount = $expected_prepayment;
    } else {
        if ($txStatus !== 'partially_paid') {
            echo json_encode(["success" => false, "message" => "Final balance payment requires a prior pre-payment."]);
            exit;
        }
        $expected_amount = $expected_balance;
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

    // Begin Transaction
    $pdo->beginTransaction();

    // Insert payment record into payment table (not payments)
    $sql = "INSERT INTO payment (reservation_id, payment_type, amount, method, proof_file, payment_status) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$reservation_id, $payment_type, $amount, $method, $proof_file_path, 'completed']);

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
                b.user_id as buyer_user_id,
                u_farmer.user_id as farmer_user_id,
                c.crop_name
            FROM reservation r
            JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
            JOIN crop c ON rc.crop_id = c.crop_id
            JOIN farmer f ON c.farmer_id = f.farmer_id
            JOIN user u_farmer ON f.user_id = u_farmer.user_id
            JOIN buyer b ON rc.buyer_id = b.buyer_id
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
            $farmer_msg = "Payment of Rs {$amount} has been received for order ORD{$reservation_id} ({$crop_name}).";
            create_notification($farmer_user_id, "Payment Received", $farmer_msg, 'paymentReceived', $notif_data);
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
