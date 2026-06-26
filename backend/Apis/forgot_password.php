<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$email = isset($data['email']) ? trim($data['email']) : '';

if (empty($email)) {
    echo json_encode(["success" => false, "message" => "Please enter your email address."]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id FROM user WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        // In a production environment, you would generate a token and send a real email reset link.
        // For this local prototype/demo, we return success.
        echo json_encode([
            "success" => true,
            "message" => "Reset instructions sent."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "We couldn't find an account associated with that email."
        ]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
