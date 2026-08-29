<?php
declare(strict_types=1);

return static function (PDO $pdo): void {
    $columnExists = static function (string $column) use ($pdo): bool {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='platform_reviews' AND COLUMN_NAME=?");
        $stmt->execute([$column]);
        return (int)$stmt->fetchColumn() === 1;
    };
    $constraintExists = static function (string $constraint) use ($pdo): bool {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='platform_reviews' AND CONSTRAINT_NAME=?");
        $stmt->execute([$constraint]);
        return (int)$stmt->fetchColumn() === 1;
    };

    if (!$columnExists('reservation_id')) {
        $pdo->exec('ALTER TABLE platform_reviews ADD COLUMN reservation_id INT NULL AFTER buyer_id');
    }

    if ($columnExists('order_id')) {
        $unmappedBuyers = (int)$pdo->query("SELECT COUNT(*) FROM platform_reviews pr
            LEFT JOIN buyer b ON b.user_id=pr.buyer_id WHERE b.buyer_id IS NULL")->fetchColumn();
        if ($unmappedBuyers > 0) {
            throw new RuntimeException("Cannot normalize platform_reviews: {$unmappedBuyers} legacy buyer value(s) do not map to buyer.user_id.");
        }

        $invalidReservations = (int)$pdo->query("SELECT COUNT(*) FROM platform_reviews pr
            JOIN buyer b ON b.user_id=pr.buyer_id
            LEFT JOIN reservation r ON r.reservation_id=pr.order_id
            LEFT JOIN reserve_crop rc ON r.reservation_source='crop' AND r.reserve_crop_id=rc.reserve_crop_id
            LEFT JOIN cultivation_request cr ON r.reservation_source='cultivation' AND r.cultivation_request_id=cr.cultivation_request_id
            WHERE r.reservation_id IS NULL
               OR b.buyer_id <> CASE WHEN r.reservation_source='crop' THEN rc.buyer_id ELSE cr.buyer_id END")->fetchColumn();
        if ($invalidReservations > 0) {
            throw new RuntimeException("Cannot normalize platform_reviews: {$invalidReservations} legacy reservation value(s) are invalid or owned by another buyer.");
        }

        $duplicates = (int)$pdo->query("SELECT COUNT(*) FROM (
            SELECT b.buyer_id,pr.order_id FROM platform_reviews pr JOIN buyer b ON b.user_id=pr.buyer_id
            GROUP BY b.buyer_id,pr.order_id HAVING COUNT(*)>1
        ) duplicate_reviews")->fetchColumn();
        if ($duplicates > 0) {
            throw new RuntimeException("Cannot normalize platform_reviews: {$duplicates} duplicate buyer/reservation group(s) require manual review.");
        }

        $pdo->exec('UPDATE platform_reviews pr JOIN buyer b ON b.user_id=pr.buyer_id
            SET pr.buyer_id=b.buyer_id, pr.reservation_id=pr.order_id');

        $pdo->exec('ALTER TABLE platform_reviews DROP COLUMN order_id');
    }

    $pdo->exec('ALTER TABLE platform_reviews MODIFY COLUMN reservation_id INT NOT NULL');

    if (!$constraintExists('uq_platform_reviews_buyer_reservation')) {
        $pdo->exec('ALTER TABLE platform_reviews ADD CONSTRAINT uq_platform_reviews_buyer_reservation UNIQUE (buyer_id,reservation_id)');
    }
    if (!$constraintExists('fk_platform_reviews_buyer')) {
        $pdo->exec('ALTER TABLE platform_reviews ADD CONSTRAINT fk_platform_reviews_buyer
            FOREIGN KEY (buyer_id) REFERENCES buyer(buyer_id) ON DELETE CASCADE ON UPDATE CASCADE');
    }
    if (!$constraintExists('fk_platform_reviews_reservation')) {
        $pdo->exec('ALTER TABLE platform_reviews ADD CONSTRAINT fk_platform_reviews_reservation
            FOREIGN KEY (reservation_id) REFERENCES reservation(reservation_id) ON DELETE CASCADE ON UPDATE CASCADE');
    }
};
