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

$title =
    isset($_POST['title'])
        ? trim($_POST['title'])
        : '';

$description =
    isset($_POST['description'])
        ? trim($_POST['description'])
        : '';

$date =
    isset($_POST['date'])
        ? trim($_POST['date'])
        : '';

$time =
    isset($_POST['time'])
        ? trim($_POST['time'])
        : '09:00';


if (
    $activityId <= 0 ||
    empty($title) ||
    empty($date)
) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid note data."
    ]);

    exit;
}


$activityDate =
    $date . ' ' . $time . ':00';


try {

    /*
     * Only manual notes can be edited.
     */

    $check = $pdo->prepare("
        SELECT activity_id
        FROM admin_activity
        WHERE activity_id = ?
        AND activity_type = 'manual_note'
    ");

    $check->execute([
        $activityId
    ]);


    if (!$check->fetch()) {

        echo json_encode([
            "success" => false,
            "message" =>
                "Note not found or cannot be edited."
        ]);

        exit;
    }


    $stmt = $pdo->prepare("
        UPDATE admin_activity
        SET
            title = ?,
            description = ?,
            activity_date = ?
        WHERE activity_id = ?
        AND activity_type = 'manual_note'
    ");


    $stmt->execute([
        $title,
        $description,
        $activityDate,
        $activityId
    ]);


    echo json_encode([
        "success" => true,
        "message" => "Note updated successfully."
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