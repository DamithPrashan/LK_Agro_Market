<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once 'auth_check.php';

// Ensure user is logged in
require_login();

$userId = $_SESSION['user']['id'];

// Check action (delete or upload)
$action = isset($_POST['action']) ? $_POST['action'] : (isset($_GET['action']) ? $_GET['action'] : 'upload');

if ($action === 'delete') {
    try {
        // Find existing image to delete from disk
        $stmt = $pdo->prepare("SELECT profile_image FROM user WHERE user_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if ($user && !empty($user['profile_image'])) {
            $existing_file = '../../' . $user['profile_image']; // profile_image starts with 'backend/uploads/'
            if (file_exists($existing_file)) {
                unlink($existing_file);
            }
        }

        // Update database
        $updateStmt = $pdo->prepare("UPDATE user SET profile_image = NULL WHERE user_id = ?");
        $updateStmt->execute([$userId]);

        // Update session
        $_SESSION['user']['profile_image'] = null;

        echo json_encode([
            "success" => true,
            "message" => "Profile photo removed successfully.",
            "profile_image" => null
        ]);
        exit;
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        exit;
    }
}

// Upload action
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

if (!isset($_FILES['profile_image']) || $_FILES['profile_image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "No file uploaded or file upload error."]);
    exit;
}

$file = $_FILES['profile_image'];
$allowed_exts = ['jpg', 'jpeg', 'png'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($ext, $allowed_exts)) {
    echo json_encode(["success" => false, "message" => "Invalid file type. Only JPG, JPEG, and PNG are allowed."]);
    exit;
}

// Limit size to 5MB
$max_size = 5 * 1024 * 1024;
if ($file['size'] > $max_size) {
    echo json_encode(["success" => false, "message" => "File size exceeds the 5MB limit."]);
    exit;
}

$upload_dir = '../uploads/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

$filename = 'profile_' . $userId . '_' . time() . '_' . uniqid() . '.' . $ext;
$target_path = $upload_dir . $filename;
$db_path = 'backend/uploads/' . $filename;

if (move_uploaded_file($file['tmp_name'], $target_path)) {
    try {
        // Find existing image to delete from disk (cleanup)
        $stmt = $pdo->prepare("SELECT profile_image FROM user WHERE user_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if ($user && !empty($user['profile_image'])) {
            $existing_file = '../../' . $user['profile_image'];
            if (file_exists($existing_file)) {
                unlink($existing_file);
            }
        }

        // Update database
        $updateStmt = $pdo->prepare("UPDATE user SET profile_image = ? WHERE user_id = ?");
        $updateStmt->execute([$db_path, $userId]);

        // Update session
        $_SESSION['user']['profile_image'] = $db_path;

        echo json_encode([
            "success" => true,
            "message" => "Profile photo uploaded successfully.",
            "profile_image" => $db_path
        ]);
    } catch (PDOException $e) {
        // Delete uploaded file if DB update fails
        if (file_exists($target_path)) {
            unlink($target_path);
        }
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Failed to move uploaded file."]);
}
