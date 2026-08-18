-- Prevent duplicate logical advance/final payments for a reservation.
-- Preflight before applying:
-- SELECT reservation_id, payment_type, COUNT(*)
-- FROM payment
-- GROUP BY reservation_id, payment_type
-- HAVING COUNT(*) > 1;

ALTER TABLE payment
    ADD UNIQUE KEY uq_payment_reservation_type (reservation_id, payment_type);
