<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../../../connection/db.php';


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);

    exit;
}


$activityId =
    isset($_POST['activity_id'])
        ? intval($_POST['activity_id'])
        : 0;


if ($activityId <= 0) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid activity ID."
    ]);

    exit;
}


try {

    /*
     * Only manual notes can be deleted.
     * Automatic admin activities remain protected.
     */

    $stmt = $pdo->prepare("
        DELETE FROM admin_activity
        WHERE activity_id = ?
        AND activity_type = 'manual_note'
    ");


    $stmt->execute([
        $activityId
    ]);


    if ($stmt->rowCount() === 0) {

        echo json_encode([
            "success" => false,
            "message" =>
                "Note not found or cannot be deleted."
        ]);

        exit;
    }


    echo json_encode([
        "success" => true,
        "message" => "Note deleted successfully."
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