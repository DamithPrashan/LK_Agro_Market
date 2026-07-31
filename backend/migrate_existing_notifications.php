<?php
require_once 'connection/db.php';

try {
    $stmt = $pdo->query("SELECT id, title, message FROM notifications WHERE type IS NULL");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $updatedCount = 0;

    foreach ($rows as $row) {
        $id = $row['id'];
        $title = $row['title'];
        $message = $row['message'];

        $type = null;
        $data = [];

        // 1. New Order Received
        // e.g. "buyer1 has placed a new order for 10 kg of carrot."
        if (stripos($title, 'Order Received') !== false && preg_match('/^(.+) has placed a new order for (\d+) kg of (.+)\.$/i', $message, $matches)) {
            $type = 'orderSubmitted';
            $data = [
                'buyerName' => $matches[1],
                'quantity' => intval($matches[2]),
                'cropName' => $matches[3]
            ];
        }
        // 2. Reservation Accepted
        // e.g. "Your order ORD41 for carrot has been accepted. Status: confirmed."
        elseif (stripos($title, 'Accepted') !== false && preg_match('/Your order ORD(\d+) for (.+) has been accepted/i', $message, $matches)) {
            $type = 'orderAccepted';
            $data = [
                'cropName' => $matches[2]
            ];
        }
        // 3. Reservation Declined
        // e.g. "Your order ORD41 for carrot has been declined."
        elseif (stripos($title, 'Declined') !== false && preg_match('/Your order ORD(\d+) for (.+) has been declined/i', $message, $matches)) {
            $type = 'orderDeclined';
            $data = [
                'cropName' => $matches[2]
            ];
        }
        // 4. Payment Confirmed
        // e.g. "Your payment of Rs 1467 for order ORD40 (carrot) has been confirmed."
        elseif (stripos($title, 'Payment Confirmed') !== false && preg_match('/Your payment of Rs (\d+) for order ORD(\d+) \((.+)\) has been confirmed/i', $message, $matches)) {
            $type = 'paymentConfirmed';
            $data = [
                'amount' => intval($matches[1]),
                'orderId' => intval($matches[2])
            ];
        }
        // 5. Payment Received
        // e.g. "Payment of Rs 1467 has been received for order ORD40 (carrot)."
        elseif (stripos($title, 'Payment Received') !== false && preg_match('/Payment of Rs (\d+) has been received for order ORD(\d+) \((.+)\)/i', $message, $matches)) {
            $type = 'paymentReceived';
            $data = [
                'amount' => intval($matches[1]),
                'orderId' => intval($matches[2])
            ];
        }
        // 6. Dispute Submitted / Filed
        // e.g. "A buyer has submitted a complaint for Order #40 (carrot). Reason: ..."
        elseif (stripos($title, 'Dispute Filed') !== false && preg_match('/complaint for Order #(\d+)/i', $message, $matches)) {
            $type = 'complaintSubmitted';
            $data = [
                'orderId' => intval($matches[1])
            ];
        }
        // Dispute opened
        // e.g. "Dispute #2 has been opened for Order #40. Reason: ..."
        elseif (stripos($title, 'Dispute Submitted') !== false && preg_match('/Order #(\d+)/i', $message, $matches)) {
            $type = 'complaintSubmitted';
            $data = [
                'orderId' => intval($matches[1])
            ];
        }
        // 7. Dispute Resolved
        // e.g. "Your complaint for Order #40 (carrot) has been resolved..."
        elseif (stripos($title, 'Dispute Resolved') !== false && preg_match('/Order #(\d+)/i', $message, $matches)) {
            $type = 'complaintResolved';
            // Extract or default complaint ID
            $data = [
                'complaintId' => 1
            ];
        }
        // 8. Pre-Order Cancelled
        // e.g. "Buyer buyer1 has cancelled order ORD40 (carrot)."
        elseif (stripos($title, 'Cancelled') !== false && preg_match('/order ORD(\d+)/i', $message, $matches)) {
            $type = 'preorderCancelled';
            $data = [
                'orderId' => intval($matches[1])
            ];
        }

        if ($type) {
            $updateStmt = $pdo->prepare("UPDATE notifications SET type = ?, data = ? WHERE id = ?");
            $updateStmt->execute([$type, json_encode($data), $id]);
            $updatedCount++;
        }
    }

    echo json_encode([
        "success" => true,
        "total_untyped" => count($rows),
        "migrated" => $updatedCount
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Migration failed: " . $e->getMessage()
    ]);
}
?>
