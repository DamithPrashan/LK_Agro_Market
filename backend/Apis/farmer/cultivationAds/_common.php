<?php
require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';

const CULTIVATION_AD_MAX_PHOTOS = 5;
const CULTIVATION_AD_MAX_PHOTO_BYTES = 2097152;
const CULTIVATION_AD_MAX_DESCRIPTION = 2000;
const CULTIVATION_AD_UNITS = ['kg'];
const CULTIVATION_AD_AREA_UNITS = ['acres', 'hectares', 'perches'];
const CULTIVATION_AD_CATEGORIES = ['Vegetable', 'Fruit', 'Grain', 'Other'];
const CULTIVATION_AD_DISTRICTS = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'];

function cultivation_json(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function cultivation_json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') cultivation_json(400, ['success' => false, 'message' => 'Request body is required.']);
    try { $input = json_decode($raw, true, 512, JSON_THROW_ON_ERROR); }
    catch (JsonException $error) { cultivation_json(400, ['success' => false, 'message' => 'Request body must contain valid JSON.']); }
    if (!is_array($input)) cultivation_json(400, ['success' => false, 'message' => 'Request body must be a JSON object.']);
    return $input;
}

function cultivation_require_farmer(bool $verifiedOnly = false): array
{
    require_login();
    require_role('farmer');
    global $pdo;
    $stmt = $pdo->prepare('SELECT farmer_id, verified_status FROM farmer WHERE user_id = ?');
    $stmt->execute([$_SESSION['user']['id']]);
    $farmer = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$farmer) {
        cultivation_json(403, ['success' => false, 'message' => 'Farmer account not found.']);
    }
    if ($verifiedOnly && (int)$farmer['verified_status'] !== 1) {
        cultivation_json(403, ['success' => false, 'message' => 'Only verified farmers can create or open cultivation opportunities.']);
    }
    return $farmer;
}

function cultivation_fields(array $source, float $committed = 0): array
{
    $data = [
        'crop_name' => trim((string)($source['crop_name'] ?? '')),
        'category' => trim((string)($source['category'] ?? '')),
        'district' => trim((string)($source['district'] ?? '')),
        'capacity_quantity' => (float)($source['capacity_quantity'] ?? 0),
        'unit' => trim((string)($source['unit'] ?? '')),
        'estimated_unit_price' => (float)($source['estimated_unit_price'] ?? 0),
        'expected_harvest_date' => trim((string)($source['expected_harvest_date'] ?? '')),
        'cultivation_area' => ($source['cultivation_area'] ?? '') === '' ? null : (float)$source['cultivation_area'],
        'area_unit' => trim((string)($source['area_unit'] ?? '')) ?: null,
        'description' => trim((string)($source['description'] ?? '')) ?: null,
    ];
    $errors = [];
    if ($data['crop_name'] === '' || mb_strlen($data['crop_name']) > 100) $errors[] = 'Crop name is required and must not exceed 100 characters.';
    if (!in_array($data['category'], CULTIVATION_AD_CATEGORIES, true)) $errors[] = 'Select a valid crop category.';
    if (!in_array($data['district'], CULTIVATION_AD_DISTRICTS, true)) $errors[] = 'Select a valid Sri Lankan district.';
    if ($data['capacity_quantity'] <= 0) $errors[] = 'Cultivation capacity must be greater than zero.';
    if ($data['capacity_quantity'] < $committed) $errors[] = 'Capacity cannot be lower than the committed quantity.';
    if (!in_array($data['unit'], CULTIVATION_AD_UNITS, true)) $errors[] = 'Unit must be kg.';
    if ($data['estimated_unit_price'] <= 0) $errors[] = 'Estimated price must be greater than zero.';
    $date = DateTime::createFromFormat('!Y-m-d', $data['expected_harvest_date']);
    $today = new DateTime('today');
    if (!$date || $date->format('Y-m-d') !== $data['expected_harvest_date'] || $date <= $today) $errors[] = 'Expected harvest date must be a valid future date.';
    if ($data['cultivation_area'] !== null && $data['cultivation_area'] <= 0) $errors[] = 'Cultivation area must be greater than zero when provided.';
    if ($data['cultivation_area'] !== null && !in_array($data['area_unit'], CULTIVATION_AD_AREA_UNITS, true)) $errors[] = 'Select a valid area unit when cultivation area is provided.';
    if ($data['cultivation_area'] === null) $data['area_unit'] = null;
    if ($data['description'] !== null && mb_strlen($data['description']) > CULTIVATION_AD_MAX_DESCRIPTION) $errors[] = 'Description must not exceed 2000 characters.';
    if ($errors) cultivation_json(422, ['success' => false, 'message' => $errors[0], 'errors' => $errors]);
    return $data;
}

function cultivation_photo_files(): array
{
    if (!isset($_FILES['photos'])) return [];
    $files = $_FILES['photos'];
    $normalized = [];
    $names = is_array($files['name']) ? $files['name'] : [$files['name']];
    foreach ($names as $i => $name) {
        $error = is_array($files['error']) ? $files['error'][$i] : $files['error'];
        if ($error === UPLOAD_ERR_NO_FILE) continue;
        if (in_array($error, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) cultivation_json(422, ['success' => false, 'message' => 'A photo exceeds the server upload limit.']);
        if ($error !== UPLOAD_ERR_OK) cultivation_json(422, ['success' => false, 'message' => 'A photo upload failed.']);
        $normalized[] = [
            'name' => $name,
            'tmp_name' => is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'],
            'size' => is_array($files['size']) ? $files['size'][$i] : $files['size'],
        ];
    }
    if (count($normalized) > CULTIVATION_AD_MAX_PHOTOS) cultivation_json(422, ['success' => false, 'message' => 'A maximum of 5 photos is allowed.']);
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $finfo = class_exists('finfo') ? new finfo(FILEINFO_MIME_TYPE) : null;
    foreach ($normalized as &$file) {
        if ($file['size'] <= 0 || $file['size'] > CULTIVATION_AD_MAX_PHOTO_BYTES) cultivation_json(422, ['success' => false, 'message' => 'Each photo must be 2 MB or smaller.']);
        $imageInfo = @getimagesize($file['tmp_name']);
        $mime = $finfo ? $finfo->file($file['tmp_name']) : ($imageInfo['mime'] ?? null);
        if (!isset($allowed[$mime])) cultivation_json(422, ['success' => false, 'message' => 'Photos must be JPG, PNG, or WebP images.']);
        $file['extension'] = $allowed[$mime];
    }
    return $normalized;
}

function cultivation_store_photos(PDO $pdo, int $adId, array $files, array &$createdFiles): void
{
    $directory = __DIR__ . '/../../../uploads/cultivation_ads';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) throw new RuntimeException('Unable to create cultivation photo directory.');
    $insert = $pdo->prepare('INSERT INTO cultivation_ad_photos (cultivation_ad_id, photo_path) VALUES (?, ?)');
    foreach ($files as $file) {
        $filename = 'cultivation_' . $adId . '_' . bin2hex(random_bytes(12)) . '.' . $file['extension'];
        $absolute = $directory . DIRECTORY_SEPARATOR . $filename;
        if (!move_uploaded_file($file['tmp_name'], $absolute)) throw new RuntimeException('Unable to save a cultivation photo.');
        $createdFiles[] = $absolute;
        $insert->execute([$adId, 'backend/uploads/cultivation_ads/' . $filename]);
    }
}

function cultivation_cleanup_files(array $files): void
{
    foreach ($files as $file) if (is_file($file)) unlink($file);
}
