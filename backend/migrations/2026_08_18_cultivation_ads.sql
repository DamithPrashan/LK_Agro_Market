CREATE TABLE cultivation_ad (
    cultivation_ad_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    capacity_quantity DECIMAL(10,2) NOT NULL,
    committed_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    estimated_unit_price DECIMAL(10,2) NOT NULL,
    expected_harvest_date DATE NOT NULL,
    cultivation_area DECIMAL(10,2) NULL,
    area_unit VARCHAR(20) NULL,
    description TEXT NULL,
    status ENUM('draft','open','capacity_reached','cultivating','harvested','cancelled','closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cultivation_ad_farmer FOREIGN KEY (farmer_id) REFERENCES farmer(farmer_id),
    CONSTRAINT chk_cultivation_ad_capacity CHECK (capacity_quantity > 0),
    CONSTRAINT chk_cultivation_ad_commitment CHECK (committed_quantity >= 0 AND committed_quantity <= capacity_quantity),
    INDEX idx_cultivation_ad_farmer (farmer_id),
    INDEX idx_cultivation_ad_status (status),
    INDEX idx_cultivation_ad_district (district),
    INDEX idx_cultivation_ad_crop_name (crop_name),
    INDEX idx_cultivation_ad_harvest_date (expected_harvest_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cultivation_ad_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cultivation_ad_id INT NOT NULL,
    photo_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cultivation_ad_photo_ad FOREIGN KEY (cultivation_ad_id)
        REFERENCES cultivation_ad(cultivation_ad_id) ON DELETE CASCADE,
    INDEX idx_cultivation_ad_photos_ad (cultivation_ad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
