<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';

require_once __DIR__ . '/../calendar/logAdminActivity.php';

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


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);

    exit;
}


$data =
    json_decode(
        file_get_contents("php://input"),
        true
    );


$verificationId =
    isset($data["verification_id"])
        ? intval($data["verification_id"])
        : 0;


$decision =
    isset($data["decision"])
        ? strtolower(
            trim($data["decision"])
        )
        : '';


$criteria =
    isset($data["criteria"]) &&
    is_array($data["criteria"])
        ? $data["criteria"]
        : [];


$feedback =
    isset($data["feedback"])
        ? trim($data["feedback"])
        : '';


if ($verificationId <= 0) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid verification request."
    ]);

    exit;
}


if (
    !in_array(
        $decision,
        [
            "accept",
            "reject"
        ],
        true
    )
) {

    echo json_encode([
        "success" => false,
        "message" => "Please select Accept or Reject."
    ]);

    exit;
}


if (count($criteria) === 0) {

    echo json_encode([
        "success" => false,
        "message" =>
            $decision === "accept"
                ? "Select at least one verification criterion."
                : "Select at least one rejection reason."
    ]);

    exit;
}


if (empty($feedback)) {

    echo json_encode([
        "success" => false,
        "message" => "Please provide feedback to the farmer."
    ]);

    exit;
}


try {

    $pdo->beginTransaction();


    /*
    =====================================================
    GET FARMER
    =====================================================
    */

    $stmt = $pdo->prepare("
        SELECT
            fv.verification_id,
            fv.farmer_id,
            fv.verification_status,

            f.user_id,

            u.name,
            u.email

        FROM farmer_verification fv

        INNER JOIN farmer f
            ON fv.farmer_id = f.farmer_id

        INNER JOIN user u
            ON f.user_id = u.user_id

        WHERE fv.verification_id = ?

        FOR UPDATE
    ");


    $stmt->execute([
        $verificationId
    ]);


    $verification =
        $stmt->fetch(PDO::FETCH_ASSOC);


    if (!$verification) {

        $pdo->rollBack();

        echo json_encode([
            "success" => false,
            "message" => "Verification request not found."
        ]);

        exit;
    }


    if (
        $verification["verification_status"]
        !== "pending"
    ) {

        $pdo->rollBack();

        echo json_encode([
            "success" => false,
            "message" =>
                "This verification request has already been reviewed."
        ]);

        exit;
    }


    $farmerId =
        (int) $verification["farmer_id"];


    $farmerName =
        $verification["name"];

    $farmerEmail =
        $verification["email"];


    $criteriaJson =
        json_encode(
            array_values($criteria),
            JSON_UNESCAPED_UNICODE
        );


    /*
    =====================================================
    ACCEPT FARMER
    =====================================================
    */

    if ($decision === "accept") {

        $rating =
            min(
                5,
                max(
                    1,
                    count($criteria)
                )
            );


        $stmt = $pdo->prepare("
            UPDATE farmer_verification

            SET
                verification_status = 'approved',
                verification_rating = ?,
                verification_reasons = ?,
                admin_feedback = ?,
                verified_date = NOW()

            WHERE verification_id = ?
        ");


        $stmt->execute([
            $rating,
            $criteriaJson,
            $feedback,
            $verificationId
        ]);


        $stmt = $pdo->prepare("
            UPDATE farmer

            SET verified_status = 1

            WHERE farmer_id = ?
        ");


        $stmt->execute([
            $farmerId
        ]);


        /*
        =============================================
        ADMIN CALENDAR
        =============================================
        */

        logAdminActivity(

            $pdo,

            "farmer_verified",

            "Farmer Verified",

            $farmerName .
            " was approved with a " .
            $rating .
            "-star verification rating.",

            $verificationId,

            $_SESSION['user']['id']
        );


        $pdo->commit();

        // Send approval email to farmer (Non-blocking)
        try {
            require_once __DIR__ . '/../../../config/mailer.php';
            require_once __DIR__ . '/../../../config/farmer_email_templates.php';
            if (function_exists('farmerAccountApproved') && function_exists('sendMail')) {
                $template = farmerAccountApproved($farmerName, $feedback, $criteria);
                sendMail($farmerEmail, $farmerName, $template['subject'], $template['body']);
            }
        } catch (Throwable $e) {
            $logDir = __DIR__ . '/../../../logs';
            if (!is_dir($logDir)) { @mkdir($logDir, 0755, true); }
            $timestamp = date('Y-m-d H:i:s');
            @file_put_contents($logDir . '/mail_log.txt', "[{$timestamp}] FAILED  | {$farmerEmail} | Exception during approval email: " . $e->getMessage() . "\n", FILE_APPEND);
        }


        echo json_encode([

            "success" => true,

            "status" =>
                "approved",

            "rating" =>
                $rating,

            "message" =>
                "Farmer verification approved successfully."

        ]);

        exit;

    }


    /*
    =====================================================
    REJECT FARMER
    =====================================================
    */

    $stmt = $pdo->prepare("
        UPDATE farmer_verification

        SET
            verification_status = 'rejected',
            verification_rating = NULL,
            verification_reasons = ?,
            admin_feedback = ?,
            verified_date = NOW()

        WHERE verification_id = ?
    ");


    $stmt->execute([
        $criteriaJson,
        $feedback,
        $verificationId
    ]);


    $stmt = $pdo->prepare("
        UPDATE farmer

        SET verified_status = 0

        WHERE farmer_id = ?
    ");


    $stmt->execute([
        $farmerId
    ]);


    /*
    =============================================
    ADMIN CALENDAR
    =============================================
    */

    logAdminActivity(

        $pdo,

        "farmer_rejected",

        "Farmer Verification Rejected",

        $farmerName .
        "'s farmer verification request was rejected.",

        $verificationId,

        $_SESSION['user']['id']
    );


    $pdo->commit();

    // Send rejection email to farmer (Non-blocking)
    try {
        require_once __DIR__ . '/../../../config/mailer.php';
        require_once __DIR__ . '/../../../config/farmer_email_templates.php';
        if (function_exists('farmerAccountRejected') && function_exists('sendMail')) {
            $template = farmerAccountRejected($farmerName, $feedback);
            sendMail($farmerEmail, $farmerName, $template['subject'], $template['body']);
        }
    } catch (Throwable $e) {
        $logDir = __DIR__ . '/../../../logs';
        if (!is_dir($logDir)) { @mkdir($logDir, 0755, true); }
        $timestamp = date('Y-m-d H:i:s');
        @file_put_contents($logDir . '/mail_log.txt', "[{$timestamp}] FAILED  | {$farmerEmail} | Exception during rejection email: " . $e->getMessage() . "\n", FILE_APPEND);
    }


    echo json_encode([

        "success" => true,

        "status" =>
            "rejected",

        "message" =>
            "Farmer verification rejected successfully."

    ]);


} catch (Exception $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }


    http_response_code(500);


    echo json_encode([

        "success" => false,

        "message" =>
            "Verification error: " .
            $e->getMessage()

    ]);

}

?>