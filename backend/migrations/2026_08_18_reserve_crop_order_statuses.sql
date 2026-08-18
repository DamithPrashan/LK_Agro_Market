-- Keep reserve_crop.status aligned with reservation.reservation_status through
-- the complete Phase 1 order lifecycle. Run only if status is currently an
-- ENUM that does not already include ready and completed.
ALTER TABLE reserve_crop
    MODIFY status ENUM('pending', 'confirmed', 'ready', 'completed', 'cancelled')
    NOT NULL DEFAULT 'pending';

-- Repair lifecycle drift created by earlier code that advanced only reservation.
UPDATE reserve_crop rc
JOIN reservation r ON r.reserve_crop_id = rc.reserve_crop_id
SET rc.status = r.reservation_status
WHERE rc.status <> r.reservation_status;
