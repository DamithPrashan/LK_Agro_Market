<?php
// Enable CORS and define JSON response type
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

// Import database connection and auth check helpers
require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Verify buyer authentication and role
require_login();
require_role('buyer');

// Helper function for rate limiting based on session
if (!function_exists('enforce_rate_limit')) {
    function enforce_rate_limit($limit = 60, $timeframe = 60) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $now = time();
        if (!isset($_SESSION['rate_limit_requests'])) {
            $_SESSION['rate_limit_requests'] = [];
        }
        // Filter out old request timestamps
        $_SESSION['rate_limit_requests'] = array_filter(
            $_SESSION['rate_limit_requests'],
            function ($timestamp) use ($now, $timeframe) {
                return ($now - $timestamp) < $timeframe;
            }
        );
        // Block request if user exceeds limit
        if (count($_SESSION['rate_limit_requests']) >= $limit) {
            http_response_code(429);
            echo json_encode([
                "success" => false,
                "message" => "Too many requests. Please try again later."
            ]);
            exit;
        }
        $_SESSION['rate_limit_requests'][] = $now;
    }
}

// Enforce rate limit (60 requests per minute)
enforce_rate_limit(60, 60);

// Validate and parse the orderId parameter
$orderIdInput = isset($_GET['orderId']) ? trim($_GET['orderId']) : '';

if (empty($orderIdInput) || !preg_match('/^ORD(\d+)$/i', $orderIdInput, $matches)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid order ID format. Expected format: ORD1001"
    ]);
    exit;
}

$reservation_id = intval($matches[1]);
$user_id = $_SESSION['user']['id'];
global $pdo;

try {
    // Retrieve buyer_id associated with the logged-in user_id
    $buyerQuery = $pdo->prepare("SELECT buyer_id FROM buyer WHERE user_id = ?");
    $buyerQuery->execute([$user_id]);
    $buyer = $buyerQuery->fetch();

    if (!$buyer) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Buyer account not found for current session."
        ]);
        exit;
    }

    $buyer_id = intval($buyer['buyer_id']);

    // Fetch reservation details scoped to the buyer_id and reservation_id
    $sql = "
        SELECT 
            r.reservation_id,
            r.collection_date,
            r.reservation_status,
            r.transaction_status,
            r.completion_date,
            rc.quantity_requested,
            rc.unit_price,
            rc.total_amount,
            rc.reserved_date,
            c.crop_name,
            c.location as crop_location,
            u_farmer.name as farmer_name,
            u_farmer.phone as farmer_phone,
            u_farmer.email as farmer_email,
            u_buyer.location as buyer_location
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop c ON rc.crop_id = c.crop_id
        JOIN farmer f ON c.farmer_id = f.farmer_id
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        JOIN buyer b ON rc.buyer_id = b.buyer_id
        JOIN user u_buyer ON b.user_id = u_buyer.user_id
        WHERE rc.buyer_id = :buyer_id AND r.reservation_id = :reservation_id
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'buyer_id' => $buyer_id,
        'reservation_id' => $reservation_id
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Order not found or access denied."
        ]);
        exit;
    }

    // Map orderStatus
    $orderStatus = 'pending';
    if (in_array($row['reservation_status'], ['confirmed', 'ready'], true)) {
        $orderStatus = 'accepted';
    } elseif ($row['reservation_status'] === 'completed') {
        $orderStatus = 'completed';
    } elseif ($row['reservation_status'] === 'cancelled') {
        $orderStatus = 'cancelled';
    }

    // Map paymentStatus
    $paymentStatus = 'unpaid';
    if ($row['transaction_status'] === 'partially_paid') {
        $paymentStatus = 'partial';
    } elseif ($row['transaction_status'] === 'paid') {
        $paymentStatus = 'paid';
    }

    // Query payment history for this order (reservation_id)
    $paymentSql = "
        SELECT 
            payment_id,
            amount,
            payment_type,
            payment_date,
            payment_status
        FROM payment
        WHERE reservation_id = :reservation_id
        ORDER BY payment_id ASC
    ";
    $payStmt = $pdo->prepare($paymentSql);
    $payStmt->execute(['reservation_id' => $reservation_id]);
    $payments = $payStmt->fetchAll(PDO::FETCH_ASSOC);

    $paymentHistory = [];
    foreach ($payments as $pay) {
        $paymentHistory[] = [
            "paymentId" => intval($pay['payment_id']),
            "amount" => floatval($pay['amount']),
            "type" => $pay['payment_type'], // advance | final
            "date" => $pay['payment_date'],
            "status" => $pay['payment_status'] // pending | completed | failed
        ];
    }

    // Build the structured response
    $response = [
        "success" => true,
        "order" => [
            "orderId" => "ORD" . $row['reservation_id'],
            "cropName" => $row['crop_name'],
            "quantity" => floatval($row['quantity_requested']),
            "unit" => "kg",
            "date" => $row['collection_date'],
            "total" => floatval($row['total_amount']),
            "orderStatus" => $orderStatus,
            "paymentStatus" => $paymentStatus,
            "collectionDate" => $row['collection_date'],
            "completionDate" => $row['completion_date'],
            "farmer" => [
                "name" => $row['farmer_name'],
                "contact" => $row['farmer_phone'],
                "email" => $row['farmer_email']
            ],
            "deliveryAddress" => $row['buyer_location'], // Buyer's location
            "collectionLocation" => $row['crop_location'], // Farmer's crop collection location
            "itemizedBreakdown" => [
                "pricePerUnit" => floatval($row['unit_price']),
                "quantity" => floatval($row['quantity_requested']),
                "total" => floatval($row['total_amount'])
            ],
            "paymentHistory" => $paymentHistory
        ]
    ];

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
