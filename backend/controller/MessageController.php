<?php

require_once __DIR__ . '/../models/message.php';

class MessageController {
    private $messageModel;
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->messageModel = new MessageModel($pdo);
    }

    /**
     * Send a new message.
     */
    public function send(int $senderId): void {
        header("Content-Type: application/json");

        $reservationId = isset($_POST['reservation_id']) ? intval($_POST['reservation_id']) : 0;
        $messageType = isset($_POST['message_type']) ? trim($_POST['message_type']) : '';
        $templateKey = isset($_POST['template_key']) ? trim($_POST['template_key']) : null;
        $messageText = isset($_POST['message_text']) ? trim($_POST['message_text']) : null;

        // Validations
        if ($reservationId <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid reservation ID."]);
            return;
        }

        // Verify sender belongs to reservation
        if (!$this->messageModel->userBelongsToReservation($senderId, $reservationId)) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized: You do not belong to this reservation."]);
            return;
        }

        if (!in_array($messageType, ['template', 'text', 'image'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid message type."]);
            return;
        }

        $imagePath = null;

        if ($messageType === 'text') {
            if (empty($messageText)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Message text cannot be empty."]);
                return;
            }
            $templateKey = null;
        } elseif ($messageType === 'template') {
            if (empty($templateKey)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Template key cannot be empty."]);
                return;
            }
            $messageText = null;
        } elseif ($messageType === 'image') {
            if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Image file is required."]);
                return;
            }

            $allowedExtensions = ['jpg', 'jpeg', 'png'];
            $fileExtension = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
            if (!in_array($fileExtension, $allowedExtensions)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Allowed image formats: jpg, jpeg, png."]);
                return;
            }

            if ($_FILES['image']['size'] > 5 * 1024 * 1024) { // 5MB limit
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Maximum image size is 5MB."]);
                return;
            }

            // Create target directory if it doesn't exist
            $targetDir = __DIR__ . '/../uploads/ChatImages/';
            if (!file_exists($targetDir)) {
                mkdir($targetDir, 0777, true);
            }

            $newFileName = uniqid('chat_', true) . '.' . $fileExtension;
            $targetFile = $targetDir . $newFileName;

            if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
                $imagePath = $newFileName;
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to save uploaded image."]);
                return;
            }
            $templateKey = null;
            $messageText = null;
        }

        try {
            // Save message
            $messageId = $this->messageModel->insertMessage(
                $reservationId,
                $senderId,
                $messageType,
                $templateKey,
                $messageText,
                $imagePath
            );

            if ($messageId) {
                // Determine recipient and sender details
                $participantSql = "
                    SELECT 
                        u_buyer.user_id as buyer_user_id,
                        u_buyer.name as buyer_name,
                        u_farmer.user_id as farmer_user_id,
                        u_farmer.name as farmer_name
                    FROM reservation r
                    JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
                    JOIN crop c ON rc.crop_id = c.crop_id
                    JOIN buyer b ON rc.buyer_id = b.buyer_id
                    JOIN user u_buyer ON b.user_id = u_buyer.user_id
                    JOIN farmer f ON c.farmer_id = f.farmer_id
                    JOIN user u_farmer ON f.user_id = u_farmer.user_id
                    WHERE r.reservation_id = ?
                ";
                $partStmt = $this->pdo->prepare($participantSql);
                $partStmt->execute([$reservationId]);
                $participants = $partStmt->fetch(PDO::FETCH_ASSOC);

                if ($participants) {
                    if ($senderId === intval($participants['buyer_user_id'])) {
                        $senderName = $participants['buyer_name'];
                        $recipientId = intval($participants['farmer_user_id']);
                    } else {
                        $senderName = $participants['farmer_name'];
                        $recipientId = intval($participants['buyer_user_id']);
                    }

                    // Format message string
                    $templateMap = [
                        'order_accepted' => 'Order Accepted',
                        'produce_ready' => 'Produce is Ready for Collection',
                        'order_cancelled' => 'Order Cancelled',
                        'slight_delay' => 'Slight Delay Expected',
                        'quality_confirmed' => 'Quality Confirmed',
                        'thank_you' => 'Thank You',
                        'uploading_evidence' => 'Sending Crop Evidence Photo'
                    ];

                    if ($messageType === 'template') {
                        $templateText = isset($templateMap[$templateKey]) ? $templateMap[$templateKey] : $templateKey;
                        $notifMessage = $senderName . ": " . $templateText;
                    } else {
                        $notifMessage = $senderName . " sent you a message";
                    }

                    // Insert to 'notification' table (singular)
                    $singularNotifSql = "INSERT INTO notification (user_id, message, notification_date, is_read, type) 
                                         VALUES (?, ?, NOW(), 0, 'system')";
                    $singStmt = $this->pdo->prepare($singularNotifSql);
                    $singStmt->execute([$recipientId, $notifMessage]);

                    // Insert to 'notifications' table (plural) via system helper
                    if (!function_exists('create_notification')) {
                        require_once __DIR__ . '/../create_notification.php';
                    }
                    create_notification($recipientId, 'New Message', $notifMessage, 'system', json_encode(['reservation_id' => $reservationId]));
                }

                echo json_encode(["success" => true, "message" => "Message sent successfully."]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to store message in database."]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
    }

    /**
     * Get all messages for a specific reservation.
     */
    public function getMessages(int $userId): void {
        header("Content-Type: application/json");

        $reservationId = isset($_GET['reservation_id']) ? intval($_GET['reservation_id']) : 0;

        if ($reservationId <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid reservation ID."]);
            return;
        }

        // Verify member belongs to reservation
        if (!$this->messageModel->userBelongsToReservation($userId, $reservationId)) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized: You do not belong to this reservation."]);
            return;
        }

        try {
            // Mark incoming messages as read
            $this->messageModel->markAsRead($reservationId, $userId);

            // Fetch message thread
            $messages = $this->messageModel->getByReservation($reservationId, $userId);

            echo json_encode([
                "success" => true,
                "messages" => $messages
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
    }

    /**
     * Get unread messages count for logged-in user.
     */
    public function getUnreadCount(int $userId): void {
        header("Content-Type: application/json");

        try {
            $unreadCount = $this->messageModel->getUnreadCount($userId);
            echo json_encode([
                "success" => true,
                "unread_count" => $unreadCount
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
    }
}
