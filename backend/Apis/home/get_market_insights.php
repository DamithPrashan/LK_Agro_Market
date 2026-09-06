<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../../connection/db.php';

try {

    /* =========================================
       1. TOP AVAILABLE CROPS
       Sum quantities of the same crop
    ========================================= */

    $cropStmt = $pdo->query("
        SELECT
            crop_name,
            SUM(quantity) AS total_quantity
        FROM crop
        WHERE crop_status = 'active'
        GROUP BY crop_name
        ORDER BY total_quantity DESC
        LIMIT 5
    ");

    $topCrops = [];

    while ($row = $cropStmt->fetch()) {

        $topCrops[] = [
            "crop" => $row["crop_name"],
            "quantity" => (float) $row["total_quantity"]
        ];
    }


    /* =========================================
       2. TOP 4 DISTRICTS

       Number of active crop listings contributed
       by each district
    ========================================= */

    $districtStmt = $pdo->query("
        SELECT
            district,
            COUNT(*) AS listing_count
        FROM crop
        WHERE crop_status = 'active'
          AND district IS NOT NULL
          AND district <> ''
        GROUP BY district
        ORDER BY listing_count DESC
        LIMIT 4
    ");

    $districtRows = $districtStmt->fetchAll();

    $totalTopDistrictListings = 0;

    foreach ($districtRows as $row) {
        $totalTopDistrictListings += (int) $row["listing_count"];
    }

    $topDistricts = [];

    foreach ($districtRows as $row) {

        $listingCount = (int) $row["listing_count"];

        $percentage =
            $totalTopDistrictListings > 0
            ? round(
                ($listingCount / $totalTopDistrictListings) * 100,
                1
            )
            : 0;

        $topDistricts[] = [
            "district" => $row["district"],
            "listings" => $listingCount,
            "percentage" => $percentage
        ];
    }


    /* =========================================
       3. SUCCESSFUL ORDERS - LAST 30 DAYS

       Successful order =
       final payment + completed payment
    ========================================= */

    $orderStmt = $pdo->query("
        SELECT

            SUM(
                CASE
                    WHEN payment_date >= CURDATE() - INTERVAL 30 DAY
                     AND payment_date < CURDATE() - INTERVAL 21 DAY
                    THEN 1
                    ELSE 0
                END
            ) AS week1,

            SUM(
                CASE
                    WHEN payment_date >= CURDATE() - INTERVAL 21 DAY
                     AND payment_date < CURDATE() - INTERVAL 14 DAY
                    THEN 1
                    ELSE 0
                END
            ) AS week2,

            SUM(
                CASE
                    WHEN payment_date >= CURDATE() - INTERVAL 14 DAY
                     AND payment_date < CURDATE() - INTERVAL 7 DAY
                    THEN 1
                    ELSE 0
                END
            ) AS week3,

            SUM(
                CASE
                    WHEN payment_date >= CURDATE() - INTERVAL 7 DAY
                    THEN 1
                    ELSE 0
                END
            ) AS week4

        FROM payment

        WHERE payment_type = 'final'
          AND payment_status = 'completed'
          AND payment_date >= CURDATE() - INTERVAL 30 DAY
    ");

    $orders = $orderStmt->fetch();

    $successfulOrders = [
        [
            "week" => "Week 1",
            "orders" => (int) ($orders["week1"] ?? 0)
        ],
        [
            "week" => "Week 2",
            "orders" => (int) ($orders["week2"] ?? 0)
        ],
        [
            "week" => "Week 3",
            "orders" => (int) ($orders["week3"] ?? 0)
        ],
        [
            "week" => "Week 4",
            "orders" => (int) ($orders["week4"] ?? 0)
        ]
    ];


    /* =========================================
       FINAL RESPONSE
    ========================================= */

    echo json_encode([
        "success" => true,

        "data" => [
            "topCrops" => $topCrops,
            "topDistricts" => $topDistricts,
            "successfulOrders" => $successfulOrders
        ]
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to load market insights."
    ]);
}
?>