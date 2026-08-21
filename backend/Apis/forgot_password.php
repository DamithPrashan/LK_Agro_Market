<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once '../config/mailer.php';
require_once '../config/farmer_email_templates.php';

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
    $stmt = $pdo->prepare("SELECT user_id, name FROM user WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $userName = $user['name'] ?? 'Valued User';
        $resetToken = bin2hex(random_bytes(16));
        $resetLink = "http://localhost:5173/reset-password?email=" . urlencode($email) . "&token=" . $resetToken;

        // Send email notification for password reset
        $mailSent = false;
        if (function_exists('passwordResetRequest') && function_exists('sendMail')) {
            $template = passwordResetRequest($userName, $resetLink);
            $mailSent = sendMail($email, $userName, $template['subject'], $template['body']);
        }

        echo json_encode([
            "success" => true,
            "message" => "Password reset instructions have been sent to your email address.",
            "mail_sent" => $mailSent
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "We couldn't find an account associated with that email."
        ]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error processing password reset: " . $e->getMessage()]);
}
