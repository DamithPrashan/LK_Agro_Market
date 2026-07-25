<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in as admin
require_role('admin');

// Parse JSON payload or POST values
$input = isset($mockInput) ? $mockInput : json_decode(file_get_contents("php://input"), true);

$complaintId = isset($input['complaint_id']) ? intval($input['complaint_id']) : 0;
$action = isset($input['action']) ? strtolower(trim($input['action'])) : ''; // refund | re-delivery | dismiss
$adminNotes = isset($input['admin_notes']) ? trim($input['admin_notes']) : '';

if ($complaintId <= 0 || !in_array($action, ['refund', 're-delivery', 'dismiss'], true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid complaint ID or resolution action. Allowed actions: refund, re-delivery, dismiss."
    ]);
    exit;
}

try {
    // 1. Check if complaint exists and is not already resolved
    $sqlCheck = "
        SELECT 
            c.id, 
            c.status, 
            c.reservation_id, 
            c.buyer_id, 
            b.user_id as buyer_user_id,
            f.user_id as farmer_user_id,
            cr.crop_name
        FROM complaints c
        JOIN buyer b ON c.buyer_id = b.buyer_id
        JOIN reservation r ON c.reservation_id = r.reservation_id
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop cr ON rc.crop_id = cr.crop_id
        JOIN farmer f ON cr.farmer_id = f.farmer_id
        WHERE c.id = ?
    ";
    $stmtCheck = $pdo->prepare($sqlCheck);
    $stmtCheck->execute([$complaintId]);
    $complaint = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$complaint) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Complaint not found."
        ]);
        exit;
    }

    if (in_array(strtolower($complaint['status']), ['resolved', 'dismissed', 'rejected'], true)) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This complaint has already been resolved and cannot be modified."
        ]);
        exit;
    }

    // Determine final status
    $finalStatus = ($action === 'dismiss') ? 'dismissed' : 'resolved';

    // 2. Update complaint
    $sqlUpdate = "
        UPDATE complaints 
        SET status = ?, 
            admin_notes = ?, 
            resolution_action = ?, 
            resolved_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ";
    $stmtUpdate = $pdo->prepare($sqlUpdate);
    $stmtUpdate->execute([$finalStatus, $adminNotes, $action, $complaintId]);

    // 3. Trigger notifications to both buyer and farmer
    require_once 'create_notification.php';
    $notif_data = json_encode([
        "complaintId" => $complaintId
    ]);

    $title = "Dispute Resolved - Order #{$complaint['reservation_id']}";
    $outcomeMsg = ($action === 'dismiss') ? "dismissed" : "resolved with action: " . strtoupper($action);
    $buyerMsg = "Your complaint for Order #{$complaint['reservation_id']} ({$complaint['crop_name']}) has been resolved. Admin decision: {$outcomeMsg}. Notes: {$adminNotes}";
    $farmerMsg = "The dispute for Order #{$complaint['reservation_id']} ({$complaint['crop_name']}) has been resolved. Admin decision: {$outcomeMsg}. Notes: {$adminNotes}";

    // Notify Buyer
    create_notification($complaint['buyer_user_id'], $title, $buyerMsg, 'complaintResolved', $notif_data);
    
    // Notify Farmer
    create_notification($complaint['farmer_user_id'], $title, $farmerMsg, 'complaintResolved', $notif_data);

    echo json_encode([
        "success" => true,
        "message" => "Complaint successfully resolved with action: " . $action
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
