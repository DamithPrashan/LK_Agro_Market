ALTER TABLE cultivation_ad
    ADD COLUMN timing_model ENUM('fixed_date', 'growing_period') NOT NULL DEFAULT 'fixed_date' AFTER estimated_unit_price,
    ADD COLUMN growing_period_days SMALLINT UNSIGNED NULL AFTER expected_harvest_date,
    ADD COLUMN cultivation_started_at DATETIME NULL AFTER growing_period_days,
    MODIFY COLUMN expected_harvest_date DATE NULL,
    ADD CONSTRAINT chk_cultivation_ad_growing_period_positive
        CHECK (growing_period_days IS NULL OR growing_period_days > 0),
    ADD CONSTRAINT chk_cultivation_ad_timing_model
        CHECK (
            (timing_model = 'fixed_date' AND expected_harvest_date IS NOT NULL)
            OR
            (timing_model = 'growing_period' AND growing_period_days IS NOT NULL AND growing_period_days > 0)
        );

ALTER TABLE cultivation_request
    ADD COLUMN agreed_growing_period_days SMALLINT UNSIGNED NULL AFTER agreed_total_amount,
    MODIFY COLUMN requested_collection_date DATE NULL,
    ADD CONSTRAINT chk_cultivation_request_agreed_growing_period_positive
        CHECK (agreed_growing_period_days IS NULL OR agreed_growing_period_days > 0);

ALTER TABLE reservation
    MODIFY COLUMN collection_date DATE NULL;
