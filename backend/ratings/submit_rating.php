<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once '../Apis/auth_check.php';

// Ensure user is logged in
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$reservation_id = isset($data['order_id']) ? intval($data['order_id']) : 0;
$rating = isset($data['rating']) ? intval($data['rating']) : 0;
$comment = isset($data['comment']) ? trim($data['comment']) : '';

if ($reservation_id === 0 || $rating < 1 || $rating > 5) {
    echo json_encode(["success" => false, "message" => "Invalid rating details."]);
    exit;
}

$reviewer_user_id = $_SESSION['user']['id'];

try {
    // Join reservation -> reserve_crop -> crop to find crop_id, buyer's user_id, and farmer's user_id
    $sql = "
        SELECT 
            rc.crop_id, 
            u_buyer.user_id as buyer_user_id, 
            u_farmer.user_id as farmer_user_id
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop c ON rc.crop_id = c.crop_id
        JOIN buyer b ON rc.buyer_id = b.buyer_id
        JOIN user u_buyer ON b.user_id = u_buyer.user_id
        JOIN farmer f ON c.farmer_id = f.farmer_id
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        WHERE r.reservation_id = ?
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$reservation_id]);
    $order = $stmt->fetch();

    if (!$order) {
        echo json_encode(["success" => false, "message" => "Reservation/order not found."]);
        exit;
    }

    $crop_id = intval($order['crop_id']);
    $buyer_user_id = intval($order['buyer_user_id']);
    $farmer_user_id = intval($order['farmer_user_id']);

    if ($reviewer_user_id === $buyer_user_id) {
        $reviewee_user_id = $farmer_user_id;
    } else if ($reviewer_user_id === $farmer_user_id) {
        $reviewee_user_id = $buyer_user_id;
    } else {
        echo json_encode(["success" => false, "message" => "You are not authorized to rate this transaction."]);
        exit;
    }

    // Insert into ratings_review table
    $insertSql = "INSERT INTO ratings_review (crop_id, reviewer_id, reviewee_id, rating, comment, is_removed) VALUES (?, ?, ?, ?, ?, 0)";
    $insertStmt = $pdo->prepare($insertSql);
    $insertStmt->execute([$crop_id, $reviewer_user_id, $reviewee_user_id, $rating, $comment]);
    $review_id = $pdo->lastInsertId();

    // Get the newly created review details
    $newReviewStmt = $pdo->prepare("
        SELECT r.review_id as id, r.rating, r.comment, DATE_FORMAT(r.review_date, '%b %d, %Y') as created_at, u.name as reviewer_name 
        FROM ratings_review r 
        JOIN user u ON r.reviewer_id = u.user_id 
        WHERE r.review_id = ?
    ");
    $newReviewStmt->execute([$review_id]);
    $new_review = $newReviewStmt->fetch(PDO::FETCH_ASSOC);

    // Calculate updated stats for the reviewee user
    $statsStmt = $pdo->prepare("SELECT rating FROM ratings_review WHERE reviewee_id = ? AND is_removed = 0");
    $statsStmt->execute([$reviewee_user_id]);
    $allRatings = $statsStmt->fetchAll(PDO::FETCH_COLUMN);

    $total = count($allRatings);
    $sum = array_sum($allRatings);
    $breakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
    foreach ($allRatings as $rVal) {
        $rVal = intval($rVal);
        if (isset($breakdown[$rVal])) {
            $breakdown[$rVal]++;
        }
    }
    $average = ($total > 0) ? round($sum / $total, 1) : 0.0;

    echo json_encode([
        "success" => true,
        "message" => "Rating submitted successfully.",
        "new_review" => $new_review,
        "new_summary" => [
            "average" => $average,
            "total" => $total,
            "breakdown" => $breakdown
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
