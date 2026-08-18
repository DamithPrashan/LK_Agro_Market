CREATE TABLE cultivation_request (
    cultivation_request_id INT AUTO_INCREMENT PRIMARY KEY,
    cultivation_ad_id INT NOT NULL,
    buyer_id INT NOT NULL,
    requested_quantity DECIMAL(10,2) NOT NULL,
    requested_collection_date DATE NOT NULL,
    agreed_quantity DECIMAL(10,2) NULL,
    agreed_unit_price DECIMAL(10,2) NULL,
    agreed_total_amount DECIMAL(12,2) NULL,
    farmer_note TEXT NULL,
    request_status ENUM('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_cultivation_request_ad FOREIGN KEY (cultivation_ad_id)
        REFERENCES cultivation_ad(cultivation_ad_id),
    CONSTRAINT fk_cultivation_request_buyer FOREIGN KEY (buyer_id)
        REFERENCES buyer(buyer_id),
    CONSTRAINT chk_cultivation_request_quantity CHECK (requested_quantity > 0),
    CONSTRAINT chk_cultivation_request_agreed_quantity CHECK (agreed_quantity IS NULL OR agreed_quantity > 0),
    CONSTRAINT chk_cultivation_request_agreed_total CHECK (agreed_total_amount IS NULL OR agreed_total_amount >= 0),
    INDEX idx_cultivation_request_ad (cultivation_ad_id),
    INDEX idx_cultivation_request_buyer (buyer_id),
    INDEX idx_cultivation_request_status (request_status),
    INDEX idx_cultivation_request_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) NULL DEFAULT NULL AFTER message;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data TEXT NULL DEFAULT NULL AFTER type;
