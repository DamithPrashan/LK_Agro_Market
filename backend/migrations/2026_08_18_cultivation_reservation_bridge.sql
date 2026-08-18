ALTER TABLE reservation
    MODIFY COLUMN reserve_crop_id INT NULL,
    ADD COLUMN reservation_source ENUM('crop','cultivation') NOT NULL DEFAULT 'crop' AFTER reservation_id,
    ADD COLUMN cultivation_request_id INT NULL AFTER reserve_crop_id,
    ADD CONSTRAINT uq_reservation_cultivation_request UNIQUE (cultivation_request_id),
    ADD CONSTRAINT fk_reservation_cultivation_request
        FOREIGN KEY (cultivation_request_id) REFERENCES cultivation_request(cultivation_request_id),
    ADD CONSTRAINT chk_reservation_source_reference CHECK (
        (reservation_source = 'crop' AND reserve_crop_id IS NOT NULL AND cultivation_request_id IS NULL)
        OR
        (reservation_source = 'cultivation' AND reserve_crop_id IS NULL AND cultivation_request_id IS NOT NULL)
    );
