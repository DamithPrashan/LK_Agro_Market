<?php

require_once __DIR__ . '/../services/RatingService.php';

class RatingController {
    private $ratingService;

    public function __construct($pdo) {
        $this->ratingService = new RatingService($pdo);
    }

    /**
     * Submit a rating/review for a reservation.
     */
    public function submitRating($data, $reviewerId) {
        $reservationId = isset($data['order_id']) ? intval($data['order_id']) : 0;
        $rating = isset($data['rating']) ? intval($data['rating']) : 0;
        $comment = isset($data['comment']) ? trim($data['comment']) : '';

        if ($reservationId <= 0) {
            return ["success" => false, "message" => "Invalid reservation or order ID."];
        }

        return $this->ratingService->submitRating($reservationId, $rating, $comment, $reviewerId);
    }

    /**
     * Get user ratings, breakdown, and full reviews.
     */
    public function getRatings($userId) {
        if ($userId <= 0) {
            return ["success" => false, "message" => "Invalid user ID."];
        }

        return $this->ratingService->getRatingsForUser($userId);
    }
}
