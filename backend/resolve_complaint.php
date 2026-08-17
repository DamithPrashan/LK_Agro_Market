<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once __DIR__ . '/connection/db.php';
require_once __DIR__ . '/Apis/auth_check.php';
require_once __DIR__ . '/Apis/admin/calendar/logAdminActivity.php';

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
        $resolution_status = 'dismissed';
    } elseif (in_array($action_lower, ['request_farmer_response', 'inform_farmer'], true)) {
        $resolution_status = 'awaiting_farmer_response';
    }
}

// Normalize status
$resolution_status = strtolower($resolution_status);
$allowed_statuses = ['dismissed', 'awaiting_farmer_response'];

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
        "message" => "Choose either Dismiss Complaint or Request Farmer Response.",
        "error" => "Invalid complaint action."
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

    if ($resolution_status === 'awaiting_farmer_response' && $current_status !== 'submitted') {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "A farmer response has already been requested for this complaint."
        ]);
        exit;
    }

    // Update complaint record
    $updateSql = "
        UPDATE complaints 
        SET status = ?,
            resolution_action = ?,
            admin_notes = ?,
            resolved_at = CASE WHEN ? = 'dismissed' THEN NOW() ELSE NULL END,
            farmer_response_requested_at = CASE WHEN ? = 'awaiting_farmer_response' THEN NOW() ELSE NULL END,
            farmer_response_deadline = CASE WHEN ? = 'awaiting_farmer_response' THEN DATE_ADD(NOW(), INTERVAL 48 HOUR) ELSE NULL END
        WHERE id = ?
    ";
    $updateStmt = $pdo->prepare($updateSql);
    $isFarmerRequest = $resolution_status === 'awaiting_farmer_response';
    $updateStmt->execute([$resolution_status, $resolution_action, $admin_notes, $resolution_status, $resolution_status, $resolution_status, $complaint_id]);
    $deadline = null;
    if ($isFarmerRequest) {
        $deadlineStmt = $pdo->prepare("SELECT farmer_response_deadline FROM complaints WHERE id = ?");
        $deadlineStmt->execute([$complaint_id]);
        $deadline = $deadlineStmt->fetchColumn();
    }

    // Send notifications to buyer and farmer
    require_once __DIR__ . '/create_notification.php';
    
    $reservation_id = $complaint['reservation_id'];
    $crop_name = $complaint['crop_name'];
    $notif_title = $isFarmerRequest ? "Action Required: Complaint for Order #{$reservation_id}" : "Complaint Dismissed: Order #{$reservation_id}";

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
        "deadline" => $deadline,
        "link" => "/farmer/complaints"
    ]);

    $buyer_msg = $isFarmerRequest
        ? "The farmer has been asked to respond to your complaint for Order #{$reservation_id} ({$crop_name})."
        : "Your complaint for Order #{$reservation_id} ({$crop_name}) was dismissed after review. Notes: {$admin_notes}";
    $farmer_msg = $isFarmerRequest
        ? "You must respond to the complaint for Order #{$reservation_id} ({$crop_name}) within 48 hours. {$admin_notes} Failure to respond may lead to further account action. Your account will not be changed automatically when the deadline expires."
        : "The complaint for Order #{$reservation_id} ({$crop_name}) was dismissed. Notes: {$admin_notes}";

    if ($isFarmerRequest) {
        create_notification($complaint['farmer_user_id'], $notif_title, $farmer_msg, 'farmerResponseRequested', $farmer_notif_data);
    } else {
        create_notification($complaint['buyer_user_id'], $notif_title, $buyer_msg, 'complaintDismissed', $buyer_notif_data);
    }

    $adminStmt = $pdo->prepare("SELECT admin_id FROM admin WHERE user_id = ? LIMIT 1");
    $adminStmt->execute([$_SESSION['user']['id']]);
    $adminId = $adminStmt->fetchColumn() ?: null;
    logAdminActivity(
        $pdo,
        $isFarmerRequest ? 'farmer_response_requested' : 'complaint_dismissed',
        $isFarmerRequest ? 'Farmer response requested' : 'Complaint dismissed',
        $isFarmerRequest
            ? "A 48-hour farmer response deadline was set for order #{$reservation_id}."
            : "Complaint for order #{$reservation_id} was dismissed. {$admin_notes}",
        $complaint_id,
        $adminId
    );

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "complaint_id" => $complaint_id,
        "status" => $resolution_status,
        "message" => $isFarmerRequest ? "The farmer was notified and asked to respond." : "Complaint dismissed successfully."
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
