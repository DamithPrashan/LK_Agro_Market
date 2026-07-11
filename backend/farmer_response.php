<?php
// farmer_respond.php
//
// Farmer submits their written response to a specific complaint. Ownership
// is enforced in the SQL itself (not just the frontend): the UPDATE only
// affects a row if the complaint's crop actually belongs to the logged-in
// farmer, via crop.farmer_id = farmer.farmer_id = (farmer row for this
// session's user_id).
//
// Also only allows responding while complaint_status = 'pending' — once a
// farmer has responded, status moves to 'under_review' and this endpoint
// will no longer update it (prevents overwriting a response after the
// fact). If you want farmers to be able to edit their response before an
// admin resolves it, remove the "AND c.complaint_status = 'pending'" line.
//
// ⚠️ Same $_SESSION assumption as get_complaints.php.
// Run migration_add_farmer_response.sql before using this.
//
// Expected request body (JSON):
//   { "complaint_id": 19, "response": "We re-weighed the batch and..." }

header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/db_connect.php'; // <-- adjust path to match your actual DB connection file

if (!isset($_SESSION['user_id']) || ($_SESSION['user_role'] ?? '') !== 'farmer') {
    echo json_encode([
        "success" => false,
        "message" => "Not authenticated as farmer."
    ]);
    exit;
}

$sessionUserId = $_SESSION['user_id'];

$input = json_decode(file_get_contents("php://input"), true);
$complaintId = isset($input['complaint_id']) ? (int) $input['complaint_id'] : null;
$responseText = isset($input['response']) ? trim($input['response']) : '';

if (!$complaintId || $responseText === '') {
    echo json_encode([
        "success" => false,
        "message" => "Complaint ID and a non-empty response are required."
    ]);
    exit;
}

try {
    $sql = "UPDATE complaint c
            INNER JOIN crop ON c.crop_id = crop.crop_id
            INNER JOIN farmer ON crop.farmer_id = farmer.farmer_id
            SET c.farmer_response = ?,
                c.farmer_responded_at = NOW(),
                c.complaint_status = 'under_review'
            WHERE c.complaint_id = ?
              AND farmer.user_id = ?
              AND c.complaint_status = 'pending'";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Query preparation failed: " . $conn->error);
    }

    $stmt->bind_param("sii", $responseText, $complaintId, $sessionUserId);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Response submitted successfully."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Complaint not found, doesn't belong to you, or has already been responded to."
        ]);
    }

    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error saving response: " . $e->getMessage()
    ]);
}

$conn->close();