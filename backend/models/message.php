<?php

class MessageModel {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Insert a new message.
     */
    public function insertMessage($reservationId, $senderId, $messageType, $templateKey, $messageText, $imagePath) {
        $sql = "INSERT INTO message (reservation_id, sender_id, message_type, template_key, message_text, image_path, sent_at, is_read) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), 0)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$reservationId, $senderId, $messageType, $templateKey, $messageText, $imagePath]);
        return $this->pdo->lastInsertId();
    }

    /**
     * Get all messages for a specific reservation.
     */
    public function getByReservation(int $reservationId, int $userId) {
        $sql = "SELECT 
                    m.message_id,
                    m.sender_id,
                    u.name AS sender_name,
                    u.role AS sender_role,
                    m.message_type,
                    m.template_key,
                    m.message_text,
                    m.image_path,
                    m.sent_at,
                    m.is_read
                FROM message m
                JOIN user u ON m.sender_id = u.user_id
                WHERE m.reservation_id = ?
                ORDER BY m.sent_at ASC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$reservationId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Add full image_url to each message row
        foreach ($messages as &$msg) {
            $msg['message_id'] = intval($msg['message_id']);
            $msg['sender_id'] = intval($msg['sender_id']);
            $msg['is_read'] = intval($msg['is_read']);
            $msg['image_url'] = $msg['image_path'] ? '/backend/uploads/ChatImages/' . $msg['image_path'] : null;
        }
        return $messages;
    }

    /**
     * Mark all unread messages as read for this reservation where the sender is not the current user.
     */
    public function markAsRead(int $reservationId, int $userId) {
        $sql = "UPDATE message 
                SET is_read = 1 
                WHERE reservation_id = ? AND sender_id != ? AND is_read = 0";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$reservationId, $userId]);
    }

    /**
     * Get count of unread messages across all reservations for a user where they are a participant.
     */
    public function getUnreadCount(int $userId) {
        $sql = "SELECT COUNT(*) 
                FROM message m
                JOIN reservation r ON m.reservation_id = r.reservation_id
                JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
                JOIN crop c ON rc.crop_id = c.crop_id
                LEFT JOIN buyer b ON rc.buyer_id = b.buyer_id
                LEFT JOIN farmer f ON c.farmer_id = f.farmer_id
                WHERE m.sender_id != ? 
                  AND m.is_read = 0
                  AND (b.user_id = ? OR f.user_id = ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId, $userId, $userId]);
        return intval($stmt->fetchColumn());
    }

    /**
     * Verify if a user belongs to a specific reservation (either as farmer or buyer).
     */
    public function userBelongsToReservation(int $userId, int $reservationId): bool {
        $sql = "SELECT COUNT(*) 
                FROM reservation r
                JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
                JOIN crop c ON rc.crop_id = c.crop_id
                LEFT JOIN buyer b ON rc.buyer_id = b.buyer_id
                LEFT JOIN farmer f ON c.farmer_id = f.farmer_id
                WHERE r.reservation_id = ?
                  AND (b.user_id = ? OR f.user_id = ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$reservationId, $userId, $userId]);
        return intval($stmt->fetchColumn()) > 0;
    }
}
