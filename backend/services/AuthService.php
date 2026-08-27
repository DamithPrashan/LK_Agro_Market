<?php

require_once __DIR__ . '/../config/mailer.php';
require_once __DIR__ . '/../config/farmer_email_templates.php';

class AuthService {
    /**
     * Sends registration confirmation email to farmer after successful account creation.
     * Non-blocking — mail failures will be logged but won't disrupt registration.
     */
    public static function sendFarmerRegistrationEmail(string $email, string $name): bool {
        if (function_exists('farmerRegistrationReceived') && function_exists('sendMail')) {
            $template = farmerRegistrationReceived($name);
            return sendMail($email, $name, $template['subject'], $template['body']);
        }
        return false;
    }

    /**
     * Sends approval email to farmer.
     */
    public static function sendFarmerApprovalEmail(string $email, string $name, string $feedback = '', array $criteria = []): bool {
        if (function_exists('farmerAccountApproved') && function_exists('sendMail')) {
            $template = farmerAccountApproved($name, $feedback, $criteria);
            return sendMail($email, $name, $template['subject'], $template['body']);
        }
        return false;
    }

    /**
     * Sends rejection email to farmer.
     */
    public static function sendFarmerRejectionEmail(string $email, string $name, string $feedback = ''): bool {
        if (function_exists('farmerAccountRejected') && function_exists('sendMail')) {
            $template = farmerAccountRejected($name, $feedback);
            return sendMail($email, $name, $template['subject'], $template['body']);
        }
        return false;
    }

    /**
     * Sends password reset email to any user (Farmer or Buyer).
     */
    public static function sendPasswordResetEmail(string $email, string $name, string $resetLink): bool {
        if (function_exists('passwordResetRequest') && function_exists('sendMail')) {
            $template = passwordResetRequest($name, $resetLink);
            return sendMail($email, $name, $template['subject'], $template['body']);
        }
        return false;
    }
}
