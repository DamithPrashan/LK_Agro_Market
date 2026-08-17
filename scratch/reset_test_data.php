<?php
require_once __DIR__ . '/../backend/connection/db.php';

// Prepare test data:
// Complaint 1: farmer_responded (Ready to test 'Resolve - Refund')
// Complaint 2: farmer_responded (Ready to test 'Resolve - Re-delivery' or 'Dismiss Complaint')
// Complaint 3: rejected (Ready to test 'Already Resolved / Dismissed' protection)
$pdo->exec("UPDATE complaints SET status = 'farmer_responded', resolution_action = NULL, admin_notes = NULL, resolved_at = NULL WHERE id IN (1, 2)");
$pdo->exec("UPDATE complaints SET status = 'rejected', resolution_action = 'dismiss', admin_notes = 'Dismissed test notes', resolved_at = NOW() WHERE id = 3");

echo "Test complaints prepared successfully.\n";
