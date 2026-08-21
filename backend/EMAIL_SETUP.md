# Email Setup Guide — LK Agro Market

Targeted email notification system configuration guide for development team members.

---

## Section 1 — Who needs to set this up

Only one team member needs a Gmail App Password.
Others can use the same credentials by copying the real `mailer.php` from that team member (share via WhatsApp — never via GitHub).

---

## Section 2 — Setup Steps

1. **Copy Example Configuration:**
   Copy `backend/config/mailer.example.php` and rename the copy to:
   `backend/config/mailer.php`

2. **Fill Credentials:**
   Open `backend/config/mailer.php` and fill in your Gmail address and Google App Password:
   ```php
   $mail->Username = 'your_gmail@gmail.com';
   $mail->Password = 'your_app_password_here';
   ```

3. **If you have Composer:**
   Open terminal in the `backend/` directory and run:
   ```bash
   composer install
   ```

4. **If you do NOT have Composer:**
   Download PHPMailer directly from GitHub:
   [https://github.com/PHPMailer/PHPMailer](https://github.com/PHPMailer/PHPMailer)
   Extract and copy the `src/` directory to:
   `backend/PHPMailer/src/`

5. **Test Email Endpoint:**
   Start Apache in XAMPP and visit the test URL in your browser:
   `http://localhost/LK_Agro_Market/backend/Apis/test_mail.php`

6. **Check Result:**
   - **Success:** Response displays `{"success": true, "message": "Test email sent..."}`
   - **Failed:** Open `backend/logs/mail_log.txt` to inspect error trace.

---

## Section 3 — Common Errors & Solutions

### "Authentication failed"
- App Password is wrong — double check for typos.
- Ensure **2-Step Verification** is turned **ON** in your Google Account security settings.

### "Connection refused / timeout"
- XAMPP Apache service must be running.
- Verify your internet connectivity and firewall permissions for port 587.

### "Class PHPMailer not found"
- Either run `composer install` inside the `backend/` folder.
- Or manually copy the PHPMailer `src/` folder to `backend/PHPMailer/src/`.

### "Spaces in App Password"
- Google App Passwords often contain spaces (e.g. `abcd efgh ijkl mnop`).
- This is normal — keep the spaces as-is inside single quotes.

---

## Section 4 — Important Rules

- **NEVER** commit `backend/config/mailer.php` to GitHub.
- **NEVER** share the App Password in public or group repository messages.
- Share `mailer.php` privately only (e.g., direct WhatsApp file transfer).
- `.gitignore` is pre-configured to block `mailer.php` and log files automatically.
