<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once __DIR__ . '/../../connection/db.php';
require_once __DIR__ . '/../../connection/payhere_config.php';
require_once __DIR__ . '/../auth_check.php';

// Ensure user is logged in
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$order_id = isset($data['order_id']) ? trim($data['order_id']) : '';
$amount = isset($data['amount']) ? floatval($data['amount']) : 0.0;
$currency = isset($data['currency']) ? trim($data['currency']) : 'LKR';

if (empty($order_id) || $amount <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid parameters."]);
    exit;
}

$merchant_id = PAYHERE_MERCHANT_ID;
$merchant_secret = PAYHERE_MERCHANT_SECRET;

$amount_formatted = number_format($amount, 2, '.', '');
$hash = strtoupper(
    md5(
        $merchant_id . 
        $order_id . 
        $amount_formatted . 
        $currency . 
        strtoupper(md5($merchant_secret))
    )
);

echo json_encode([
    "success" => true,
    "hash" => $hash,
    "merchant_id" => $merchant_id,
    "sandbox" => PAYHERE_IS_SANDBOX
]);
?>
