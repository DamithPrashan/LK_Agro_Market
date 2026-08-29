<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once __DIR__ . '/../connection/db.php';

try {
    // 1. Ensure table exists
    $createTableSql = "
        CREATE TABLE IF NOT EXISTS `platform_reviews` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `buyer_id` INT NOT NULL,
          `order_id` INT NULL,
          `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
          `comment` TEXT NOT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $pdo->exec($createTableSql);

    // 2. Fetch platform reviews with buyer details
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
        LEFT JOIN user u ON pr.buyer_id = u.user_id
        ORDER BY pr.created_at DESC
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
