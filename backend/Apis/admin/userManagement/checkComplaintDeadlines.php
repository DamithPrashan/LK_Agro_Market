<?php

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'This scheduled checker may only run from the command line.']);
    exit;
}

require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../../create_notification.php';
require_once __DIR__ . '/../calendar/logAdminActivity.php';

function processComplaintReminders(PDO $pdo, string $kind): int
{
    $isOverdue = $kind === 'overdue';
    $sentColumn = $isOverdue ? 'farmer_overdue_reminder_sent_at' : 'farmer_24h_reminder_sent_at';
    $deadlineCondition = $isOverdue
        ? 'c.farmer_response_deadline <= NOW()'
        : 'c.farmer_response_deadline > NOW() AND c.farmer_response_deadline <= DATE_ADD(NOW(), INTERVAL 24 HOUR)';

    $stmt = $pdo->query("
        SELECT c.id, c.reservation_id, c.farmer_response_deadline,
               u.user_id AS farmer_user_id, u.name AS farmer_name
        FROM complaints c
        JOIN reservation r ON c.reservation_id = r.reservation_id
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop cr ON rc.crop_id = cr.crop_id
        JOIN farmer f ON cr.farmer_id = f.farmer_id
        JOIN user u ON f.user_id = u.user_id
        WHERE c.status = 'awaiting_farmer_response'
          AND c.farmer_response_deadline IS NOT NULL
          AND {$deadlineCondition}
          AND c.{$sentColumn} IS NULL
        ORDER BY c.farmer_response_deadline ASC
    ");

    $processed = 0;
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $complaint) {
        $title = $isOverdue ? 'Complaint Response Overdue' : 'Complaint Response Reminder';
        $farmerMessage = $isOverdue
            ? 'The response deadline for a complaint requiring your action has passed. Please respond as soon as possible. Continued failure to respond may result in further administrative action.'
            : 'You have less than 24 hours remaining to respond to a complaint requiring your action. Please review the complaint and respond before the deadline.';
        $activityType = $isOverdue ? 'farmer_response_overdue' : 'farmer_response_reminder';
        $description = $isOverdue
            ? "{$complaint['farmer_name']} has not responded within the required 48-hour period. The complaint now requires admin attention."
            : "{$complaint['farmer_name']} has not responded to a complaint yet. Less than 24 hours remain before the response deadline.";
        $notificationData = json_encode([
            'complaintId' => (int) $complaint['id'],
            'orderId' => (int) $complaint['reservation_id'],
            'deadline' => $complaint['farmer_response_deadline'],
            'link' => '/farmer/complaints'
        ]);

        $pdo->beginTransaction();
        try {
            $claim = $pdo->prepare("UPDATE complaints SET {$sentColumn} = NOW() WHERE id = ? AND {$sentColumn} IS NULL AND status = 'awaiting_farmer_response'");
            $claim->execute([$complaint['id']]);
            if ($claim->rowCount() !== 1) {
                $pdo->rollBack();
                continue;
            }

            $notified = create_notification($complaint['farmer_user_id'], $title, $farmerMessage, $activityType, $notificationData);
            $logged = logAdminActivity($pdo, $activityType, $isOverdue ? 'Farmer Response Overdue' : 'Farmer Response Reminder', $description, $complaint['id']);
            if (!$notified || !$logged) {
                throw new RuntimeException('Notification or calendar logging failed.');
            }
            $pdo->commit();
            $processed++;
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log("Complaint reminder failed for complaint {$complaint['id']}: {$error->getMessage()}");
        }
    }
    return $processed;
}

$overdue = processComplaintReminders($pdo, 'overdue');
$urgent = processComplaintReminders($pdo, 'urgent');
echo json_encode(['success' => true, 'urgent_reminders_sent' => $urgent, 'overdue_reminders_sent' => $overdue]) . PHP_EOL;
