<?php

require_once __DIR__ . '/../models/rating.php';

class RatingService {
    private $ratingModel;

    public function __construct($pdo) {
        $this->ratingModel = new RatingModel($pdo);
    }

    /**
     * Handles the business logic for submitting a new rating.
     */
    public function submitRating($reservationId, $rating, $comment, $reviewerId) {
        // Validate rating value
        if ($rating < 1 || $rating > 5) {
            return ["success" => false, "message" => "Rating must be between 1 and 5 stars."];
        }

        // Fetch reservation details
        $order = $this->ratingModel->getReservationDetails($reservationId);
        if (!$order) {
            return ["success" => false, "message" => "Reservation/order not found."];
        }

        $cropId = intval($order['crop_id']);
        $buyerUserId = intval($order['buyer_user_id']);
        $farmerUserId = intval($order['farmer_user_id']);
        $transactionStatus = $order['transaction_status'];
        $reservationStatus = $order['reservation_status'];

        // Verify the reviewer is authorized
        if ($reviewerId === $buyerUserId) {
            $revieweeId = $farmerUserId;
        } else if ($reviewerId === $farmerUserId) {
            $revieweeId = $buyerUserId;
        } else {
            return ["success" => false, "message" => "You are not authorized to rate this transaction."];
        }

        // Verify reservation status is not cancelled
        if ($reservationStatus === 'cancelled') {
            return ["success" => false, "message" => "You cannot rate a cancelled transaction."];
        }

        // Verify advance payment exists (partially_paid or paid)
        if (!in_array($transactionStatus, ['partially_paid', 'paid'])) {
            return ["success" => false, "message" => "Rating is locked until the advance payment is confirmed."];
        }

        // Verify duplicate rating does not exist
        if ($this->ratingModel->hasRatedReservation($reservationId, $reviewerId)) {
            return ["success" => false, "message" => "You have already submitted a rating for this reservation."];
        }

        // Insert review
        $reviewId = $this->ratingModel->insertReview(
            $reservationId,
            $cropId,
            $reviewerId,
            $revieweeId,
            $rating,
            $comment
        );

        if (!$reviewId) {
            return ["success" => false, "message" => "Failed to submit rating."];
        }

        // Fetch the newly created review details
        $newReview = $this->ratingModel->getReviewDetails($reviewId);

        // Recalculate stats for the reviewee user
        $allReviews = $this->ratingModel->getReviewsByReviewee($revieweeId);
        $total = count($allReviews);
        $sum = 0;
        $breakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];

        foreach ($allReviews as $rev) {
            $rVal = intval($rev['rating']);
            $sum += $rVal;
            if (isset($breakdown[$rVal])) {
                $breakdown[$rVal]++;
            }
        }

        $average = ($total > 0) ? round($sum / $total, 1) : 0.0;

        // Store the average rating in user table
        $this->ratingModel->updateUserAverageRating($revieweeId, $average);

        return [
            "success" => true,
            "message" => "Rating submitted successfully.",
            "new_review" => $newReview,
            "new_summary" => [
                "average" => $average,
                "total" => $total,
                "breakdown" => $breakdown
            ]
        ];
    }

    /**
     * Handles retrieving rating summary and reviews list.
     */
    public function getRatingsForUser($userId) {
        $reviews = $this->ratingModel->getReviewsByReviewee($userId);

        $total = count($reviews);
        $sum = 0;
        $breakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];

        foreach ($reviews as $rev) {
            $rVal = intval($rev['rating']);
            $sum += $rVal;
            if (isset($breakdown[$rVal])) {
                $breakdown[$rVal]++;
            }
        }

        $average = ($total > 0) ? round($sum / $total, 1) : 0.0;

        return [
            "success" => true,
            "summary" => [
                "average" => $average,
                "total" => $total,
                "breakdown" => $breakdown
            ],
            "reviews" => $reviews
        ];
    }
}
