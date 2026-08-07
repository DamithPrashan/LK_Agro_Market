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

// Validate and sanitize input query parameter
$status = isset($_GET['status']) ? strtolower(trim($_GET['status'])) : 'all';
$allowed_statuses = ['all', 'pending', 'accepted', 'completed'];

if (!in_array($status, $allowed_statuses, true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid status filter. Allowed values: all, pending, accepted, completed."
    ]);
    exit;
}

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

    // Build the query to pull reservations & associated details
    $sql = "
        SELECT 
            r.reservation_id,
            c.crop_name,
            rc.quantity_requested,
            r.collection_date,
            rc.total_amount,
            r.reservation_status,
            r.transaction_status,
            u_farmer.name as farmer_name,
            u_farmer.user_id as farmer_user_id,
            (SELECT COUNT(*) FROM message WHERE reservation_id = r.reservation_id AND sender_id = u_farmer.user_id AND is_read = 0) as unread_messages
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop c ON rc.crop_id = c.crop_id
        JOIN farmer f ON c.farmer_id = f.farmer_id
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        WHERE rc.buyer_id = :buyer_id
    ";

    // Append filtering conditions based on status parameter
    if ($status === 'pending') {
        $sql .= " AND r.reservation_status = 'pending'";
    } elseif ($status === 'accepted') {
        $sql .= " AND r.reservation_status IN ('confirmed', 'ready')";
    } elseif ($status === 'completed') {
        $sql .= " AND r.reservation_status = 'completed'";
    }

    $sql .= " ORDER BY r.reservation_id DESC";

    // Prepare and execute statement
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['buyer_id' => $buyer_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Map rows to exact output format requested
    $orders = [];
    foreach ($rows as $row) {
        // Map database reservation_status to required: pending | accepted | completed
        $orderStatus = 'pending';
        if (in_array($row['reservation_status'], ['confirmed', 'ready'], true)) {
            $orderStatus = 'accepted';
        } elseif ($row['reservation_status'] === 'completed') {
            $orderStatus = 'completed';
        } elseif ($row['reservation_status'] === 'cancelled') {
            $orderStatus = 'cancelled';
        }

        // Map database transaction_status to required: unpaid | partial | paid
        $paymentStatus = 'unpaid';
        if ($row['transaction_status'] === 'partially_paid') {
            $paymentStatus = 'partial';
        } elseif ($row['transaction_status'] === 'paid') {
            $paymentStatus = 'paid';
        }

        $orders[] = [
            "orderId" => "ORD" . $row['reservation_id'],
            "reservationId" => intval($row['reservation_id']),
            "cropName" => $row['crop_name'],
            "quantity" => floatval($row['quantity_requested']),
            "unit" => "kg", // Default unit for crops in this market system
            "date" => $row['collection_date'],
            "total" => floatval($row['total_amount']),
            "orderStatus" => $orderStatus,
            "paymentStatus" => $paymentStatus,
            "farmerName" => $row['farmer_name'],
            "farmerUserId" => intval($row['farmer_user_id']),
            "unreadMessages" => intval($row['unread_messages'])
        ];
    }

    echo json_encode([
        "success" => true,
        "orders" => $orders
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
