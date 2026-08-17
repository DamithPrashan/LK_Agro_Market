<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once __DIR__ . '/../../connection/db.php';

$response = [];

try {

    /*
    =====================================================
    TOTAL FARMERS
    =====================================================
    */

    $stmt = $pdo->query("
        SELECT COUNT(*) AS total
        FROM farmer
    ");

    $response["farmers"] =
        (int) $stmt->fetch()['total'];


    /*
    =====================================================
    TOTAL BUYERS
    =====================================================
    */

    $stmt = $pdo->query("
        SELECT COUNT(*) AS total
        FROM buyer
    ");

    $response["buyers"] =
        (int) $stmt->fetch()['total'];


    /*
    =====================================================
    TOTAL ORDERS
    =====================================================
    */

    $stmt = $pdo->query("
        SELECT COUNT(*) AS total
        FROM reserve_crop
    ");

    $response["orders"] =
        (int) $stmt->fetch()['total'];


    /*
    =====================================================
    PENDING COMPLAINTS
    =====================================================
    */

    $stmt = $pdo->query("
        SELECT COUNT(*) AS total
        FROM complaints
        WHERE status IN ('submitted', 'awaiting_farmer_response')
    ");

    $response["complaints"] =
        (int) $stmt->fetch()['total'];


    /*
    =====================================================
    THIS WEEK SUMMARY
    Monday -> current time
    =====================================================
    */


    /* NEW FARMERS */

    $stmt = $pdo->query("
        SELECT COUNT(*) AS total
        FROM farmer f

        INNER JOIN user u
            ON f.user_id = u.user_id

        WHERE u.created_at >= DATE_SUB(
            CURDATE(),
            INTERVAL WEEKDAY(CURDATE()) DAY
        )

        AND u.created_at <= NOW()
    ");

    $newFarmers =
        (int) $stmt->fetch()['total'];


    /* NEW BUYERS */

    $stmt = $pdo->query("
        SELECT COUNT(*) AS total
        FROM buyer b

        INNER JOIN user u
            ON b.user_id = u.user_id

        WHERE u.created_at >= DATE_SUB(
            CURDATE(),
            INTERVAL WEEKDAY(CURDATE()) DAY
        )

        AND u.created_at <= NOW()
    ");

    $newBuyers =
        (int) $stmt->fetch()['total'];


    /* COMPLETED PAYMENTS */

    $stmt = $pdo->query("
        SELECT COUNT(*) AS total
        FROM payment

        WHERE payment_status = 'completed'

        AND payment_date >= DATE_SUB(
            CURDATE(),
            INTERVAL WEEKDAY(CURDATE()) DAY
        )

        AND payment_date <= NOW()
    ");

    $transactions =
        (int) $stmt->fetch()['total'];


    /* WEEKLY COMPLAINTS */

    $stmt = $pdo->query("
        SELECT COUNT(*) AS total
        FROM complaints

        WHERE created_at >= DATE_SUB(
            CURDATE(),
            INTERVAL WEEKDAY(CURDATE()) DAY
        )

        AND created_at <= NOW()
    ");

    $weeklyComplaints =
        (int) $stmt->fetch()['total'];


    $response["thisWeekSummary"] = [

        "newFarmers" =>
            $newFarmers,

        "newBuyers" =>
            $newBuyers,

        "transactions" =>
            $transactions,

        "complaints" =>
            $weeklyComplaints

    ];


    /*
    =====================================================
    PRE-ORDERS BY DISTRICT
    TOP 4
    =====================================================
    */

    $stmt = $pdo->query("
        SELECT
            c.district,
            COUNT(r.reservation_id) AS total_orders

        FROM reservation r

        INNER JOIN reserve_crop rc
            ON r.reserve_crop_id = rc.reserve_crop_id

        INNER JOIN crop c
            ON rc.crop_id = c.crop_id

        WHERE r.reservation_status <> 'cancelled'

        AND c.district IS NOT NULL

        AND TRIM(c.district) <> ''

        GROUP BY c.district

        ORDER BY total_orders DESC

        LIMIT 4
    ");

    $districtOrders =
        $stmt->fetchAll(PDO::FETCH_ASSOC);


    $response["preordersByDistrict"] =
        array_map(

            function ($row) {

                return [

                    "district" =>
                        $row["district"],

                    "orders" =>
                        (int)
                        $row["total_orders"]

                ];

            },

            $districtOrders
        );


    /*
    =====================================================
    PENDING FARMER VERIFICATIONS
    =====================================================
    */

    $stmt = $pdo->query("
        SELECT
            fv.verification_id,
            fv.nic_number,
            fv.farm_location,
            fv.verification_status,
            u.name AS farmer_name

        FROM farmer_verification fv

        INNER JOIN farmer f
            ON fv.farmer_id = f.farmer_id

        INNER JOIN user u
            ON f.user_id = u.user_id

        WHERE fv.verification_status = 'pending'
    ");

    $response["pendingVerification"] =
        $stmt->fetchAll(PDO::FETCH_ASSOC);


    /*
    =====================================================
    ADMIN ACTIVITY
    Latest 60 activities
    =====================================================
    */

    $stmt = $pdo->query("
        SELECT
            activity_id,
            admin_id,
            activity_type,
            title,
            description,
            reference_id,
            activity_date

        FROM admin_activity

        ORDER BY activity_date DESC

        LIMIT 60
    ");

    $activities =
        $stmt->fetchAll(PDO::FETCH_ASSOC);


    $response["adminActivities"] =
        array_map(

            function ($row) {

                return [

                    "id" =>
                        (int) $row["activity_id"],

                    "adminId" =>
                        $row["admin_id"] !== null
                            ? (int) $row["admin_id"]
                            : null,

                    "type" =>
                        $row["activity_type"],

                    "title" =>
                        $row["title"],

                    "description" =>
                        $row["description"],

                    "referenceId" =>
                        $row["reference_id"],

                    "date" =>
                        $row["activity_date"]

                ];

            },

            $activities
        );


    /*
    =====================================================
    ACTIVITY DATES
    Used to show calendar dots
    =====================================================
    */

    $stmt = $pdo->query("
        SELECT DISTINCT
            DATE(activity_date) AS activity_day

        FROM admin_activity

        ORDER BY activity_day DESC
    ");

    $activityDates =
        $stmt->fetchAll(PDO::FETCH_COLUMN);


    $response["activityDates"] =
        $activityDates;


    /*
    =====================================================
    SUCCESS
    =====================================================
    */

    $response["success"] = true;

    echo json_encode($response);


} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([

        "success" => false,

        "message" =>
            "Database error: " .
            $e->getMessage()

    ]);
}

?>
