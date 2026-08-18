<?php

require_once __DIR__ . '/../services/order_resolver.php';

class RatingModel {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Check if the reviewer has already rated this reservation.
     */
    public function hasRatedReservation($reservationId, $reviewerId) {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM ratings_review WHERE reservation_id = ? AND reviewer_id = ?");
        $stmt->execute([$reservationId, $reviewerId]);
        return intval($stmt->fetchColumn()) > 0;
    }

    /**
     * Insert a new review.
     */
    public function insertReview($reservationId, $cropId, $reviewerId, $revieweeId, $rating, $comment) {
        $sql = "INSERT INTO ratings_review (reservation_id, crop_id, reviewer_id, reviewee_id, rating, comment, review_date, is_removed) VALUES (?, ?, ?, ?, ?, ?, NOW(), 0)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$reservationId, $cropId, $reviewerId, $revieweeId, $rating, $comment]);
        return $this->pdo->lastInsertId();
    }

    /**
     * Fetch list of reviews for a reviewee user.
     */
    public function getReviewsByReviewee($revieweeId) {
        $sql = "SELECT rr.review_id AS id, rr.rating, rr.comment, DATE_FORMAT(rr.review_date, '%b %d, %Y') AS created_at,
                       u.name AS reviewer_name, r.reservation_source,
                       CASE WHEN r.reservation_source='cultivation' THEN ca.crop_name ELSE c.crop_name END AS crop_name
                FROM ratings_review rr
                JOIN user u ON rr.reviewer_id = u.user_id
                JOIN reservation r ON rr.reservation_id = r.reservation_id
                LEFT JOIN reserve_crop rc ON r.reservation_source='crop' AND r.reserve_crop_id=rc.reserve_crop_id
                LEFT JOIN crop c ON rc.crop_id=c.crop_id
                LEFT JOIN cultivation_request cr ON r.reservation_source='cultivation' AND r.cultivation_request_id=cr.cultivation_request_id
                LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id=ca.cultivation_ad_id
                WHERE rr.reviewee_id = ? AND rr.is_removed = 0
                ORDER BY rr.review_date DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$revieweeId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get details of a single review by id.
     */
    public function getReviewDetails($reviewId) {
        $stmt = $this->pdo->prepare("
            SELECT rr.review_id AS id, rr.rating, rr.comment, DATE_FORMAT(rr.review_date, '%b %d, %Y') AS created_at,
                   u.name AS reviewer_name, r.reservation_source,
                   CASE WHEN r.reservation_source='cultivation' THEN ca.crop_name ELSE c.crop_name END AS crop_name
            FROM ratings_review rr
            JOIN user u ON rr.reviewer_id = u.user_id
            JOIN reservation r ON rr.reservation_id = r.reservation_id
            LEFT JOIN reserve_crop rc ON r.reservation_source='crop' AND r.reserve_crop_id=rc.reserve_crop_id
            LEFT JOIN crop c ON rc.crop_id=c.crop_id
            LEFT JOIN cultivation_request cr ON r.reservation_source='cultivation' AND r.cultivation_request_id=cr.cultivation_request_id
            LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id=ca.cultivation_ad_id
            WHERE rr.review_id = ?
        ");
        $stmt->execute([$reviewId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get reservation, crop, buyer, and farmer details for a reservation.
     */
    public function getReservationDetails($reservationId, $forUpdate = false) {
        return resolve_order_snapshot($this->pdo, (int)$reservationId, (bool)$forUpdate);
    }

    /**
     * Store the calculated average rating for a user.
     */
    public function updateUserAverageRating($userId, $averageRating) {
        $stmt = $this->pdo->prepare("UPDATE user SET average_rating = ? WHERE user_id = ?");
        return $stmt->execute([$averageRating, $userId]);
    }

    public function beginTransaction() { return $this->pdo->beginTransaction(); }
    public function commit() { return $this->pdo->commit(); }
    public function rollBack() { return $this->pdo->inTransaction() ? $this->pdo->rollBack() : true; }
}
