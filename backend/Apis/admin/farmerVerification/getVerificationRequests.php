<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';

require_login();


if (
    !isset($_SESSION['user']) ||
    $_SESSION['user']['role'] !== 'admin'
) {

    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Admin access required."
    ]);

    exit;
}


try {

    $stmt = $pdo->query("
        SELECT
            fv.verification_id,
            fv.farmer_id,
            fv.nic_number,
            fv.farm_location,
            fv.verification_status,
            fv.verification_rating,
            fv.admin_feedback,
            fv.verified_date,

            u.user_id,
            u.name,
            u.email,
            u.phone,
            u.location AS district,
            u.created_at,
            u.profile_image

        FROM farmer_verification fv

        INNER JOIN farmer f
            ON fv.farmer_id = f.farmer_id

        INNER JOIN user u
            ON f.user_id = u.user_id

        ORDER BY
            CASE fv.verification_status
                WHEN 'pending' THEN 1
                WHEN 'approved' THEN 2
                WHEN 'rejected' THEN 3
                ELSE 4
            END,
            u.created_at DESC
    ");


    $requests =
        $stmt->fetchAll(PDO::FETCH_ASSOC);


    $result = array_map(
        function ($row) {

            return [

                "id" =>
                    (int) $row["verification_id"],

                "farmerId" =>
                    (int) $row["farmer_id"],

                "userId" =>
                    (int) $row["user_id"],

                "name" =>
                    $row["name"],

                "email" =>
                    $row["email"],

                "phone" =>
                    $row["phone"],

                "district" =>
                    $row["district"],

                "nic" =>
                    $row["nic_number"],

                "farmLocation" =>
                    $row["farm_location"],

                "submittedDate" =>
                    $row["created_at"],

                "status" =>
                    $row["verification_status"],

                "rating" =>
                    $row["verification_rating"] !== null
                        ? (int) $row["verification_rating"]
                        : null,

                "feedback" =>
                    $row["admin_feedback"],

                "verifiedDate" =>
                    $row["verified_date"],

                "avatar" =>
                    $row["profile_image"]

            ];

        },

        $requests
    );


    echo json_encode([

        "success" => true,

        "requests" =>
            $result

    ]);


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