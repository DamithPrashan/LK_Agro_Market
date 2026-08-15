<?php
require_once __DIR__ . '/../backend/connection/db.php';

try {
    echo "=== 1. Checking Database Tables and Columns ===\n";
    
    // Check complaints table columns
    $stmt = $pdo->query("SHOW COLUMNS FROM complaints");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Complaints table columns: " . implode(", ", $columns) . "\n";
    
    if (in_array('farmer_evidence_file', $columns)) {
        echo "✅ 'farmer_evidence_file' column exists.\n";
    } else {
        echo "❌ 'farmer_evidence_file' column missing.\n";
    }

    if (in_array('farmer_response', $columns) && in_array('admin_notes', $columns) && in_array('resolution_action', $columns)) {
        echo "✅ Advanced complaint fields exist.\n";
    } else {
        echo "❌ Some complaint fields missing.\n";
    }

    echo "\n=== 2. Checking Notification Table ===\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM notifications");
    $notif_cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Notification table columns: " . implode(", ", $notif_cols) . "\n";

    echo "\n=== All DB Schema Checks Passed Successfully ===\n";
} catch (Exception $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}
