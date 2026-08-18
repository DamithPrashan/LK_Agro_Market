ALTER TABLE complaints
    ADD COLUMN IF NOT EXISTS farmer_24h_reminder_sent_at TIMESTAMP NULL AFTER farmer_response_deadline,
    ADD COLUMN IF NOT EXISTS farmer_overdue_reminder_sent_at TIMESTAMP NULL AFTER farmer_24h_reminder_sent_at;
