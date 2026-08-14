<?php
require_once __DIR__ . '/../backend/connection/db.php';

echo "=== COMPLAINTS TABLE SCHEMA ===\n";
$stmt = $pdo->query("DESCRIBE complaints");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo sprintf("%-25s %-25s %-10s %-10s\n", $r['Field'], $r['Type'], $r['Null'], $r['Key']);
}

echo "\n=== ALL COMPLAINTS ===\n";
$stmt = $pdo->query("SELECT id, reservation_id, status, resolution_action, admin_notes, resolved_at FROM complaints");
$complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($complaints);

echo "\n=== TEST JOIN QUERY ON COMPLAINT 1, 2, 3 ===\n";
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
echo "\n=== BUYERS AND USERS ===\n";
$stmt = $pdo->query("SELECT u.user_id, u.name, u.email, u.role, b.buyer_id FROM user u LEFT JOIN buyer b ON u.user_id = b.user_id");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));


