<?php
declare(strict_types=1);

/**
 * Resolve either reservation source into one authoritative order snapshot.
 * Financial values always come from the frozen order/agreement rows.
 */
function resolve_order_snapshot(PDO $pdo, int $reservationId, bool $forUpdate = false): ?array
{
    if ($reservationId <= 0) {
        return null;
    }

    $sql = "
        SELECT
            r.reservation_id,
            r.reservation_source,
            r.reservation_status,
            r.transaction_status,
            r.collection_date,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.buyer_id ELSE rc.buyer_id END AS buyer_id,
            CASE WHEN r.reservation_source = 'cultivation' THEN cb.user_id ELSE b.user_id END AS buyer_user_id,
            CASE WHEN r.reservation_source = 'cultivation' THEN cub.name ELSE ub.name END AS buyer_name,
            CASE WHEN r.reservation_source = 'cultivation' THEN cub.email ELSE ub.email END AS buyer_email,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.farmer_id ELSE c.farmer_id END AS farmer_id,
            CASE WHEN r.reservation_source = 'cultivation' THEN cf.user_id ELSE f.user_id END AS farmer_user_id,
            CASE WHEN r.reservation_source = 'cultivation' THEN cuf.name ELSE uf.name END AS farmer_name,
            CASE WHEN r.reservation_source = 'cultivation' THEN cuf.email ELSE uf.email END AS farmer_email,
            CASE WHEN r.reservation_source = 'cultivation' THEN NULL ELSE c.crop_id END AS crop_id,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.cultivation_request_id ELSE NULL END AS cultivation_request_id,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.request_status ELSE rc.status END AS source_status,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.cultivation_ad_id ELSE NULL END AS cultivation_ad_id,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.crop_name ELSE c.crop_name END AS crop_name,
              CASE WHEN r.reservation_source = 'cultivation' THEN ca.timing_model ELSE NULL END AS timing_model,
              CASE WHEN r.reservation_source = 'cultivation' THEN ca.cultivation_started_at ELSE NULL END AS cultivation_started_at,
              CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_growing_period_days ELSE NULL END AS agreed_growing_period_days,
              CASE WHEN r.reservation_source = 'cultivation' AND ca.cultivation_started_at IS NOT NULL AND cr.agreed_growing_period_days IS NOT NULL
                  THEN DATE(DATE_ADD(ca.cultivation_started_at, INTERVAL cr.agreed_growing_period_days DAY)) ELSE NULL END AS estimated_harvest_date,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.category ELSE c.category END AS category,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.district ELSE c.location END AS location,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_quantity ELSE rc.quantity_requested END AS quantity,
            CASE WHEN r.reservation_source = 'cultivation' THEN ca.unit ELSE 'kg' END AS unit,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_unit_price ELSE rc.unit_price END AS unit_price,
            CASE WHEN r.reservation_source = 'cultivation' THEN cr.agreed_total_amount ELSE rc.total_amount END AS total_amount
        FROM reservation r
        LEFT JOIN reserve_crop rc
            ON r.reservation_source = 'crop' AND r.reserve_crop_id = rc.reserve_crop_id
        LEFT JOIN crop c ON rc.crop_id = c.crop_id
        LEFT JOIN buyer b ON rc.buyer_id = b.buyer_id
        LEFT JOIN user ub ON b.user_id = ub.user_id
        LEFT JOIN farmer f ON c.farmer_id = f.farmer_id
        LEFT JOIN user uf ON f.user_id = uf.user_id
        LEFT JOIN cultivation_request cr
            ON r.reservation_source = 'cultivation' AND r.cultivation_request_id = cr.cultivation_request_id
        LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id = ca.cultivation_ad_id
        LEFT JOIN buyer cb ON cr.buyer_id = cb.buyer_id
        LEFT JOIN user cub ON cb.user_id = cub.user_id
        LEFT JOIN farmer cf ON ca.farmer_id = cf.farmer_id
        LEFT JOIN user cuf ON cf.user_id = cuf.user_id
        WHERE r.reservation_id = ?
    ";
    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$reservationId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || $row['buyer_user_id'] === null || $row['farmer_user_id'] === null || $row['total_amount'] === null) {
        return null;
    }

    foreach (['reservation_id', 'buyer_id', 'buyer_user_id', 'farmer_id', 'farmer_user_id'] as $field) {
        $row[$field] = (int)$row[$field];
    }
    $row['crop_id'] = $row['crop_id'] === null ? null : (int)$row['crop_id'];
    $row['cultivation_request_id'] = $row['cultivation_request_id'] === null ? null : (int)$row['cultivation_request_id'];
    $row['cultivation_ad_id'] = $row['cultivation_ad_id'] === null ? null : (int)$row['cultivation_ad_id'];
    foreach (['quantity', 'unit_price', 'total_amount'] as $field) {
        $row[$field] = (float)$row[$field];
    }
    return $row;
}

