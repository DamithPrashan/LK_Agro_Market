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

    global $pdo;
    if (!isset($pdo) || !($pdo instanceof PDO)) {
        require_once __DIR__ . '/../connection/db.php';
    }

    $stmt = $pdo->prepare('SELECT account_status FROM user WHERE user_id = ? LIMIT 1');
    $stmt->execute([(int)$_SESSION['user']['id']]);
    $accountStatus = $stmt->fetchColumn();

    if ($accountStatus !== 'active') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        header("Content-Type: application/json");
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Your account is inactive. Please contact the administrator."
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
