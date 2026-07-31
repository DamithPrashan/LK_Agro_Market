<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once 'auth_check.php';

// Ensure user is logged in
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$language = isset($data['language']) ? trim($data['language']) : '';

if (empty($language)) {
    echo json_encode(["success" => false, "message" => "Language is required."]);
    exit;
}

// Convert language code to match database values if needed (e.g. en, si -> sinhala, ta -> tamil)
$dbLanguage = $language;
if ($language === 'si') {
    $dbLanguage = 'sinhala';
} elseif ($language === 'ta') {
    $dbLanguage = 'tamil';
} elseif ($language === 'en') {
    $dbLanguage = 'english';
}

$userId = $_SESSION['user']['id'];

try {
    $stmt = $pdo->prepare("UPDATE user SET language = ? WHERE user_id = ?");
    $stmt->execute([$dbLanguage, $userId]);

    // Update session data
    $_SESSION['user']['language'] = $dbLanguage;

    echo json_encode([
        "success" => true,
        "message" => "Language preference updated successfully."
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
