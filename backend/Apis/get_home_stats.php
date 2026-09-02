<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../connection/db.php';

try {

    // -----------------------------------
    // 1. TOTAL REGISTERED FARMERS
    // -----------------------------------
    $farmerStmt = $pdo->prepare(
        "SELECT COUNT(*) AS total
         FROM user
         WHERE role = ?"
    );

    $farmerStmt->execute(['farmer']);

    $farmerResult = $farmerStmt->fetch();

    $totalFarmers = (int) $farmerResult['total'];


    // -----------------------------------
    // 2. ACTIVE CROP LISTINGS
    // -----------------------------------
    $cropStmt = $pdo->prepare(
        "SELECT COUNT(*) AS total
         FROM crop
         WHERE crop_status = ?"
    );

    $cropStmt->execute(['active']);

    $cropResult = $cropStmt->fetch();

    $activeListings = (int) $cropResult['total'];


    // -----------------------------------
    // 3. DISTRICTS COVERED
    // -----------------------------------
    $districtStmt = $pdo->query(
        "SELECT COUNT(DISTINCT district) AS total
         FROM crop
         WHERE district IS NOT NULL
         AND district <> ''"
    );

    $districtResult = $districtStmt->fetch();

    $districtsCovered = (int) $districtResult['total'];


    // -----------------------------------
    // 4. BUYER SATISFACTION
    // Calculated dynamically from platform_reviews ("What our users say")
    // -----------------------------------
    $satisfactionStmt = $pdo->query(
        "SELECT COUNT(*) AS total_reviews, AVG(rating) AS avg_rating FROM platform_reviews"
    );
    $satisfactionResult = $satisfactionStmt->fetch();
    $totalPlatformReviews = (int) ($satisfactionResult['total_reviews'] ?? 0);

    if ($totalPlatformReviews > 0) {
        $avgRating = (float) $satisfactionResult['avg_rating'];
        $buyerSatisfaction = (int) round(($avgRating / 5.0) * 100);
    } else {
        // Fallback to general ratings_review table if no platform reviews exist yet
        $generalRatingsStmt = $pdo->query(
            "SELECT COUNT(*) AS total_reviews, AVG(rating) AS avg_rating FROM ratings_review WHERE is_removed = 0"
        );
        $generalRatingsResult = $generalRatingsStmt->fetch();
        $totalGeneralReviews = (int) ($generalRatingsResult['total_reviews'] ?? 0);

        if ($totalGeneralReviews > 0) {
            $avgRating = (float) $generalRatingsResult['avg_rating'];
            $buyerSatisfaction = (int) round(($avgRating / 5.0) * 100);
        } else {
            $buyerSatisfaction = 0;
        }
    }


    // -----------------------------------
    // RESPONSE
    // -----------------------------------
    echo json_encode([
        "success" => true,

        "data" => [
            "verifiedFarmers" => $totalFarmers,
            "activeListings" => $activeListings,
            "districtsCovered" => $districtsCovered,
            "buyerSatisfaction" => $buyerSatisfaction
        ]
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to load homepage statistics."
    ]);
}
?>