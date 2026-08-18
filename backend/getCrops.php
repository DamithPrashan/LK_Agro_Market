<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in
require_login();

$user_id = $_SESSION['user']['id'];
$role = $_SESSION['user']['role'];

try {
    if ($role === 'farmer') {
        // Fetch only crops belonging to the logged in farmer
        $sql = "SELECT c.* FROM crop c JOIN farmer f ON c.farmer_id = f.farmer_id WHERE f.user_id = ? AND c.crop_status <> 'removed'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $crops = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Non-farmers see all crops or empty list
        $sql = "SELECT * FROM crop";
        $stmt = $pdo->query($sql);
        $crops = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode($crops);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
