<?php
// resolve_complaint.php
//
// Admin sets the final outcome for a complaint. Uses your actual enum
// values from the `complaint` table: 'resolved' or 'rejected'
// (NOT the invented "Escalated"/"Dismissed" from an earlier draft — these
// match complaint_status ENUM('pending','under_review','resolved','rejected')
// after running migration_add_farmer_response.sql).
//
// ⚠️ Same $_SESSION assumption as get_complaints.php.
//
// Expected request body (JSON):
//   { "complaint_id": 19, "resolution_status": "resolved", "resolution_notes": "Refund issued to buyer." }

header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/db_connect.php'; // <-- adjust path to match your actual DB connection file

if (!isset($_SESSION['user_id']) || ($_SESSION['user_role'] ?? '') !== 'admin') {
    echo json_encode([
        "success" => false,
        "message" => "Not authenticated as admin."
    ]);
    exit;
}

$sessionUserId = $_SESSION['user_id'];

$input = json_decode(file_get_contents("php://input"), true);
$complaintId = isset($input['complaint_id']) ? (int) $input['complaint_id'] : null;
$resolutionStatus = isset($input['resolution_status']) ? trim($input['resolution_status']) : '';
$resolutionNotes = isset($input['resolution_notes']) ? trim($input['resolution_notes']) : '';

// Matches the complaint_status ENUM exactly — see migration file
$validStatuses = ['resolved', 'rejected'];

if (!$complaintId || !in_array($resolutionStatus, $validStatuses, true)) {
    echo json_encode([
        "success" => false,
        "message" => "Valid complaint_id and resolution_status (" .
            implode(', ', $validStatuses) . ") are required."
    ]);
    exit;
}

try {
    // complaint.admin_id references admin.admin_id (NOT the raw user_id) —
    // confirmed via the fk_comp_admin foreign key constraint in your schema.
    // So we resolve the logged-in admin's own admin_id first.
    $adminLookup = $conn->prepare("SELECT admin_id FROM admin WHERE user_id = ? LIMIT 1");
    $adminLookup->bind_param("i", $sessionUserId);
    $adminLookup->execute();
    $adminRow = $adminLookup->get_result()->fetch_assoc();
    $adminLookup->close();

    if (!$adminRow) {
        echo json_encode([
            "success" => false,
            "message" => "No admin record found for this user."
        ]);
        exit;
    }

    $adminId = $adminRow['admin_id'];

    $sql = "UPDATE complaint
            SET complaint_status = ?,
                resolution = ?,
                admin_id = ?
            WHERE complaint_id = ?";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Query preparation failed: " . $conn->error);
    }

    $stmt->bind_param("ssii", $resolutionStatus, $resolutionNotes, $adminId, $complaintId);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Complaint marked as \"$resolutionStatus\"."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Complaint not found or nothing changed."
        ]);
    }

    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error resolving complaint: " . $e->getMessage()
    ]);
}

$conn->close();