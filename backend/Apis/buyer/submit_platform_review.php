<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once __DIR__ . '/../../connection/db.php';
require_once __DIR__ . '/../auth_check.php';

require_login();
require_role('buyer');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$user_id = intval($_SESSION['user']['id']);
$data = json_decode(file_get_contents("php://input"), true);

$order_id = isset($data['order_id']) ? intval($data['order_id']) : null;
$rating = isset($data['rating']) ? intval($data['rating']) : 0;
$comment = isset($data['comment']) ? trim($data['comment']) : '';

if ($rating < 1 || $rating > 5) {
    echo json_encode(["success" => false, "message" => "Please select a valid rating (1 to 5)."]);
    exit;
}

if (empty($comment)) {
    echo json_encode(["success" => false, "message" => "Please write a comment before submitting."]);
    exit;
}

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

    // 2. Insert into platform_reviews
    $insertSql = "INSERT INTO platform_reviews (buyer_id, order_id, rating, comment) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($insertSql);
    $stmt->execute([$user_id, $order_id, $rating, $comment]);

    echo json_encode([
        "success" => true,
        "message" => "Thank you! Your feedback has been submitted successfully."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
