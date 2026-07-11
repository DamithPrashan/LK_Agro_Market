<?php
// get_complaints.php
//
// Returns complaint records, joined across your real tables:
//   complaint → crop → farmer → user   (who the complaint is about)
//   complaint → reservation → reserve_crop → buyer → user  (who booked it)
//   complaint → user (submitter, via complaint.user_id)
//
// Behavior depends on the logged-in user's role:
//   - admin  : full list (optionally filtered by ?status= or ?complaint_id=)
//   - farmer : only complaints about crops that farmer owns
//              (use ?complaint_id= to fetch a single one, e.g. for the
//              FarmerResponse page)
//   - buyer  : only complaints that buyer personally submitted
//
// ⚠️ ONE ASSUMPTION LEFT: this assumes your login sets
// $_SESSION['user_id'] (matching `user`.`user_id`) and
// $_SESSION['user_role'] (matching `user`.`role`: 'farmer'|'buyer'|'admin').
// Adjust these two lines if your actual session keys differ.
//
// Run migration_add_farmer_response.sql before using this.

header('Content-Type: application/json');
session_start();

require_once __DIR__ . '/db_connect.php'; // <-- adjust path to match your actual DB connection file

if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_role'])) {
    echo json_encode([
        "success" => false,
        "message" => "Not authenticated."
    ]);
    exit;
}

$sessionUserId = $_SESSION['user_id'];
$role = $_SESSION['user_role'];

$statusFilter = isset($_GET['status']) ? trim($_GET['status']) : null;
$complaintIdFilter = isset($_GET['complaint_id']) ? (int) $_GET['complaint_id'] : null;

try {
    $sql = "SELECT
                c.complaint_id,
                c.crop_id,
                c.reservation_id,
                c.user_id            AS submitted_by_user_id,
                submitter.name       AS submitted_by_name,
                submitter.role       AS submitted_by_role,
                c.admin_id,
                c.review_id,
                c.description,
                c.evidence,
                c.complaint_status,
                c.farmer_response,
                c.farmer_responded_at,
                c.resolution,
                c.complaint_date,
                crop.crop_name,
                crop.farmer_id,
                farmer_user.name     AS farmer_name,
                rc.buyer_id,
                buyer_user.name      AS buyer_name
            FROM complaint c
            INNER JOIN user submitter   ON c.user_id = submitter.user_id
            LEFT JOIN crop               ON c.crop_id = crop.crop_id
            LEFT JOIN farmer             ON crop.farmer_id = farmer.farmer_id
            LEFT JOIN user farmer_user   ON farmer.user_id = farmer_user.user_id
            LEFT JOIN reservation res    ON c.reservation_id = res.reservation_id
            LEFT JOIN reserve_crop rc    ON res.reserve_crop_id = rc.reserve_crop_id
            LEFT JOIN buyer               ON rc.buyer_id = buyer.buyer_id
            LEFT JOIN user buyer_user    ON buyer.user_id = buyer_user.user_id
            WHERE 1=1";

    $params = [];
    $types = "";

    if ($role === "farmer") {
        // Only complaints about crops this farmer owns
        $sql .= " AND crop.farmer_id = (SELECT farmer_id FROM farmer WHERE user_id = ? LIMIT 1)";
        $params[] = $sessionUserId;
        $types .= "i";
    } elseif ($role === "buyer") {
        // Only complaints this buyer personally submitted
        $sql .= " AND c.user_id = ?";
        $params[] = $sessionUserId;
        $types .= "i";
    } elseif ($role !== "admin") {
        echo json_encode(["success" => false, "message" => "Unauthorized role."]);
        exit;
    }
    // admin: no extra ownership filter — sees everything

    if ($statusFilter) {
        $sql .= " AND c.complaint_status = ?";
        $params[] = $statusFilter;
        $types .= "s";
    }

    if ($complaintIdFilter) {
        $sql .= " AND c.complaint_id = ?";
        $params[] = $complaintIdFilter;
        $types .= "i";
    }

    $sql .= " ORDER BY c.complaint_date DESC";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Query preparation failed: " . $conn->error);
    }

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $complaints = [];
    while ($row = $result->fetch_assoc()) {
        $complaints[] = $row;
    }

    echo json_encode([
        "success" => true,
        "complaints" => $complaints
    ]);

    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error fetching complaints: " . $e->getMessage()
    ]);
}

$conn->close();