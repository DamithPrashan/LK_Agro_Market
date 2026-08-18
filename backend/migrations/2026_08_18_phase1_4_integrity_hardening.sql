ALTER TABLE cultivation_ad
    ADD CONSTRAINT chk_cultivation_ad_unit CHECK (unit = 'kg');

ALTER TABLE cultivation_request
    ADD CONSTRAINT chk_cultivation_request_agreed_price
        CHECK (agreed_unit_price IS NULL OR agreed_unit_price > 0),
    ADD CONSTRAINT chk_cultivation_request_accepted_snapshot
        CHECK (
            request_status <> 'accepted'
            OR (
                agreed_quantity IS NOT NULL AND agreed_quantity > 0
                AND agreed_unit_price IS NOT NULL AND agreed_unit_price > 0
                AND agreed_total_amount IS NOT NULL AND agreed_total_amount >= 0
            )
        );
