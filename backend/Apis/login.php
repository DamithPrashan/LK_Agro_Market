<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once 'auth_check.php';


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


$email =
    isset($data['email'])
        ? trim($data['email'])
        : '';


$password =
    isset($data['password'])
        ? $data['password']
        : '';


if (
    empty($email) ||
    empty($password)
) {

    echo json_encode([
        "success" => false,
        "error_key" => "errors.enterEmailPassword",
        "message" =>
            "Please enter your email and password."
    ]);

    exit;
}


try {

    /*
    =====================================================
    GET USER + FARMER VERIFICATION
    =====================================================
    */

    $stmt = $pdo->prepare("

        SELECT

            u.*,

            f.farmer_id,
            f.verified_status,

            fv.verification_status,
            fv.verification_rating,
            fv.admin_feedback

        FROM user u

        LEFT JOIN farmer f
            ON u.user_id = f.user_id

        LEFT JOIN farmer_verification fv
            ON f.farmer_id = fv.farmer_id

        WHERE u.email = ?

        LIMIT 1

    ");


    $stmt->execute([
        $email
    ]);


    $user =
        $stmt->fetch();


    /*
    =====================================================
    INVALID LOGIN
    =====================================================
    */

    if (
        !$user ||
        !password_verify(
            $password,
            $user['password']
        )
    ) {

        echo json_encode([
            "success" => false,
            "error_key" => "errors.invalidEmailPassword",
            "message" =>
                "Invalid email or password."
        ]);

        exit;
    }

    if (($user['account_status'] ?? 'inactive') !== 'active') {

        echo json_encode([
            "success" => false,
            "error_key" => "errors.accountInactive",
            "message" => "Your account is inactive. Please contact the administrator."
        ]);

        exit;
    }


    /*
    =====================================================
    FARMER VERIFICATION CHECK
    =====================================================
    */

    if (
        $user['role'] === 'farmer'
    ) {


        $verificationStatus =
            $user['verification_status']
            ?? 'pending';


        /*
        ---------------------------------------------
        PENDING
        ---------------------------------------------
        */

        if (
            $verificationStatus ===
            'pending'
        ) {

            echo json_encode([

                "success" => false,

                "error_key" => "errors.farmerVerificationPending",

                "verification_required" => true,

                "verification_status" =>
                    "pending",

                "message" =>
                    "Your farmer verification request is still under review. Please wait for admin approval."

            ]);

            exit;

        }


        /*
        ---------------------------------------------
        REJECTED
        ---------------------------------------------
        */

        if (
            $verificationStatus ===
            'rejected'
        ) {

            echo json_encode([

                "success" => false,

                "error_key" => "errors.farmerVerificationRejected",

                "verification_required" => true,

                "verification_status" =>
                    "rejected",

                "message" =>
                    "Your farmer verification request was rejected.",

                "feedback" =>
                    $user['admin_feedback']
                    ?? ""

            ]);

            exit;

        }


        /*
        ---------------------------------------------
        SAFETY CHECK

        Even if verification_status says approved,
        farmer.verified_status must also be 1.
        ---------------------------------------------
        */

        if (
            intval(
                $user['verified_status']
            ) !== 1
        ) {

            echo json_encode([

                "success" => false,

                "error_key" => "errors.farmerWaitingAdminVerification",

                "verification_required" => true,

                "verification_status" =>
                    "pending",

                "message" =>
                    "Your farmer account is waiting for admin verification."

            ]);

            exit;

        }

    }


    /*
    =====================================================
    LOGIN ALLOWED
    =====================================================
    */

    $userResponse = [

        "id" =>
            intval(
                $user['user_id']
            ),

        "name" =>
            $user['name'],

        "email" =>
            $user['email'],

        "contact" =>
            $user['phone'],

        "district" =>
            $user['location'],

        "language" =>
            $user['language']
            ?? 'sinhala',

        "role" =>
            $user['role'],

        "verified" =>
            isset(
                $user['verified_status']
            )
            &&
            intval(
                $user['verified_status']
            ) === 1,

        "verification_rating" =>
            isset(
                $user['verification_rating']
            )
                ? intval(
                    $user[
                        'verification_rating'
                    ]
                )
                : null,

        "profile_image" =>
            $user['profile_image']

    ];


    /*
    =====================================================
    SESSION
    =====================================================
    */

    $_SESSION['user'] =
        $userResponse;


    echo json_encode([

        "success" => true,

        "user" =>
            $userResponse

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
