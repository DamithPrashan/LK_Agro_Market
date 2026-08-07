<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';

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
    // Hardcoded for now
    // -----------------------------------
    $buyerSatisfaction = 98;


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