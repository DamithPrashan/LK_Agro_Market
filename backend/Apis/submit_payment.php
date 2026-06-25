<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once 'auth_check.php';

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

if (!isset($_FILES['proof']) || $_FILES['proof']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "Please upload a valid payment proof."]);
    exit;
}

// Map payment type: prepayment -> advance, balance -> final
$payment_type = ($payment_type_raw === 'prepayment') ? 'advance' : 'final';

$upload_dir = '../uploads/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

try {
    // Process proof file
    $ext = pathinfo($_FILES['proof']['name'], PATHINFO_EXTENSION);
    $filename = 'pay_' . time() . '_' . uniqid() . '.' . $ext;
    $proof_file_path = 'backend/uploads/' . $filename;

    if (!move_uploaded_file($_FILES['proof']['tmp_name'], $upload_dir . $filename)) {
        echo json_encode(["success" => false, "message" => "Failed to save uploaded proof file."]);
        exit;
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
