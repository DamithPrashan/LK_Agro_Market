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
            r.reservation_source,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.crop_name ELSE c.crop_name END AS crop_name,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_quantity ELSE rc.quantity_requested END AS quantity_requested,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_unit_price ELSE rc.unit_price END AS unit_price,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_total_amount ELSE rc.total_amount END AS total_amount,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.unit ELSE 'kg' END AS unit,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.timing_model END AS timing_model,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_growing_period_days END AS agreed_growing_period_days,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.cultivation_started_at END AS cultivation_started_at,
            CASE WHEN r.reservation_source = 'cultivation' AND ca.cultivation_started_at IS NOT NULL AND cr.agreed_growing_period_days IS NOT NULL THEN DATE(DATE_ADD(ca.cultivation_started_at, INTERVAL cr.agreed_growing_period_days DAY)) END AS estimated_harvest_date,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.status END AS cultivation_ad_status,
            r.collection_date,
            r.reservation_status,
            r.transaction_status,
            u_farmer.name as farmer_name,
            u_farmer.user_id as farmer_user_id,
            (SELECT COUNT(*) FROM message WHERE reservation_id = r.reservation_id AND sender_id = u_farmer.user_id AND is_read = 0) as unread_messages
        FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source = 'crop' AND r.reserve_crop_id = rc.reserve_crop_id
        LEFT JOIN crop c ON rc.crop_id = c.crop_id
        LEFT JOIN cultivation_request cr ON r.reservation_source = 'cultivation' AND r.cultivation_request_id = cr.cultivation_request_id
        LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id = ca.cultivation_ad_id
        JOIN farmer f ON f.farmer_id = CASE WHEN r.reservation_source = 'cultivation' THEN ca.farmer_id ELSE c.farmer_id END
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        WHERE ((r.reservation_source = 'crop' AND rc.buyer_id = :buyer_id)
            OR (r.reservation_source = 'cultivation' AND cr.buyer_id = :cultivation_buyer_id AND cr.request_status = 'accepted'))
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
    $stmt->execute(['buyer_id' => $buyer_id, 'cultivation_buyer_id' => $buyer_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Map rows to exact output format requested
    $orders = [];
    foreach ($rows as $row) {
        // Map database reservation_status to required: pending | accepted | completed
        $orderStatus = 'pending';
        if ($row['reservation_status'] === 'confirmed') {
            $orderStatus = 'accepted';
        } elseif ($row['reservation_status'] === 'ready') {
            $orderStatus = 'ready';
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

        $lifecycleStatus = 'pending';
        if ($row['reservation_status'] === 'cancelled') {
            $lifecycleStatus = 'cancelled';
        } elseif ($row['reservation_status'] === 'completed' && $row['transaction_status'] === 'paid') {
            $lifecycleStatus = 'completed';
        } elseif ($row['reservation_status'] === 'confirmed' && $row['transaction_status'] === 'unpaid') {
            $lifecycleStatus = 'awaiting_advance';
        } elseif ($row['reservation_status'] === 'confirmed' && $row['transaction_status'] === 'partially_paid') {
            $lifecycleStatus = 'in_preparation';
        } elseif ($row['reservation_status'] === 'ready' && $row['transaction_status'] === 'partially_paid') {
            $lifecycleStatus = 'final_payment_required';
        } elseif ($row['reservation_status'] === 'ready' && $row['transaction_status'] === 'paid') {
            $lifecycleStatus = 'awaiting_completion';
        }

        $orders[] = [
            "orderId" => "ORD" . $row['reservation_id'],
            "reservationId" => intval($row['reservation_id']),
            "reservationSource" => $row['reservation_source'],
            "cropName" => $row['crop_name'],
            "quantity" => floatval($row['quantity_requested']),
            "unit" => $row['unit'],
            "unitPrice" => floatval($row['unit_price']),
            "date" => $row['collection_date'],
            "timingModel" => $row['timing_model'],
            "agreedGrowingPeriodDays" => $row['agreed_growing_period_days'] === null ? null : intval($row['agreed_growing_period_days']),
            "cultivationStartedAt" => $row['cultivation_started_at'],
            "estimatedHarvestDate" => $row['estimated_harvest_date'],
            "cultivationAdStatus" => $row['cultivation_ad_status'],
            "total" => floatval($row['total_amount']),
            "orderStatus" => $orderStatus,
            "paymentStatus" => $paymentStatus,
            "reservationStatus" => $row['reservation_status'],
            "transactionStatus" => $row['transaction_status'],
            "lifecycleStatus" => $lifecycleStatus,
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
