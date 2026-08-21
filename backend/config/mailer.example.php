<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Autoload PHPMailer via Composer if available, otherwise fallback to manual PHPMailer/src files
$composerAutoload = __DIR__ . '/../vendor/autoload.php';
$manualException = __DIR__ . '/../PHPMailer/src/Exception.php';
$manualPHPMailer = __DIR__ . '/../PHPMailer/src/PHPMailer.php';
$manualSMTP = __DIR__ . '/../PHPMailer/src/SMTP.php';

if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
} elseif (file_exists($manualException) && file_exists($manualPHPMailer) && file_exists($manualSMTP)) {
    require_once $manualException;
    require_once $manualPHPMailer;
    require_once $manualSMTP;
}

/**
 * Sends an email using PHPMailer and Gmail SMTP.
 *
 * @param string $toEmail Recipient email address
 * @param string $toName Recipient name
 * @param string $subject Email subject line
 * @param string $htmlBody HTML content of the email
 * @return bool True if email sent successfully, false otherwise
 */
function sendMail(string $toEmail, string $toName, string $subject, string $htmlBody): bool {
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/mail_log.txt';

    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] FAILED  | {$toEmail} | PHPMailer class not found. Run 'composer install' or place PHPMailer/src/ files.\n";
        @file_put_contents($logFile, $logMessage, FILE_APPEND);
        return false;
    }

    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'your_gmail@gmail.com';
        $mail->Password   = 'your_app_password_here';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->CharSet    = 'UTF-8';

        // Recipients
        $mail->setFrom('your_gmail@gmail.com', 'LK Agro Market');
        $mail->addAddress($toEmail, $toName);
        $mail->addReplyTo('support@lkagromarket.lk', 'LK Agro Market Support');

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], "\n", $htmlBody));

        $mail->send();

        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] SUCCESS | {$toEmail}\n";
        @file_put_contents($logFile, $logMessage, FILE_APPEND);

        return true;
    } catch (Exception $e) {
        $timestamp = date('Y-m-d H:i:s');
        $errorInfo = $mail->ErrorInfo ?: $e->getMessage();
        $logMessage = "[{$timestamp}] FAILED  | {$toEmail} | {$errorInfo}\n";
        @file_put_contents($logFile, $logMessage, FILE_APPEND);

        return false;
    }
}
