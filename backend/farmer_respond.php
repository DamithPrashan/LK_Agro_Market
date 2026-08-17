<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST");
header("Content-Type: application/json");

require_once __DIR__ . '/connection/db.php';
require_once __DIR__ . '/Apis/auth_check.php';

// Security Check 1: Ensure user is logged in and has role 'farmer'
require_role('farmer');

$user_id = $_SESSION['user']['id'];

// Handle GET: Fetch open complaints for the logged-in farmer
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $sql = "
            SELECT 
                c.id AS complaint_id,
                c.reservation_id,
                c.reason,
                c.description,
                c.evidence_file,
                c.status,
                c.created_at,
                u_buyer.name AS buyer_name,
                u_buyer.email AS buyer_email,
                cr.crop_name
            FROM complaints c
            JOIN reservation r ON c.reservation_id = r.reservation_id
            JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
            JOIN crop cr ON rc.crop_id = cr.crop_id
            JOIN farmer f ON cr.farmer_id = f.farmer_id
            JOIN buyer b ON c.buyer_id = b.buyer_id
            JOIN user u_buyer ON b.user_id = u_buyer.user_id
            WHERE f.user_id = ? AND c.status = 'submitted'
            ORDER BY c.created_at DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $complaints = [];
        foreach ($rows as $row) {
            $complaints[] = [
                "complaint_id" => intval($row['complaint_id']),
                "reservation_id" => intval($row['reservation_id']),
                "order_number" => "ORD" . $row['reservation_id'],
                "crop_name" => $row['crop_name'],
                "reason" => $row['reason'],
                "description" => $row['description'],
                "evidence_file" => $row['evidence_file'],
                "status" => $row['status'],
                "buyer_name" => $row['buyer_name'],
                "buyer_email" => $row['buyer_email'],
                "created_at" => $row['created_at']
            ];
        }

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "data" => $complaints
        ]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $e->getMessage()
        ]);
        exit;
    }
}

// Handle POST: Submit response to complaint
// Accept input from $_POST or JSON payload
$complaint_id = isset($_POST['complaint_id']) ? intval($_POST['complaint_id']) : 0;
$response_text = isset($_POST['response_text']) ? trim($_POST['response_text']) : (isset($_POST['response']) ? trim($_POST['response']) : '');

if ($complaint_id <= 0) {
    // If not in $_POST, try JSON body
    $jsonInput = json_decode(file_get_contents('php://input'), true);
    if ($jsonInput) {
        $complaint_id = isset($jsonInput['complaint_id']) ? intval($jsonInput['complaint_id']) : 0;
        if (empty($response_text)) {
            $response_text = isset($jsonInput['response_text']) ? trim($jsonInput['response_text']) : (isset($jsonInput['response']) ? trim($jsonInput['response']) : '');
        }
    }
}

// Validation: Check inputs
if ($complaint_id <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Valid complaint_id is required."
    ]);
    exit;
}

if (empty($response_text) || strlen($response_text) < 10) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Response text is required and must be at least 10 characters long."
    ]);
    exit;
}

try {
    // Security Check 2: Farmer ownership verification
    // Verify that the complaint's crop belongs to the logged-in farmer (via reservation -> reserve_crop -> crop -> farmer)
    $sql = "
        SELECT 
            c.id AS complaint_id,
            c.status,
            c.reservation_id,
            c.buyer_id,
            b.user_id AS buyer_user_id,
            cr.crop_name
        FROM complaints c
        JOIN reservation r ON c.reservation_id = r.reservation_id
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop cr ON rc.crop_id = cr.crop_id
        JOIN farmer f ON cr.farmer_id = f.farmer_id
        JOIN buyer b ON c.buyer_id = b.buyer_id
        WHERE c.id = ? AND f.user_id = ?
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$complaint_id, $user_id]);
    $complaint = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$complaint) {
        // Forbidden / Ownership mismatch
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "error" => "Forbidden: You do not have permission to respond to this complaint or complaint does not exist."
        ]);
        exit;
    }

    // Validate status: complaint must be in 'submitted' status
    if (strtolower($complaint['status']) !== 'submitted') {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Complaint is not in 'submitted' status or has already been responded to."
        ]);
        exit;
    }

    // Evidence file handling
    $farmer_evidence_path = null;
    if (isset($_FILES['evidence']) && $_FILES['evidence']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['evidence'];
        $max_size = 5 * 1024 * 1024; // 5MB
        
        if ($file['size'] > $max_size) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "error" => "Evidence file size exceeds the maximum limit of 5MB."
            ]);
            exit;
        }

        $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed_exts = ['jpg', 'jpeg', 'png', 'pdf'];

        if (!in_array($file_ext, $allowed_exts, true)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "error" => "Invalid file type. Allowed formats: JPG, PNG, PDF."
            ]);
            exit;
        }

        $upload_dir = __DIR__ . '/uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        $new_filename = 'farmer_ev_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;
        $target_path = $upload_dir . $new_filename;

        if (move_uploaded_file($file['tmp_name'], $target_path)) {
            $farmer_evidence_path = 'backend/uploads/' . $new_filename;
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "error" => "Failed to upload evidence file."
            ]);
            exit;
        }
    }

    // Update database row
    $updateSql = "
        UPDATE complaints 
        SET farmer_response = ?, 
            farmer_evidence_file = ?, 
            farmer_responded_at = NOW(), 
            status = 'farmer_responded' 
        WHERE id = ?
    ";
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute([$response_text, $farmer_evidence_path, $complaint_id]);

    // Send notification to buyer
    require_once __DIR__ . '/create_notification.php';
    $buyer_user_id = $complaint['buyer_user_id'];
    $reservation_id = $complaint['reservation_id'];
    $crop_name = $complaint['crop_name'];
    
    $notif_title = "Farmer Responded to Dispute";
    $notif_msg = "The farmer has submitted a response for Order #{$reservation_id} ({$crop_name}).";
    $notif_data = json_encode([
        "complaint_id" => $complaint_id, 
        "complaintId" => $complaint_id,
        "reservation_id" => $reservation_id,
        "orderId" => $reservation_id,
        "cropName" => $crop_name,
        "link" => "/buyer/complaints?tab=farmer_response&id=" . $complaint_id
    ]);

    create_notification($buyer_user_id, $notif_title, $notif_msg, 'farmerResponded', $notif_data);

    // Return success JSON
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "complaint_id" => $complaint_id,
        "status" => "farmer_responded",
        "message" => "Farmer response submitted successfully."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database error: " . $e->getMessage()
    ]);
}
