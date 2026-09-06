<?php
/**
 * serve_file.php — Authenticated file proxy for sensitive uploads.
 *
 * Serves files from protected directories (NIC/, FarmEvidence/) only to
 * authenticated admins. All other upload files remain directly accessible
 * via Apache.
 *
 * Usage:
 *   /backend/Apis/serve_file.php?path=backend/uploads/NIC/nic_123.jpg
 *
 * Security model:
 *   - Only files inside backend/uploads/NIC/ and backend/uploads/FarmEvidence/
 *     are routed through this proxy.
 *   - Caller must be logged in with role = 'admin'.
 *   - Path is validated against a whitelist (no directory traversal).
 *   - File must exist on disk.
 */
declare(strict_types=1);

require_once __DIR__ . '/../connection/db.php';
require_once __DIR__ . '/auth_check.php';

// ── Auth ──────────────────────────────────────────────────────────────────────
require_role('admin');

// ── Input validation ──────────────────────────────────────────────────────────
$rawPath = trim((string)($_GET['path'] ?? ''));

if ($rawPath === '') {
    http_response_code(400);
    exit('Missing path parameter.');
}

// Only allow these sensitive subdirectories through this proxy.
$allowedPrefixes = [
    'backend/uploads/NIC/',
    'backend/uploads/FarmEvidence/',
];

$prefixAllowed = false;
foreach ($allowedPrefixes as $prefix) {
    if (str_starts_with($rawPath, $prefix)) {
        $prefixAllowed = true;
        break;
    }
}

if (!$prefixAllowed) {
    http_response_code(403);
    exit('Access to this path is not permitted via the secure proxy.');
}

// Prevent directory traversal — reject any path containing ".."
if (str_contains($rawPath, '..')) {
    http_response_code(400);
    exit('Invalid path.');
}

// ── Resolve absolute path ─────────────────────────────────────────────────────
// Project root is 3 levels up from this file (backend/Apis/serve_file.php)
$projectRoot = dirname(__DIR__, 2); // e.g. E:\XAMPP\htdocs\LK_Agro_Market
$absolutePath = $projectRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rawPath);

// Ensure resolved path is still inside the project root (extra safety)
$realPath = realpath($absolutePath);
$realRoot = realpath($projectRoot);

if ($realPath === false || $realRoot === false) {
    http_response_code(404);
    exit('File not found.');
}

if (!str_starts_with($realPath, $realRoot)) {
    http_response_code(403);
    exit('Path traversal detected.');
}

if (!is_file($realPath)) {
    http_response_code(404);
    exit('File not found.');
}

// ── Detect MIME type ──────────────────────────────────────────────────────────
$mimeType = mime_content_type($realPath) ?: 'application/octet-stream';

// Only allow image and document types that make sense for NIC/evidence files
$allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
];

if (!in_array($mimeType, $allowedMimes, true)) {
    http_response_code(403);
    exit('File type not permitted.');
}

// ── Serve file ────────────────────────────────────────────────────────────────
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($realPath));
// Inline display for images and PDF; no caching of sensitive docs
header('Content-Disposition: inline; filename="' . basename($realPath) . '"');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');

readfile($realPath);
exit;
