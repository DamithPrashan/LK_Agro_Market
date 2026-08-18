ALTER TABLE ratings_review
    MODIFY COLUMN crop_id INT NULL,
    ADD CONSTRAINT uq_ratings_reservation_reviewer UNIQUE (reservation_id, reviewer_id),
    ADD CONSTRAINT chk_ratings_review_value CHECK (rating BETWEEN 1 AND 5);
