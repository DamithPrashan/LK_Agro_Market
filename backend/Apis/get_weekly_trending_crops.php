<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../connection/db.php';

try {

    $sql = "
        WITH completed_orders AS
        (
            SELECT
                LOWER(TRIM(c.crop_name)) AS crop_key,
                c.district,
                r.reservation_id

            FROM payment p

            JOIN reservation r
                ON p.reservation_id = r.reservation_id

            JOIN reserve_crop rc
                ON r.reserve_crop_id = rc.reserve_crop_id

            JOIN crop c
                ON rc.crop_id = c.crop_id

            WHERE p.payment_type = 'final'

              AND p.payment_status = 'completed'

              AND p.payment_date >= NOW() - INTERVAL 7 DAY

              AND c.updated_at >= NOW() - INTERVAL 7 DAY
        ),

        crop_totals AS
        (
            SELECT
                crop_key,

                COUNT(
                    DISTINCT reservation_id
                ) AS completed_orders

            FROM completed_orders

            GROUP BY crop_key
        ),

        district_totals AS
        (
            SELECT
                crop_key,
                district,

                COUNT(
                    DISTINCT reservation_id
                ) AS district_orders

            FROM completed_orders

            GROUP BY
                crop_key,
                district
        ),

        ranked_districts AS
        (
            SELECT
                crop_key,
                district,
                district_orders,

                ROW_NUMBER() OVER
                (
                    PARTITION BY crop_key

                    ORDER BY
                        district_orders DESC,
                        district ASC
                ) AS ranking

            FROM district_totals
        ),

        district_prices AS
        (
            SELECT

                LOWER(
                    TRIM(crop_name)
                ) AS crop_key,

                district,

                AVG(suggested_price)
                    AS average_price

            FROM crop

            WHERE
                updated_at >= NOW() - INTERVAL 7 DAY

                AND suggested_price IS NOT NULL

            GROUP BY
                LOWER(TRIM(crop_name)),
                district
        )

        SELECT

            CONCAT(
                UPPER(LEFT(ct.crop_key, 1)),
                SUBSTRING(ct.crop_key, 2)
            ) AS crop_name,

            rd.district,

            ROUND(
                dp.average_price,
                2
            ) AS average_price,

            ct.completed_orders

        FROM crop_totals ct

        JOIN ranked_districts rd

            ON rd.crop_key = ct.crop_key

            AND rd.ranking = 1

        LEFT JOIN district_prices dp

            ON dp.crop_key = ct.crop_key

            AND dp.district = rd.district

        ORDER BY
            ct.completed_orders DESC

        LIMIT 4
    ";

    $stmt = $pdo->query($sql);

    $trendingCrops = [];

    while ($row = $stmt->fetch()) {

        $trendingCrops[] = [

            "crop_name" =>
                $row["crop_name"],

            "district" =>
                $row["district"],

            "average_price" =>
                $row["average_price"] !== null
                    ? (float) $row["average_price"]
                    : null,

            "completed_orders" =>
                (int) $row["completed_orders"]

        ];
    }


    echo json_encode([

        "success" => true,

        "data" => $trendingCrops

    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([

        "success" => false,

        "message" =>
            "Failed to load weekly trending crops."

    ]);
}
?>