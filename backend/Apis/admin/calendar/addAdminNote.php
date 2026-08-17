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


if (empty($title) || empty($date)) {

    echo json_encode([
        "success" => false,
        "message" => "Title and date are required."
    ]);

    exit;
}


$activityDate =
    $date . ' ' . $time . ':00';


try {

    $stmt = $pdo->prepare("
        INSERT INTO admin_activity
        (
            admin_id,
            activity_type,
            title,
            description,
            reference_id,
            activity_date
        )
        VALUES
        (
            NULL,
            'manual_note',
            ?,
            ?,
            NULL,
            ?
        )
    ");


    $stmt->execute([
        $title,
        $description,
        $activityDate
    ]);


    echo json_encode([
        "success" => true,
        "message" => "Note added successfully.",
        "activity_id" => $pdo->lastInsertId()
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