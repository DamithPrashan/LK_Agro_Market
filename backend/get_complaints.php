<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once __DIR__ . '/connection/db.php';
require_once __DIR__ . '/Apis/auth_check.php';

// Security Check: Enforce logged-in admin access
require_role('admin');

// Retrieve query parameters
$status = isset($_GET['status']) ? trim($_GET['status']) : null;
$farmer_id = isset($_GET['farmer_id']) ? intval($_GET['farmer_id']) : null;
$buyer_id = isset($_GET['buyer_id']) ? intval($_GET['buyer_id']) : null;
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;

$offset = ($page - 1) * $limit;

try {
    $where = ["1=1"];
    $params = [];

    if (!empty($status)) {
        $where[] = "c.status = ?";
        $params[] = $status;
    }

    if ($farmer_id !== null && $farmer_id > 0) {
        $where[] = "f.farmer_id = ?";
        $params[] = $farmer_id;
    }

    if ($buyer_id !== null && $buyer_id > 0) {
        $where[] = "b.buyer_id = ?";
        $params[] = $buyer_id;
    }

    $whereSql = implode(" AND ", $where);

    // 1. Get total count for pagination
    $countSql = "
        SELECT COUNT(*) AS total
        FROM complaints c
        JOIN buyer b ON c.buyer_id = b.buyer_id
        JOIN reservation r ON c.reservation_id = r.reservation_id
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop cr ON rc.crop_id = cr.crop_id
        JOIN farmer f ON cr.farmer_id = f.farmer_id
        WHERE {$whereSql}
    ";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = intval($countStmt->fetchColumn());

    // 2. Fetch paginated records
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
            c.farmer_response_requested_at,
            c.farmer_response_deadline,
            c.farmer_responded_at,
            c.resolved_at,
            c.created_at,
            b.user_id AS buyer_user_id,
            u_buyer.name AS buyer_name,
            u_buyer.email AS buyer_email,
            f.farmer_id,
            f.user_id AS farmer_user_id,
            u_farmer.name AS farmer_name,
            u_farmer.email AS farmer_email,
            cr.crop_id,
            cr.crop_name
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
        LIMIT {$limit} OFFSET {$offset}
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $data = [];
    foreach ($rows as $row) {
        $reasonText = strtolower($row['reason'] . ' ' . $row['description']);
        if (preg_match('/payment|refund|money|charge|paid/', $reasonText)) {
            $category = 'payment_issue';
            $priorityScore = 6;
        } elseif (preg_match('/short|weight|quantity|incomplete|missing|not.*deliver/', $reasonText)) {
            $category = 'incomplete_order';
            $priorityScore = 6;
        } elseif (preg_match('/fake|fraud|scam|false listing/', $reasonText)) {
            $category = 'fake_listing';
            $priorityScore = 5;
        } elseif (preg_match('/quality|damaged|spoiled|rotten/', $reasonText)) {
            $category = 'quality_issue';
            $priorityScore = 4;
        } elseif (preg_match('/delivery|collection|pickup|late arrival/', $reasonText)) {
            $category = 'delivery_issue';
            $priorityScore = 3;
        } elseif (preg_match('/system|website|app|technical|error/', $reasonText)) {
            $category = 'system_issue';
            $priorityScore = 2;
        } else {
            $category = 'other';
            $priorityScore = 1;
        }

        $ageHours = max(0, (time() - strtotime($row['created_at'])) / 3600);
        $priorityScore += min(5, (int) floor($ageHours / 24));
        $rawStatus = strtolower($row['status']);
        $displayStatus = in_array($rawStatus, ['submitted', 'awaiting_farmer_response'], true) ? 'open' : $rawStatus;
        $deadlineRemainingHours = null;
        $isOverdue = false;
        if ($rawStatus === 'awaiting_farmer_response' && !empty($row['farmer_response_deadline'])) {
            $deadlineRemainingHours = (strtotime($row['farmer_response_deadline']) - time()) / 3600;
            $isOverdue = $deadlineRemainingHours < 0;
            if ($isOverdue) $priorityScore += 5;
            elseif ($deadlineRemainingHours < 6) $priorityScore += 3;
            elseif ($deadlineRemainingHours < 12) $priorityScore += 2;
            elseif ($deadlineRemainingHours <= 24) $priorityScore += 1;
        }
        $priority = $priorityScore >= 11 ? 'critical' : ($priorityScore >= 8 ? 'high' : ($priorityScore >= 5 ? 'medium' : 'normal'));

        $data[] = [
            "complaint_id" => intval($row['complaint_id']),
            "reservation_id" => intval($row['reservation_id']),
            "order_number" => "ORD" . $row['reservation_id'],
            "buyer_id" => intval($row['buyer_id']),
            "buyer_name" => $row['buyer_name'],
            "buyer_email" => $row['buyer_email'],
            "farmer_id" => intval($row['farmer_id']),
            "farmer_name" => $row['farmer_name'],
            "farmer_email" => $row['farmer_email'],
            "crop_id" => intval($row['crop_id']),
            "crop_name" => $row['crop_name'],
            "reason" => $row['reason'],
            "description" => $row['description'],
            "evidence_file" => $row['evidence_file'],
            "farmer_evidence_file" => $row['farmer_evidence_file'],
            "status" => $displayStatus,
            "workflow_status" => $rawStatus,
            "category" => $category,
            "priority" => $priority,
            "priority_score" => $priorityScore,
            "age_hours" => round($ageHours, 1),
            "farmer_response_requested_at" => $row['farmer_response_requested_at'],
            "farmer_response_deadline" => $row['farmer_response_deadline'],
            "deadline_remaining_hours" => $deadlineRemainingHours === null ? null : round($deadlineRemainingHours, 1),
            "is_overdue" => $isOverdue,
            "farmer_response" => $row['farmer_response'],
            "admin_notes" => $row['admin_notes'],
            "resolution_action" => $row['resolution_action'],
            "farmer_responded_at" => $row['farmer_responded_at'],
            "resolved_at" => $row['resolved_at'],
            "created_at" => $row['created_at']
        ];
    }

    usort($data, function ($a, $b) {
        if ($a['status'] === 'open' && $b['status'] !== 'open') return -1;
        if ($a['status'] !== 'open' && $b['status'] === 'open') return 1;
        $priorityComparison = $b['priority_score'] <=> $a['priority_score'];
        return $priorityComparison !== 0 ? $priorityComparison : strtotime($a['created_at']) <=> strtotime($b['created_at']);
    });

    $weekStart = date('Y-m-d 00:00:00', strtotime('monday this week'));
    $statsStmt = $pdo->prepare("SELECT
        SUM(CASE WHEN created_at >= ? AND created_at <= NOW() THEN 1 ELSE 0 END) AS opened,
        SUM(CASE WHEN resolved_at >= ? AND status = 'resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN resolved_at >= ? AND status = 'dismissed' THEN 1 ELSE 0 END) AS dismissed
        FROM complaints");
    $statsStmt->execute([$weekStart, $weekStart, $weekStart]);
    $weekly = $statsStmt->fetch(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => $data,
        "total" => $total,
        "page" => $page,
        "limit" => $limit
        ,"weekly_stats" => [
            "open" => (int) ($weekly['opened'] ?? 0),
            "resolved" => (int) ($weekly['resolved'] ?? 0),
            "dismissed" => (int) ($weekly['dismissed'] ?? 0)
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database error: " . $e->getMessage()
    ]);
}
