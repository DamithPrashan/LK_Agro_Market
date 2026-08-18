ALTER TABLE cultivation_request
    ADD COLUMN pending_request_key VARCHAR(64)
        GENERATED ALWAYS AS (
            CASE
                WHEN request_status = 'pending' THEN CONCAT(buyer_id, ':', cultivation_ad_id)
                ELSE NULL
            END
        ) STORED,
    ADD UNIQUE KEY uq_cultivation_request_pending (pending_request_key);
