<?php

/**
 * Farmer Email Templates — LK Agro Market
 * Inline CSS, mobile-responsive (max-width: 560px).
 */

if (!function_exists('farmerRegistrationReceived')) {
    /**
     * Template 1: Farmer Registration Received (Pending Admin Approval)
     */
    function farmerRegistrationReceived(string $farmerName): array {
        $safeName = htmlspecialchars($farmerName, ENT_QUOTES, 'UTF-8');
        
        $subject = "Registration Received — LK Agro Market";

        $body = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Arial, sans-serif; color: #333333;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #1a5c2a; padding: 25px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">🌱 LK Agro Market</h1>
                            <p style="color: #a3e635; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; font-weight: 600;">Farmer Registration Notice</p>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="font-size: 16px; margin-top: 0;">Dear <strong>{$safeName}</strong>,</p>
                            <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
                                Thank you for registering as a farmer on <strong>LK Agro Market</strong>. Your registration has been received successfully.
                            </p>
                            
                            <!-- Info Box -->
                            <div style="background-color: #fff8e1; border-left: 4px solid #d4860a; padding: 16px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #854d0e; font-size: 14px; font-weight: 600; line-height: 1.5;">
                                    ⏳ Your account is currently pending admin approval. You will not be able to log in until your account is approved.
                                </p>
                            </div>
                            
                            <h3 style="color: #1a5c2a; font-size: 16px; margin-top: 25px; margin-bottom: 12px;">What happens next:</h3>
                            <ul style="padding-left: 20px; margin: 0 0 20px 0; color: #4b5563; font-size: 14px; line-height: 1.8;">
                                <li>Admin will review your NIC and farm details</li>
                                <li>Admin will verify your submitted evidence</li>
                                <li>You will receive an email once approved</li>
                                <li>Estimated review time: <strong>1–2 business days</strong></li>
                            </ul>
                            
                            <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 25px;">
                                If you have any questions, contact us at: <a href="mailto:support@lkagromarket.lk" style="color: #4caf50; font-weight: 600; text-decoration: none;">support@lkagromarket.lk</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1a5c2a; padding: 20px; text-align: center; color: #ffffff; font-size: 12px; line-height: 1.6;">
                            <p style="margin: 0; font-weight: 600;">LK Agro Market — Uva Wellassa University Group CST 22 | CST292-2</p>
                            <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">Do not reply to this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return ['subject' => $subject, 'body' => $body];
    }
}

if (!function_exists('farmerAccountApproved')) {
    /**
     * Template 2: Farmer Account Approved
     */
    function farmerAccountApproved(string $farmerName): array {
        $safeName = htmlspecialchars($farmerName, ENT_QUOTES, 'UTF-8');
        
        $subject = "Account Approved — You Can Now Log In";

        $body = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Arial, sans-serif; color: #333333;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #1a5c2a; padding: 25px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">✓ LK Agro Market</h1>
                            <p style="color: #a3e635; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; font-weight: 600;">Account Approved</p>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="font-size: 16px; margin-top: 0;">Dear <strong>{$safeName}</strong>,</p>
                            
                            <!-- Success Box -->
                            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 16px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #1b5e20; font-size: 15px; font-weight: 600; line-height: 1.5;">
                                    🎉 Your farmer account has been approved by LK Agro Market admin.
                                </p>
                            </div>
                            
                            <h3 style="color: #1a5c2a; font-size: 16px; margin-top: 25px; margin-bottom: 12px;">You can now:</h3>
                            <ul style="padding-left: 20px; margin: 0 0 25px 0; color: #4b5563; font-size: 14px; line-height: 1.8;">
                                <li>Log in to the platform</li>
                                <li>Create and publish crop listings</li>
                                <li>Receive pre-orders from buyers</li>
                                <li>Track your sales and demand forecasts</li>
                            </ul>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="http://localhost:5173/login" style="background-color: #4caf50; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 6px; display: inline-block; box-shadow: 0 3px 6px rgba(76,175,80,0.3);">
                                    Log In Now
                                </a>
                            </div>
                            
                            <p style="font-size: 14px; color: #374151; line-height: 1.6; background-color: #f9fafb; padding: 12px 16px; border-radius: 6px;">
                                🛡️ <strong>Verified Status:</strong> Your verified farmer badge has been awarded. Buyers will see the <strong>✓ Verified</strong> badge on your profile and listings.
                            </p>
                            
                            <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-top: 20px;">
                                Welcome to LK Agro Market — we look forward to connecting you with buyers across Sri Lanka.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1a5c2a; padding: 20px; text-align: center; color: #ffffff; font-size: 12px; line-height: 1.6;">
                            <p style="margin: 0; font-weight: 600;">LK Agro Market — Uva Wellassa University Group CST 22 | CST292-2</p>
                            <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">Do not reply to this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return ['subject' => $subject, 'body' => $body];
    }
}

