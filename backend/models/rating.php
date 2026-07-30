<?php

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
        $sql = "SELECT r.review_id as id, r.rating, r.comment, DATE_FORMAT(r.review_date, '%b %d, %Y') as created_at, u.name as reviewer_name 
                FROM ratings_review r
                JOIN user u ON r.reviewer_id = u.user_id
                WHERE r.reviewee_id = ? AND r.is_removed = 0
                ORDER BY r.review_date DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$revieweeId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get details of a single review by id.
     */
    public function getReviewDetails($reviewId) {
        $stmt = $this->pdo->prepare("
            SELECT r.review_id as id, r.rating, r.comment, DATE_FORMAT(r.review_date, '%b %d, %Y') as created_at, u.name as reviewer_name 
            FROM ratings_review r 
            JOIN user u ON r.reviewer_id = u.user_id 
            WHERE r.review_id = ?
        ");
        $stmt->execute([$reviewId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get reservation, crop, buyer, and farmer details for a reservation.
     */
    public function getReservationDetails($reservationId) {
        $sql = "
            SELECT 
                rc.crop_id, 
                u_buyer.user_id as buyer_user_id, 
                u_farmer.user_id as farmer_user_id,
                r.transaction_status,
                r.reservation_status
            FROM reservation r
            JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
            JOIN crop c ON rc.crop_id = c.crop_id
            JOIN buyer b ON rc.buyer_id = b.buyer_id
            JOIN user u_buyer ON b.user_id = u_buyer.user_id
            JOIN farmer f ON c.farmer_id = f.farmer_id
            JOIN user u_farmer ON f.user_id = u_farmer.user_id
            WHERE r.reservation_id = ?
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$reservationId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Store the calculated average rating for a user.
     */
    public function updateUserAverageRating($userId, $averageRating) {
        $stmt = $this->pdo->prepare("UPDATE user SET average_rating = ? WHERE user_id = ?");
        return $stmt->execute([$averageRating, $userId]);
    }
}
