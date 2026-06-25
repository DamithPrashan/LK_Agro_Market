<?php
// Session check helper middleware
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function require_login() {
    if (!isset($_SESSION['user'])) {
        header("Content-Type: application/json");
        http_response_code(419);
        echo json_encode([
            "success" => false,
            "message" => "Unauthenticated. Please sign in to continue."
        ]);
        exit;
    }
}

function require_role($role) {
    require_login();
    if ($_SESSION['user']['role'] !== $role) {
        header("Content-Type: application/json");
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized access. Required role: $role"
        ]);
        exit;
    }
}
