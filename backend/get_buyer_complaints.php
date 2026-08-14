<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once __DIR__ . '/connection/db.php';
require_once __DIR__ . '/Apis/auth_check.php';

// Security: Require logged in user
require_login();

$user_id = $_SESSION['user']['id'];
$user_role = $_SESSION['user']['role'] ?? '';

// Only buyers (or admins viewing as test) should access this endpoint
if ($user_role !== 'buyer' && $user_role !== 'admin') {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Unauthorized access. Buyer role required."
    ]);
    exit;
}

try {
    // 1. Get buyer_id
    if ($user_role === 'buyer') {
        $buyerStmt = $pdo->prepare("SELECT buyer_id FROM buyer WHERE user_id = ?");
        $buyerStmt->execute([$user_id]);
        $buyer = $buyerStmt->fetch(PDO::FETCH_ASSOC);

        if (!$buyer) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Buyer profile not found for this account."
            ]);
            exit;
        }
        $buyer_id = $buyer['buyer_id'];
    } else {
        // Admin viewing: if buyer_id passed, use it, else return all
        $buyer_id = isset($_GET['buyer_id']) ? intval($_GET['buyer_id']) : null;
    }

    $complaint_id = isset($_GET['complaint_id']) ? intval($_GET['complaint_id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);

    $where = ["1=1"];
    $params = [];

    if ($buyer_id !== null) {
        $where[] = "c.buyer_id = ?";
        $params[] = $buyer_id;
    }

    if ($complaint_id > 0) {
        $where[] = "c.id = ?";
        $params[] = $complaint_id;
    }

    $whereSql = implode(" AND ", $where);

    $sql = "
        SELECT 
            c.id AS complaint_id,
            c.reservation_id,
            c.buyer_id,
            c.reason,
            c.description,
            c.evidence_file,
            c.farmer_evidence_file,
            c.status,
            c.farmer_response,
            c.admin_notes,
            c.resolution_action,
            c.farmer_responded_at,
            c.resolved_at,
            c.created_at,
            u_buyer.name AS buyer_name,
            u_buyer.email AS buyer_email,
            f.farmer_id,
            u_farmer.name AS farmer_name,
            u_farmer.email AS farmer_email,
            cr.crop_name,
            cr.crop_id
        FROM complaints c
        JOIN buyer b ON c.buyer_id = b.buyer_id
        JOIN user u_buyer ON b.user_id = u_buyer.user_id
        JOIN reservation r ON c.reservation_id = r.reservation_id
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop cr ON rc.crop_id = cr.crop_id
        JOIN farmer f ON cr.farmer_id = f.farmer_id
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        WHERE {$whereSql}
        ORDER BY c.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $complaints = [];
    foreach ($rows as $row) {
        // Normalize evidence URLs
        $evidenceUrl = null;
        if (!empty($row['evidence_file'])) {
            $evidenceUrl = str_starts_with($row['evidence_file'], '/') || str_starts_with($row['evidence_file'], 'http')
                ? $row['evidence_file'] 
                : '/' . $row['evidence_file'];
        }

        $farmerEvidenceUrl = null;
        if (!empty($row['farmer_evidence_file'])) {
            $farmerEvidenceUrl = str_starts_with($row['farmer_evidence_file'], '/') || str_starts_with($row['farmer_evidence_file'], 'http')
                ? $row['farmer_evidence_file'] 
                : '/' . $row['farmer_evidence_file'];
        }

        $complaints[] = [
            "id" => intval($row['complaint_id']),
            "complaint_id" => intval($row['complaint_id']),
            "reservation_id" => intval($row['reservation_id']),
            "order_number" => "ORD" . $row['reservation_id'],
            "crop_name" => $row['crop_name'],
            "crop_id" => intval($row['crop_id']),
            "buyer_name" => $row['buyer_name'],
            "buyer_email" => $row['buyer_email'],
            "farmer_name" => $row['farmer_name'],
            "farmer_email" => $row['farmer_email'],
            "reason" => $row['reason'],
            "description" => $row['description'],
            "evidence_file" => $evidenceUrl,
            "farmer_evidence_file" => $farmerEvidenceUrl,
            "status" => $row['status'],
            "farmer_response" => $row['farmer_response'],
            "farmer_responded_at" => $row['farmer_responded_at'],
            "admin_notes" => $row['admin_notes'],
            "resolution_action" => $row['resolution_action'],
            "resolved_at" => $row['resolved_at'],
            "created_at" => $row['created_at']
        ];
    }

    echo json_encode([
        "success" => true,
        "complaints" => $complaints,
        "count" => count($complaints)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
