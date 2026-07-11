<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in and is a buyer
require_login();
require_role('buyer');

$user_id = $_SESSION['user']['id'];

try {
    // 1. Get buyer profile details
    $userQuery = $pdo->prepare("SELECT name, location FROM user WHERE user_id = ?");
    $userQuery->execute([$user_id]);
    $userProfile = $userQuery->fetch();
    
    if (!$userProfile) {
        echo json_encode([
            "success" => false,
            "message" => "User profile not found."
        ]);
        exit;
    }
    
    // Find buyer_id for user_id
    $buyerQuery = $pdo->prepare("SELECT buyer_id FROM buyer WHERE user_id = ?");
    $buyerQuery->execute([$user_id]);
    $buyer = $buyerQuery->fetch();
    
    if (!$buyer) {
        echo json_encode([
            "success" => false,
            "message" => "Buyer account not found."
        ]);
        exit;
    }
    
    $buyer_id = $buyer['buyer_id'];
    
    // 2. Fetch statistics
    // Pending: Count of reserve_crop where status = 'pending'
    $pendingQuery = $pdo->prepare("SELECT COUNT(*) as cnt FROM reserve_crop WHERE buyer_id = ? AND status = 'pending'");
    $pendingQuery->execute([$buyer_id]);
    $pendingCount = intval($pendingQuery->fetch()['cnt']);
    
    // Active: Count of reservation where reservation_status = 'confirmed'
    $activeQuery = $pdo->prepare("
        SELECT COUNT(*) as cnt 
        FROM reservation r 
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id 
        WHERE rc.buyer_id = ? AND r.reservation_status = 'confirmed'
    ");
    $activeQuery->execute([$buyer_id]);
    $activeCount = intval($activeQuery->fetch()['cnt']);
    
    // Completed: Count of reservation where reservation_status = 'completed'
    $completedQuery = $pdo->prepare("
        SELECT COUNT(*) as cnt 
        FROM reservation r 
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id 
        WHERE rc.buyer_id = ? AND r.reservation_status = 'completed'
    ");
    $completedQuery->execute([$buyer_id]);
    $completedCount = intval($completedQuery->fetch()['cnt']);

    // Complaints: Count of complaints where buyer_id = ? and status != 'resolved' / is in 'submitted', 'pending', 'open'
    $complaintsQuery = $pdo->prepare("
        SELECT COUNT(*) as cnt 
        FROM complaints 
        WHERE buyer_id = ? AND status IN ('submitted', 'pending', 'open')
    ");
    $complaintsQuery->execute([$buyer_id]);
    $complaintsCount = intval($complaintsQuery->fetch()['cnt']);
    
    // 3. Fetch recent activities
    $activities = [];
    
    // Recent reservations
    $resActivityQuery = $pdo->prepare("
        SELECT rc.quantity_requested, c.crop_name, rc.status, rc.reserved_date 
        FROM reserve_crop rc 
        JOIN crop c ON rc.crop_id = c.crop_id 
        WHERE rc.buyer_id = ? 
        ORDER BY rc.reserved_date DESC 
        LIMIT 5
    ");
    $resActivityQuery->execute([$buyer_id]);
    $resActivities = $resActivityQuery->fetchAll();
    foreach ($resActivities as $row) {
        $qty = floatval($row['quantity_requested']);
        $crop = $row['crop_name'];
        $date = strtotime($row['reserved_date']);
        if ($row['status'] === 'pending') {
            $msg = "Reserved {$qty}kg {$crop}";
        } elseif ($row['status'] === 'confirmed') {
            $msg = "Reservation for {$qty}kg {$crop} confirmed";
        } else {
            $msg = "Cancelled reservation for {$qty}kg {$crop}";
        }
        $activities[] = [
            "message" => $msg,
            "time" => $date
        ];
    }
    
    // Recent completed orders
    $compActivityQuery = $pdo->prepare("
        SELECT rc.quantity_requested, c.crop_name, r.completion_date 
        FROM reservation r 
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id 
        JOIN crop c ON rc.crop_id = c.crop_id 
        WHERE rc.buyer_id = ? AND r.reservation_status = 'completed' 
        ORDER BY r.completion_date DESC 
        LIMIT 5
    ");
    $compActivityQuery->execute([$buyer_id]);
    $compActivities = $compActivityQuery->fetchAll();
    foreach ($compActivities as $row) {
        $qty = floatval($row['quantity_requested']);
        $crop = $row['crop_name'];
        $date = strtotime($row['completion_date']);
        $activities[] = [
            "message" => "Order for {$qty}kg {$crop} delivered successfully",
            "time" => $date
        ];
    }
    
    // Recent listings in buyer's district
    $buyerDistrict = $userProfile['location'];
    $newListingsQuery = $pdo->prepare("
        SELECT crop_name, created_at 
        FROM crop 
        WHERE location = ? AND crop_status = 'active' 
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    $newListingsQuery->execute([$buyerDistrict]);
    $newListings = $newListingsQuery->fetchAll();
    foreach ($newListings as $row) {
        $crop = $row['crop_name'];
        $date = strtotime($row['created_at']);
        $activities[] = [
            "message" => "New {$crop} listing available",
            "time" => $date
        ];
    }
    
    // Sort activities by time DESC and take the top 5
    usort($activities, function($a, $b) {
        return $b['time'] - $a['time'];
    });
    
    $recentActivityList = [];
    foreach (array_slice($activities, 0, 5) as $act) {
        $recentActivityList[] = $act['message'];
    }
    
    // If no activities generated, insert default placeholders
    if (empty($recentActivityList)) {
        $recentActivityList = [
            "Browse crops to start reserving fresh products",
            "Explore nearby farmers in your district",
            "Keep track of crop growth stages dynamically"
        ];
    }

    echo json_encode([
        "success" => true,
        "buyerName" => $userProfile['name'],
        "location" => $userProfile['location'],
        "stats" => [
            "pending" => $pendingCount,
            "active" => $activeCount,
            "completed" => $completedCount,
            "complaints" => $complaintsCount
        ],
        "recentActivities" => $recentActivityList
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
