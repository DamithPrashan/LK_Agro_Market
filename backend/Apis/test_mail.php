<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../config/mailer.php';
require_once __DIR__ . '/../config/farmer_email_templates.php';

// Change this test email address to your own Gmail when testing locally
$testEmail = 'tharakarandeniya733@gmail.com';
$testName  = 'Test Farmer';

if (!function_exists('farmerRegistrationReceived') || !function_exists('sendMail')) {
    echo json_encode([
        "success" => false,
        "message" => "Mailer or template configuration functions missing."
    ]);
    exit;
}

$template = farmerRegistrationReceived($testName);

$success = sendMail(
    $testEmail,
    $testName,
    $template['subject'],
    $template['body']
);

if ($success) {
    echo json_encode([
        "success" => true,
        "message" => "Test email sent successfully to {$testEmail}. Check your inbox and backend/logs/mail_log.txt."
    ]);
} else {
    $logFile = __DIR__ . '/../logs/mail_log.txt';
    $lastError = 'Unknown error';
    if (file_exists($logFile)) {
        $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines) {
            $lastError = end($lines);
        }
    }

    echo json_encode([
        "success" => false,
        "message" => "Email failed to send. Check backend/logs/mail_log.txt.",
        "error" => $lastError
    ]);
}
