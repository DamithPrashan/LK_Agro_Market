<?php
require_once __DIR__ . '/../backend/connection/db.php';

echo "=======================================================\n";
echo "    TESTING ADMIN COMPLAINT RESOLUTION FLOW\n";
echo "=======================================================\n\n";

// 1. Get Admin User
$adminUser = $pdo->query("SELECT * FROM user WHERE role = 'admin' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if (!$adminUser) {
    die("No admin user found in database!\n");
}
echo "Found Admin: {$adminUser['name']} ({$adminUser['email']})\n\n";

$sessId = 'admintest' . rand(10000, 99999);

file_put_contents(__DIR__ . '/seed_session.php', "<?php
session_id('{$sessId}');
session_start();
\$_SESSION['user'] = [
    'id' => {$adminUser['user_id']},
    'name' => '{$adminUser['name']}',
    'email' => '{$adminUser['email']}',
    'role' => 'admin'
];
session_write_close();
echo json_encode(['success' => true, 'session_id' => session_id()]);
");

// Initialize cookie session by calling seed_session.php via curl
$ch = curl_init("http://127.0.0.1:8000/scratch/seed_session.php");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIE, "PHPSESSID={$sessId}");
$initRes = curl_exec($ch);
curl_close($ch);
echo "Session seed result: " . $initRes . "\n\n";

function httpPostWithSess($url, $data, $sessId) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_COOKIE, "PHPSESSID={$sessId}");
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $httpCode, 'data' => json_decode($response, true), 'raw' => $response];
}

// Reset complaints state for test
$pdo->exec("UPDATE complaints SET status = 'farmer_responded', resolution_action = NULL, admin_notes = NULL, resolved_at = NULL WHERE id IN (1, 2)");
$pdo->exec("UPDATE complaints SET status = 'rejected', resolution_action = 'dismiss', admin_notes = 'Dismissed test notes', resolved_at = NOW() WHERE id = 3");

echo "--- TEST 1: Status Guard on Already Rejected Complaint #3 ---\n";
$res1 = httpPostWithSess("http://127.0.0.1:8000/backend/resolve_complaint.php", [
    "complaint_id" => 3,
    "action" => "refund",
    "admin_notes" => "Trying to refund already rejected complaint"
], $sessId);
echo "HTTP Status: " . $res1['code'] . "\n";
echo "Response: " . $res1['raw'] . "\n";
if ($res1['code'] === 400 && strpos($res1['raw'], 'already') !== false) {
    echo "✅ TEST 1 PASSED: Status guard successfully caught already resolved/rejected complaint!\n\n";
} else {
    echo "❌ TEST 1 FAILED!\n\n";
}

echo "--- TEST 2: Validation on Empty Admin Notes ---\n";
$res2 = httpPostWithSess("http://127.0.0.1:8000/backend/resolve_complaint.php", [
    "complaint_id" => 1,
    "action" => "refund",
    "admin_notes" => ""
], $sessId);
echo "HTTP Status: " . $res2['code'] . "\n";
echo "Response: " . $res2['raw'] . "\n";
if ($res2['code'] === 400 && (strpos($res2['raw'], 'Admin notes cannot be empty') !== false || strpos($res2['raw'], 'admin_notes cannot be empty') !== false)) {
    echo "✅ TEST 2 PASSED: Empty admin notes rejected with clear error!\n\n";
} else {
    echo "❌ TEST 2 FAILED!\n\n";
}

echo "--- TEST 3: Resolve - Refund on Complaint #1 ---\n";
$res3 = httpPostWithSess("http://127.0.0.1:8000/backend/resolve_complaint.php", [
    "complaint_id" => 1,
    "action" => "refund",
    "admin_notes" => "Approved 100% refund due to damaged crop shipment."
], $sessId);
echo "HTTP Status: " . $res3['code'] . "\n";
echo "Response: " . $res3['raw'] . "\n";
$row1 = $pdo->query("SELECT id, status, resolution_action, admin_notes, resolved_at FROM complaints WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
echo "DB State: " . json_encode($row1) . "\n";
if ($res3['code'] === 200 && $row1['status'] === 'resolved' && $row1['resolution_action'] === 'refund' && !empty($row1['resolved_at'])) {
    echo "✅ TEST 3 PASSED: Complaint #1 resolved with refund action and timestamp!\n\n";
} else {
    echo "❌ TEST 3 FAILED!\n\n";
}

echo "--- TEST 4: Status Guard on Now-Resolved Complaint #1 ---\n";
$res4 = httpPostWithSess("http://127.0.0.1:8000/backend/resolve_complaint.php", [
    "complaint_id" => 1,
    "action" => "refund",
    "admin_notes" => "Attempting to resolve again"
], $sessId);
echo "HTTP Status: " . $res4['code'] . "\n";
echo "Response: " . $res4['raw'] . "\n";
if ($res4['code'] === 400 && strpos($res4['raw'], 'already') !== false) {
    echo "✅ TEST 4 PASSED: Re-resolution blocked with clear message!\n\n";
} else {
    echo "❌ TEST 4 FAILED!\n\n";
}

echo "--- TEST 5: Resolve - Re-delivery on Complaint #2 ---\n";
$res5 = httpPostWithSess("http://127.0.0.1:8000/backend/resolve_complaint.php", [
    "complaint_id" => 2,
    "action" => "re-delivery",
    "admin_notes" => "Farmer agreed to ship replacement batch of carrots."
], $sessId);
echo "HTTP Status: " . $res5['code'] . "\n";
echo "Response: " . $res5['raw'] . "\n";
$row2 = $pdo->query("SELECT id, status, resolution_action, admin_notes, resolved_at FROM complaints WHERE id = 2")->fetch(PDO::FETCH_ASSOC);
echo "DB State: " . json_encode($row2) . "\n";
if ($res5['code'] === 200 && $row2['status'] === 'resolved' && $row2['resolution_action'] === 're-delivery') {
    echo "✅ TEST 5 PASSED: Complaint #2 resolved with re-delivery action!\n\n";
} else {
    echo "❌ TEST 5 FAILED!\n\n";
}

echo "--- TEST 6: Dismiss Complaint on Reset Complaint #2 ---\n";
$pdo->exec("UPDATE complaints SET status = 'farmer_responded', resolution_action = NULL, admin_notes = NULL, resolved_at = NULL WHERE id = 2");
$res6 = httpPostWithSess("http://127.0.0.1:8000/backend/resolve_complaint.php", [
    "complaint_id" => 2,
    "action" => "dismiss",
    "admin_notes" => "Complaint dismissed due to lack of evidence from buyer."
], $sessId);
echo "HTTP Status: " . $res6['code'] . "\n";
echo "Response: " . $res6['raw'] . "\n";
$row2Dismiss = $pdo->query("SELECT id, status, resolution_action, admin_notes, resolved_at FROM complaints WHERE id = 2")->fetch(PDO::FETCH_ASSOC);
echo "DB State: " . json_encode($row2Dismiss) . "\n";
if ($res6['code'] === 200 && $row2Dismiss['status'] === 'rejected' && $row2Dismiss['resolution_action'] === 'dismiss') {
    echo "✅ TEST 6 PASSED: Complaint #2 dismissed with rejected status and dismiss action!\n\n";
} else {
    echo "❌ TEST 6 FAILED!\n\n";
}


// Clean up
@unlink(__DIR__ . '/seed_session.php');
echo "=== ALL VERIFICATION TESTS FINISHED ===\n";
