<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../connection/db.php';
require_once 'auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$contact = isset($_POST['contact']) ? trim($_POST['contact']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$district = isset($_POST['district']) ? trim($_POST['district']) : '';
$language = isset($_POST['language']) ? trim($_POST['language']) : 'sinhala';
$password = isset($_POST['password']) ? $_POST['password'] : '';
$role = isset($_POST['role']) ? trim($_POST['role']) : 'buyer';

// Farmer fields
$nic = isset($_POST['nic']) ? trim($_POST['nic']) : null;
$farm_location = isset($_POST['farm_location']) ? trim($_POST['farm_location']) : null;

if (empty($name) || empty($contact) || empty($email) || empty($district) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Please fill in all required fields."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email address."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Check if email already exists in user table
    $checkStmt = $pdo->prepare("SELECT user_id FROM user WHERE email = ?");
    $checkStmt->execute([$email]);
    if ($checkStmt->fetch()) {
        echo json_encode(["success" => false, "message" => "Email address already registered."]);
        $pdo->rollBack();
        exit;
    }

    // Hash password
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);

    // Insert user into user table (mapping phone -> contact, location -> district)
    $sql = "INSERT INTO user (name, email, password, phone, location, role, language) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $name,
        $email,
        $hashed_password,
        $contact,
        $district,
        $role,
        $language
    ]);

    $userId = $pdo->lastInsertId();

    if ($role === 'farmer') {
        // Insert into farmer table
        $farmerStmt = $pdo->prepare("INSERT INTO farmer (user_id, verified_status) VALUES (?, 0)");
        $farmerStmt->execute([$userId]);
        $farmerId = $pdo->lastInsertId();

        // Handle file uploads if files are provided
        $nic_image_path = null;
        $evidence_path = null;
        $upload_dir = '../uploads/';

        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        if (isset($_FILES['nic_image']) && $_FILES['nic_image']['error'] === UPLOAD_ERR_OK) {
            $nic_ext = pathinfo($_FILES['nic_image']['name'], PATHINFO_EXTENSION);
            $nic_filename = 'nic_' . time() . '_' . uniqid() . '.' . $nic_ext;
            if (move_uploaded_file($_FILES['nic_image']['tmp_name'], $upload_dir . $nic_filename)) {
                $nic_image_path = 'backend/uploads/' . $nic_filename;
            }
        }
        if (isset($_FILES['evidence']) && $_FILES['evidence']['error'] === UPLOAD_ERR_OK) {
            $ev_ext = pathinfo($_FILES['evidence']['name'], PATHINFO_EXTENSION);
            $ev_filename = 'ev_' . time() . '_' . uniqid() . '.' . $ev_ext;
            if (move_uploaded_file($_FILES['evidence']['tmp_name'], $upload_dir . $ev_filename)) {
                $evidence_path = 'backend/uploads/' . $ev_filename;
            }
        }

        // Insert into farmer_verification
        $verifyStmt = $pdo->prepare("INSERT INTO farmer_verification (farmer_id, nic_number, farm_location, evidence_file, nic_image, verification_status) VALUES (?, ?, ?, ?, ?, 'pending')");
        $verifyStmt->execute([
            $farmerId,
            $nic,
            $farm_location,
            $evidence_path,
            $nic_image_path
        ]);
    } else {
        // Insert into buyer table
        $buyerStmt = $pdo->prepare("INSERT INTO buyer (user_id) VALUES (?)");
        $buyerStmt->execute([$userId]);
    }

    $pdo->commit();

    // Map fields to what the frontend expects
    $userResponse = [
        "id" => $userId,
        "name" => $name,
        "email" => $email,
        "contact" => $contact,
        "district" => $district,
        "language" => $language,
        "role" => $role,
        "verified" => false
    ];

    // Start session
    $_SESSION['user'] = $userResponse;

    echo json_encode([
        "success" => true,
        "user" => $userResponse
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
