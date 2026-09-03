CREATE TABLE IF NOT EXISTS complaint_evidence (
    evidence_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    uploader_role ENUM('buyer','farmer') NOT NULL,
    evidence_type ENUM('crop_full_view','crop_issue_closeup','crop_quantity_packaging','supporting_document') NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    file_hash CHAR(64) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_complaint_evidence_slot (complaint_id, uploader_role, evidence_type),
    CONSTRAINT fk_complaint_evidence_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
