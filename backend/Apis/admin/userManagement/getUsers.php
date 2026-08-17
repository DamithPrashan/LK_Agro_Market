<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';
require_role('admin');

try {
    $sql = "
        SELECT u.user_id, u.name, u.email, u.role, u.location, u.created_at, u.profile_image,
               COUNT(DISTINCT CASE WHEN co.status = 'awaiting_farmer_response' THEN co.id END) AS active_complaint_count,
               MIN(CASE WHEN co.status = 'awaiting_farmer_response' THEN co.farmer_response_deadline END) AS nearest_response_deadline,
               COUNT(DISTINCT CASE WHEN co.status = 'awaiting_farmer_response' AND co.farmer_response_deadline <= NOW() THEN co.id END) AS overdue_complaint_count
        FROM user u
        LEFT JOIN farmer f ON u.role = 'farmer' AND f.user_id = u.user_id
        LEFT JOIN crop cr ON cr.farmer_id = f.farmer_id
        LEFT JOIN reserve_crop rc ON rc.crop_id = cr.crop_id
        LEFT JOIN reservation r ON r.reserve_crop_id = rc.reserve_crop_id
        LEFT JOIN complaints co ON co.reservation_id = r.reservation_id
        GROUP BY u.user_id, u.name, u.email, u.role, u.location, u.created_at, u.profile_image
    ";
    $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

    $priorityRank = ['overdue' => 0, 'urgent' => 1, 'attention' => 2, 'normal' => 3];
    $users = array_map(function ($row) {
        $activeCount = (int) $row['active_complaint_count'];
        $overdueCount = (int) $row['overdue_complaint_count'];
        $deadline = $row['nearest_response_deadline'];
        if ($overdueCount > 0) $priority = 'overdue';
        elseif ($activeCount > 0 && $deadline && strtotime($deadline) <= time() + 24 * 3600) $priority = 'urgent';
        elseif ($activeCount > 0) $priority = 'attention';
        else $priority = 'normal';

        return [
            'user_id' => (int) $row['user_id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'role' => $row['role'],
            'district' => $row['location'],
            'created_at' => $row['created_at'],
            'profile_image' => $row['profile_image'],
            'status' => 'active',
            'priority' => $priority,
            'active_complaint_count' => $activeCount,
            'nearest_response_deadline' => $deadline,
            'overdue_complaint_count' => $overdueCount
        ];
    }, $rows);

    usort($users, function ($a, $b) use ($priorityRank) {
        $rank = $priorityRank[$a['priority']] <=> $priorityRank[$b['priority']];
        if ($rank !== 0) return $rank;
        $aDeadline = $a['nearest_response_deadline'] ? strtotime($a['nearest_response_deadline']) : PHP_INT_MAX;
        $bDeadline = $b['nearest_response_deadline'] ? strtotime($b['nearest_response_deadline']) : PHP_INT_MAX;
        if ($aDeadline !== $bDeadline) return $aDeadline <=> $bDeadline;
        return $b['user_id'] <=> $a['user_id'];
    });

    echo json_encode(['success' => true, 'users' => $users, 'count' => count($users)]);
} catch (PDOException $error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $error->getMessage()]);
}
