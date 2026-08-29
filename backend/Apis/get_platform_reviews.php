<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once __DIR__ . '/../connection/db.php';

try {
    // Fetch platform reviews with buyer details.
    $sql = "
        SELECT 
            pr.id,
            pr.rating,
            pr.comment,
            DATE_FORMAT(pr.created_at, '%b %d, %Y') as date,
            COALESCE(u.name, 'Verified Buyer') as name,
            COALESCE(u.location, 'Sri Lanka') as location,
            u.profile_image
        FROM platform_reviews pr
        JOIN buyer b ON pr.buyer_id = b.buyer_id
        JOIN user u ON b.user_id = u.user_id
        ORDER BY pr.created_at DESC, pr.id DESC
        LIMIT 6
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "reviews" => $reviews
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
