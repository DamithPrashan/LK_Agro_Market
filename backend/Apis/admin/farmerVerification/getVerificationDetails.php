<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';

require_login();

function resolveVerificationUploadPath(?string $path): ?string {
    if (!$path) {
        return $path;
    }

    $normalised = ltrim($path, '/');
    $projectRoot = dirname(__DIR__, 4);

    if (is_file($projectRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $normalised))) {
        return $normalised;
    }

    $legacyPath = 'backend/Apis/uploads/' . basename($normalised);
    if (is_file($projectRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $legacyPath))) {
        return $legacyPath;
    }

    return $normalised;
}


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


$verificationId =
    isset($_GET['id'])
        ? intval($_GET['id'])
        : 0;


if ($verificationId <= 0) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid verification ID."
    ]);

    exit;
}


try {

    $stmt = $pdo->prepare("
        SELECT
            fv.verification_id,
            fv.farmer_id,
            fv.nic_number,
            fv.farm_location,
            fv.evidence_file,
            fv.nic_image,
            fv.verification_status,
            fv.verification_rating,
            fv.verification_reasons,
            fv.admin_feedback,
            fv.verified_date,

            f.verified_status,

            u.user_id,
            u.name,
            u.email,
            u.phone,
            u.location,
            u.language,
            u.created_at,
            u.profile_image

        FROM farmer_verification fv

        INNER JOIN farmer f
            ON fv.farmer_id = f.farmer_id

        INNER JOIN user u
            ON f.user_id = u.user_id

        WHERE fv.verification_id = ?

        LIMIT 1
    ");


    $stmt->execute([
        $verificationId
    ]);


    $row =
        $stmt->fetch(PDO::FETCH_ASSOC);


    if (!$row) {

        echo json_encode([
            "success" => false,
            "message" => "Verification request not found."
        ]);

        exit;
    }


    $reasons = [];

    if (
        !empty(
            $row["verification_reasons"]
        )
    ) {

        $decoded =
            json_decode(
                $row["verification_reasons"],
                true
            );

        if (is_array($decoded)) {
            $reasons = $decoded;
        }

    }


    echo json_encode([

        "success" => true,

        "verification" => [

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
                $row["location"],

            "language" =>
                $row["language"],

            "registeredDate" =>
                $row["created_at"],

            "nic" =>
                $row["nic_number"],

            "farmLocation" =>
                $row["farm_location"],

            "nicImage" =>
                resolveVerificationUploadPath($row["nic_image"]),

            "evidenceFile" =>
                resolveVerificationUploadPath($row["evidence_file"]),

            "profileImage" =>
                $row["profile_image"],

            "status" =>
                $row["verification_status"],

            "verified" =>
                ((int) $row["verified_status"] === 1),

            "rating" =>
                $row["verification_rating"] !== null
                    ? (int) $row["verification_rating"]
                    : null,

            "reasons" =>
                $reasons,

            "feedback" =>
                $row["admin_feedback"],

            "verifiedDate" =>
                $row["verified_date"]

        ]

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
