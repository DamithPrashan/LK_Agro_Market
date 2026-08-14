<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once __DIR__ . '/connection/db.php';
require_once __DIR__ . '/Apis/auth_check.php';

// Security Check: Enforce logged-in admin access
require_role('admin');

// Parse input payload (JSON or POST)
$input = json_decode(file_get_contents("php://input"), true) ?: [];

$complaint_id = isset($_POST['complaint_id']) ? intval($_POST['complaint_id']) : (isset($input['complaint_id']) ? intval($input['complaint_id']) : 0);
$action = isset($_POST['action']) ? trim($_POST['action']) : (isset($input['action']) ? trim($input['action']) : '');
$resolution_action = isset($_POST['resolution_action']) ? trim($_POST['resolution_action']) : (isset($input['resolution_action']) ? trim($input['resolution_action']) : $action);
$resolution_status = isset($_POST['resolution_status']) ? trim($_POST['resolution_status']) : (isset($input['resolution_status']) ? trim($input['resolution_status']) : (isset($input['status']) ? trim($input['status']) : (isset($_POST['status']) ? trim($_POST['status']) : '')));
$admin_notes = isset($_POST['admin_notes']) ? trim($_POST['admin_notes']) : (isset($input['admin_notes']) ? trim($input['admin_notes']) : '');

// If resolution_status is empty, infer it from resolution_action / action
if (empty($resolution_status) && !empty($resolution_action)) {
    $action_lower = strtolower($resolution_action);
    if (in_array($action_lower, ['dismiss', 'dismissed', 'reject', 'rejected'], true)) {
        $resolution_status = 'rejected';
    } elseif (in_array($action_lower, ['refund', 're-delivery', 'redelivery', 'replace', 'resolved'], true)) {
        $resolution_status = 'resolved';
    }
}

// Normalize status
$resolution_status = strtolower($resolution_status);
if ($resolution_status === 'dismissed') {
    $resolution_status = 'rejected';
}

$allowed_statuses = ['resolved', 'rejected'];

// Input Validation
if ($complaint_id <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Valid complaint_id is required.",
        "error" => "Valid complaint_id is required."
    ]);
    exit;
}

if (empty($admin_notes)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Admin notes cannot be empty.",
        "error" => "admin_notes cannot be empty."
    ]);
    exit;
}

if (!in_array($resolution_status, $allowed_statuses, true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid resolution status. Allowed values: 'resolved', 'rejected'.",
        "error" => "Invalid resolution_status. Allowed values: 'resolved', 'rejected'."
    ]);
    exit;
}

try {
    // Check if complaint exists
    $checkSql = "
        SELECT 
            c.id, 
            c.status, 
            c.reservation_id, 
            c.buyer_id, 
            b.user_id AS buyer_user_id,
            f.user_id AS farmer_user_id,
            cr.crop_name
        FROM complaints c
        JOIN buyer b ON c.buyer_id = b.buyer_id
        JOIN reservation r ON c.reservation_id = r.reservation_id
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop cr ON rc.crop_id = cr.crop_id
        JOIN farmer f ON cr.farmer_id = f.farmer_id
        WHERE c.id = ?
    ";
    
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$complaint_id]);
    $complaint = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$complaint) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Complaint not found.",
            "error" => "Complaint not found."
        ]);
        exit;
    }

    // Status Guard: prevent re-resolving or changing an already resolved/rejected complaint
    $current_status = strtolower($complaint['status'] ?? '');
    if (in_array($current_status, ['resolved', 'rejected', 'dismissed'], true)) {
        http_response_code(400);
        $status_label = ($current_status === 'resolved') ? 'resolved' : 'dismissed/rejected';
        echo json_encode([
            "success" => false,
            "message" => "This complaint has already been {$status_label}.",
            "error" => "This complaint has already been {$status_label}."
        ]);
        exit;
    }

    // Update complaint record
    $updateSql = "
        UPDATE complaints 
        SET status = ?, 
            resolution_action = ?, 
            admin_notes = ?, 
            resolved_at = NOW() 
        WHERE id = ?
    ";
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute([$resolution_status, $resolution_action, $admin_notes, $complaint_id]);

    // Send notifications to buyer and farmer
    require_once __DIR__ . '/create_notification.php';
    
    $reservation_id = $complaint['reservation_id'];
    $crop_name = $complaint['crop_name'];
    $notif_title = "Complaint Resolution: Order #{$reservation_id}";

    $buyer_notif_data = json_encode([
        "complaint_id" => $complaint_id, 
        "complaintId" => $complaint_id,
        "reservation_id" => $reservation_id,
        "orderId" => $reservation_id,
        "cropName" => $crop_name,
        "action" => $resolution_action,
        "notes" => $admin_notes,
        "link" => "/buyer/complaints?tab=farmer_response&id=" . $complaint_id
    ]);
    $farmer_notif_data = json_encode([
        "complaint_id" => $complaint_id, 
        "complaintId" => $complaint_id,
        "reservation_id" => $reservation_id,
        "orderId" => $reservation_id,
        "cropName" => $crop_name,
        "action" => $resolution_action,
        "notes" => $admin_notes,
        "link" => "/farmer/complaints"
    ]);

    $buyer_msg = "Your dispute for Order #{$reservation_id} ({$crop_name}) has been {$resolution_status}. Resolution: {$resolution_action}. Notes: {$admin_notes}";
    $farmer_msg = "The dispute for Order #{$reservation_id} ({$crop_name}) has been {$resolution_status}. Resolution: {$resolution_action}. Notes: {$admin_notes}";

    create_notification($complaint['buyer_user_id'], $notif_title, $buyer_msg, 'complaintResolved', $buyer_notif_data);
    create_notification($complaint['farmer_user_id'], $notif_title, $farmer_msg, 'complaintResolved', $farmer_notif_data);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "complaint_id" => $complaint_id,
        "status" => $resolution_status,
        "message" => "Complaint successfully marked as " . ($resolution_status === 'resolved' ? 'Resolved' : 'Dismissed') . "."
    ]);

} catch (PDOException $e) {
    error_log("Resolve complaint error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage(),
        "error" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Resolve complaint error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage(),
        "error" => "Server error: " . $e->getMessage()
    ]);
}
