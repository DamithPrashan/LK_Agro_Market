<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../auth_check.php';

if (isset($_SESSION['user'])) {
    require_login();
    echo json_encode([
        "success" => true,
        "user" => $_SESSION['user']
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "No active session."
    ]);
}
