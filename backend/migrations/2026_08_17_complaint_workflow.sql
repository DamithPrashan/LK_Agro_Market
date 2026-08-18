ALTER TABLE complaints
    ADD COLUMN IF NOT EXISTS farmer_evidence_file VARCHAR(255) NULL AFTER farmer_response,
    ADD COLUMN IF NOT EXISTS farmer_response_requested_at TIMESTAMP NULL AFTER resolution_action,
    ADD COLUMN IF NOT EXISTS farmer_response_deadline TIMESTAMP NULL AFTER farmer_response_requested_at;

UPDATE complaints
SET status = CASE
    WHEN status IN ('rejected', 'dismiss') THEN 'dismissed'
    WHEN status IN ('pending', 'open', 'under_review', 'admin_notified') THEN 'submitted'
    WHEN status = 'farmer_responded' THEN 'resolved'
    ELSE status
END
WHERE status NOT IN ('submitted', 'awaiting_farmer_response', 'resolved', 'dismissed');
