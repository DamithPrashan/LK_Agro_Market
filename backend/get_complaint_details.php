<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in as admin
require_role('admin');

$complaintId = isset($_GET['complaint_id']) ? intval($_GET['complaint_id']) : 0;

if ($complaintId <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid complaint ID format."
    ]);
    exit;
}

try {
    $sql = "
        SELECT 
            c.id as complaint_id,
            c.reservation_id,
            c.reason,
            c.description,
            c.evidence_file,
            c.status as db_status,
            c.farmer_response,
            c.admin_notes,
            c.resolution_action,
            c.farmer_responded_at,
            c.resolved_at,
            c.created_at,
            u_buyer.name as buyer_name,
            u_buyer.email as buyer_email,
            u_farmer.name as farmer_name,
            u_farmer.email as farmer_email,
            cr.crop_name
        FROM complaints c
        JOIN buyer b ON c.buyer_id = b.buyer_id
        JOIN user u_buyer ON b.user_id = u_buyer.user_id
        JOIN reservation r ON c.reservation_id = r.reservation_id
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop cr ON rc.crop_id = cr.crop_id
        JOIN farmer f ON cr.farmer_id = f.farmer_id
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        WHERE c.id = ?
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$complaintId]);
    $complaint = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$complaint) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Complaint not found."
        ]);
        exit;
    }

    // Determine status for dispute flow stepper
    $statusFlow = 'submitted';
    $db_status = strtolower($complaint['db_status']);
    
    if (in_array($db_status, ['resolved', 'dismissed', 'rejected'])) {
        $statusFlow = 'resolved';
    } elseif (!empty($complaint['farmer_response'])) {
        $statusFlow = 'farmer_responded';
    } elseif ($db_status === 'under_review') {
        $statusFlow = 'under_review';
    } elseif ($db_status === 'admin_notified') {
        $statusFlow = 'admin_notified';
    } else {
        $statusFlow = 'submitted';
    }

    echo json_encode([
        "success" => true,
        "complaint" => [
            "id" => intval($complaint['complaint_id']),
            "orderId" => "ORD" . $complaint['reservation_id'],
            "reservationId" => intval($complaint['reservation_id']),
            "reason" => $complaint['reason'],
            "description" => $complaint['description'],
            "evidenceFile" => $complaint['evidence_file'] ? "/backend/uploads/" . basename($complaint['evidence_file']) : null,
            "evidenceCount" => $complaint['evidence_file'] ? 1 : 0,
            "status" => $statusFlow,
            "dbStatus" => $complaint['db_status'],
            "farmerResponse" => $complaint['farmer_response'],
            "adminNotes" => $complaint['admin_notes'],
            "resolutionAction" => $complaint['resolution_action'],
            "farmerRespondedAt" => $complaint['farmer_responded_at'],
            "resolvedAt" => $complaint['resolved_at'],
            "createdAt" => $complaint['created_at'],
            "buyerName" => $complaint['buyer_name'],
            "buyerEmail" => $complaint['buyer_email'],
            "farmerName" => $complaint['farmer_name'],
            "farmerEmail" => $complaint['farmer_email'],
            "cropName" => $complaint['crop_name']
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
