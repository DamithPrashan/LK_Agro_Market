<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once '../Apis/auth_check.php';

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id === 0) {
    echo json_encode(["success" => false, "message" => "Invalid user ID."]);
    exit;
}

try {
    // Get all reviews for user
    $sql = "SELECT r.review_id as id, r.rating, r.comment, DATE_FORMAT(r.review_date, '%b %d, %Y') as created_at, u.name as reviewer_name 
            FROM ratings_review r
            JOIN user u ON r.reviewer_id = u.user_id
            WHERE r.reviewee_id = ? AND r.is_removed = 0
            ORDER BY r.review_date DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate rating stats
    $total = count($reviews);
    $sum = 0;
    $breakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];

    foreach ($reviews as $rev) {
        $r = intval($rev['rating']);
        $sum += $r;
        if (isset($breakdown[$r])) {
            $breakdown[$r]++;
        }
    }

    $average = ($total > 0) ? round($sum / $total, 1) : 0.0;

    echo json_encode([
        "success" => true,
        "summary" => [
            "average" => $average,
            "total" => $total,
            "breakdown" => $breakdown
        ],
        "reviews" => $reviews
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
