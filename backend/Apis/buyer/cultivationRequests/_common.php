<?php
require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';

function cultivation_request_json(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function cultivation_request_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') cultivation_request_json(400, ['success' => false, 'message' => 'Request body is required.']);
    try { $input = json_decode($raw, true, 512, JSON_THROW_ON_ERROR); }
    catch (JsonException $error) { cultivation_request_json(400, ['success' => false, 'message' => 'Request body must contain valid JSON.']); }
    if (!is_array($input)) cultivation_request_json(400, ['success' => false, 'message' => 'Request body must be a JSON object.']);
    return $input;
}

function cultivation_require_buyer(): array
{
    require_login();
    require_role('buyer');
    global $pdo;
    $stmt = $pdo->prepare('SELECT buyer_id, user_id FROM buyer WHERE user_id = ?');
    $stmt->execute([$_SESSION['user']['id']]);
    $buyer = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$buyer) cultivation_request_json(403, ['success' => false, 'message' => 'Buyer account not found.']);
    return $buyer;
}

function cultivation_valid_date(string $value): bool
{
    $date = DateTime::createFromFormat('!Y-m-d', $value);
    return $date && $date->format('Y-m-d') === $value;
}