if (!function_exists('farmerAccountRejected')) {
    /**
     * Template 3: Farmer Account Rejected
     */
    function farmerAccountRejected(string $farmerName, string $feedback = ''): array {
        $safeName = htmlspecialchars($farmerName, ENT_QUOTES, 'UTF-8');
        $safeFeedback = !empty($feedback) ? htmlspecialchars($feedback, ENT_QUOTES, 'UTF-8') : 'Required verification criteria were not fulfilled.';
        
        $subject = "Account Verification Status Update — LK Agro Market";

        $body = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Arial, sans-serif; color: #333333;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #1a5c2a; padding: 25px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">🌱 LK Agro Market</h1>
                            <p style="color: #fca5a5; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; font-weight: 600;">Verification Status Update</p>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="font-size: 16px; margin-top: 0;">Dear <strong>{$safeName}</strong>,</p>
                            
                            <!-- Rejection Box -->
                            <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 16px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #c62828; font-size: 15px; font-weight: 600; line-height: 1.5;">
                                    Your farmer verification request could not be approved at this time.
                                </p>
                            </div>
                            
                            <h3 style="color: #b91c1c; font-size: 15px; margin-top: 20px; margin-bottom: 8px;">Admin Feedback / Reason:</h3>
                            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 14px; border-radius: 6px; font-size: 14px; color: #374151; line-height: 1.6;">
                                {$safeFeedback}
                            </div>
                            
                            <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-top: 25px;">
                                If you believe this is an error or if you wish to re-submit updated documents, please contact our support team at:
                                <a href="mailto:support@lkagromarket.lk" style="color: #4caf50; font-weight: 600; text-decoration: none;">support@lkagromarket.lk</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1a5c2a; padding: 20px; text-align: center; color: #ffffff; font-size: 12px; line-height: 1.6;">
                            <p style="margin: 0; font-weight: 600;">LK Agro Market — Uva Wellassa University Group CST 22 | CST292-2</p>
                            <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">Do not reply to this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return ['subject' => $subject, 'body' => $body];
    }
}

if (!function_exists('passwordResetRequest')) {
    /**
     * Template 4: Password Reset Request (For all Users: Farmers & Buyers)
     */
    function passwordResetRequest(string $userName, string $resetLink): array {
        $safeName = htmlspecialchars($userName, ENT_QUOTES, 'UTF-8');
        $safeLink = htmlspecialchars($resetLink, ENT_QUOTES, 'UTF-8');
        
        $subject = "Reset Your Password — LK Agro Market";

        $body = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Arial, sans-serif; color: #333333;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #1a5c2a; padding: 25px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">🔑 LK Agro Market</h1>
                            <p style="color: #a3e635; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; font-weight: 600;">Password Reset Request</p>
                        </td>
                    </tr>
                    
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="font-size: 16px; margin-top: 0;">Dear <strong>{$safeName}</strong>,</p>
                            <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
                                We received a request to reset the password for your LK Agro Market account.
                            </p>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{$safeLink}" style="background-color: #4caf50; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 6px; display: inline-block; box-shadow: 0 3px 6px rgba(76,175,80,0.3);">
                                    Reset Password
                                </a>
                            </div>
                            
                            <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
                                Or copy and paste this link into your browser:<br>
                                <a href="{$safeLink}" style="color: #4caf50; word-break: break-all;">{$safeLink}</a>
                            </p>
                            
                            <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin-top: 25px;">
                                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1a5c2a; padding: 20px; text-align: center; color: #ffffff; font-size: 12px; line-height: 1.6;">
                            <p style="margin: 0; font-weight: 600;">LK Agro Market — Uva Wellassa University Group CST 22 | CST292-2</p>
                            <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">Do not reply to this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        return ['subject' => $subject, 'body' => $body];
    }
}