/** Return completed, fully-paid orders that this user has not rated. */
function find_completed_unrated_orders(PDO $pdo, int $userId, string $role): array
{
    if ($userId <= 0 || !in_array($role, ['buyer', 'farmer'], true)) {
        return [];
    }
    $partyColumn = $role === 'buyer'
        ? "CASE WHEN r.reservation_source='cultivation' THEN cub.user_id ELSE ub.user_id END"
        : "CASE WHEN r.reservation_source='cultivation' THEN cuf.user_id ELSE uf.user_id END";
    $otherParty = $role === 'buyer'
        ? "CASE WHEN r.reservation_source='cultivation' THEN cuf.name ELSE uf.name END"
        : "CASE WHEN r.reservation_source='cultivation' THEN cub.name ELSE ub.name END";
    $sql = "
        SELECT r.reservation_id AS id,
               r.reservation_source,
               r.completion_date,
               CASE WHEN r.reservation_source='cultivation' THEN ca.crop_name ELSE c.crop_name END AS crop_name,
               CASE WHEN r.reservation_source='cultivation' THEN cr.agreed_quantity ELSE rc.quantity_requested END AS quantity,
               CASE WHEN r.reservation_source='cultivation' THEN ca.unit ELSE 'kg' END AS unit,
               {$otherParty} AS other_party_name
        FROM reservation r
        LEFT JOIN reserve_crop rc ON r.reservation_source='crop' AND r.reserve_crop_id=rc.reserve_crop_id
        LEFT JOIN crop c ON rc.crop_id=c.crop_id
        LEFT JOIN buyer b ON rc.buyer_id=b.buyer_id
        LEFT JOIN user ub ON b.user_id=ub.user_id
        LEFT JOIN farmer f ON c.farmer_id=f.farmer_id
        LEFT JOIN user uf ON f.user_id=uf.user_id
        LEFT JOIN cultivation_request cr ON r.reservation_source='cultivation' AND r.cultivation_request_id=cr.cultivation_request_id
        LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id=ca.cultivation_ad_id
        LEFT JOIN buyer cb ON cr.buyer_id=cb.buyer_id
        LEFT JOIN user cub ON cb.user_id=cub.user_id
        LEFT JOIN farmer cf ON ca.farmer_id=cf.farmer_id
        LEFT JOIN user cuf ON cf.user_id=cuf.user_id
        LEFT JOIN ratings_review rr ON rr.reservation_id=r.reservation_id AND rr.reviewer_id=?
        WHERE {$partyColumn}=?
          AND r.reservation_status='completed'
          AND r.transaction_status='paid'
          AND rr.review_id IS NULL
        ORDER BY r.reservation_id DESC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId, $userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/** Resolve a complaint row together with its normalized reservation snapshot. */
function resolve_complaint_snapshot(PDO $pdo, int $complaintId, bool $forUpdate = false): ?array
{
    if ($complaintId <= 0) return null;
    $sql = 'SELECT * FROM complaints WHERE id=?' . ($forUpdate ? ' FOR UPDATE' : '');
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$complaintId]);
    $complaint = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$complaint) return null;
    $order = resolve_order_snapshot($pdo, (int)$complaint['reservation_id'], $forUpdate);
    if (!$order || (int)$complaint['buyer_id'] !== $order['buyer_id']) return null;
    return ['complaint' => $complaint, 'order' => $order];
}
