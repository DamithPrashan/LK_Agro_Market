<?php
require_once __DIR__ . '/../backend/connection/db.php';

$stmt = $pdo->query("SELECT id, data FROM notifications WHERE data LIKE '%complaint%'");
$count = 0;
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $d = json_decode($r['data'], true);
    if (is_array($d)) {
        $changed = false;
        if (isset($d['link']) && strpos($d['link'], 'complaint_details.php') !== false) {
            $cid = $d['complaint_id'] ?? '';
            $d['link'] = "/buyer/complaints?tab=farmer_response" . ($cid ? "&id={$cid}" : "");
            $changed = true;
        }
        if ($changed) {
            $u = $pdo->prepare("UPDATE notifications SET data = ? WHERE id = ?");
            $u->execute([json_encode($d), $r['id']]);
            $count++;
        }
    }
}
echo "Migrated {$count} existing notification links.\n";
