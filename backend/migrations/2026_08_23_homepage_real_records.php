<?php
declare(strict_types=1);

return static function (PDO $pdo): void {
    $imagePrefix = 'backend/uploads/homepage_population_20260823/';
    $specs = [
        ['Tomato', 2, 1, 90, 650.00, 600.00],
        ['Carrot', 8, 2, 100, 420.00, 700.00],
        ['Cabbage', 12, 3, 90, 260.00, 800.00],
        ['Potato', 2, 4, 110, 380.00, 900.00],
        ['Beans', 8, 5, 75, 520.00, 500.00],
        ['Onion', 12, 1, 120, 450.00, 850.00],
        ['Pumpkin', 2, 2, 100, 240.00, 750.00],
        ['Brinjal', 8, 3, 95, 360.00, 550.00],
        ['Capsicum', 12, 4, 85, 680.00, 450.00],
        ['Leeks', 2, 5, 100, 490.00, 650.00],
    ];
    $expectedFarmers = [2 => 2, 8 => 11, 12 => 17];
    $expectedBuyers = [1 => 6, 2 => 9, 3 => 15, 4 => 16, 5 => 18];

    $verifyFarmer = $pdo->prepare("SELECT COUNT(*) FROM farmer f JOIN user u ON u.user_id=f.user_id
        WHERE f.farmer_id=? AND f.user_id=? AND f.verified_status=1 AND u.role='farmer' AND u.account_status='active'");
    foreach ($expectedFarmers as $farmerId => $userId) {
        $verifyFarmer->execute([$farmerId, $userId]);
        if ((int)$verifyFarmer->fetchColumn() !== 1) {
            throw new RuntimeException("Required verified farmer {$farmerId} / user {$userId} is missing or does not match the expected active farmer role.");
        }
    }

    $verifyBuyer = $pdo->prepare("SELECT COUNT(*) FROM buyer b JOIN user u ON u.user_id=b.user_id
        WHERE b.buyer_id=? AND b.user_id=? AND u.role='buyer' AND u.account_status='active'");
    foreach ($expectedBuyers as $buyerId => $userId) {
        $verifyBuyer->execute([$buyerId, $userId]);
        if ((int)$verifyBuyer->fetchColumn() !== 1) {
            throw new RuntimeException("Required buyer {$buyerId} / user {$userId} is missing or does not match the expected active buyer role.");
        }
    }

    foreach ($specs as [$cropName]) {
        $asset = __DIR__ . '/../uploads/homepage_population_20260823/' . strtolower($cropName) . '.jpg';
        if (!is_file($asset)) {
            throw new RuntimeException("Missing project-owned homepage image for {$cropName}: {$asset}");
        }
    }

    $counts = $pdo->prepare("SELECT
        (SELECT COUNT(*) FROM cultivation_ad_photos WHERE photo_path LIKE ?) cultivation_photos,
        (SELECT COUNT(*) FROM crop_photos WHERE photo_path LIKE ?) crop_photos");
    $counts->execute([$imagePrefix . '%', $imagePrefix . '%']);
    $existing = $counts->fetch(PDO::FETCH_ASSOC);
    $adPhotoCount = (int)$existing['cultivation_photos'];
    $cropPhotoCount = (int)$existing['crop_photos'];

    if (($adPhotoCount !== 0 || $cropPhotoCount !== 0) && ($adPhotoCount !== 10 || $cropPhotoCount !== 10)) {
        throw new RuntimeException("Incomplete homepage population marker set found ({$adPhotoCount} cultivation photos, {$cropPhotoCount} crop photos); refusing to duplicate or repair it automatically.");
    }

    $validate = static function () use ($pdo, $imagePrefix): void {
        $ads = $pdo->prepare("SELECT COUNT(*) FROM cultivation_ad ca
            JOIN cultivation_ad_photos cap ON cap.cultivation_ad_id=ca.cultivation_ad_id
            JOIN farmer f ON f.farmer_id=ca.farmer_id JOIN user u ON u.user_id=f.user_id
            WHERE cap.photo_path LIKE ? AND f.verified_status=1 AND u.account_status='active'
              AND ca.timing_model='growing_period' AND ca.growing_period_days>0
              AND ca.expected_harvest_date IS NULL AND ca.cultivation_started_at IS NULL
              AND ca.planned_start_date IS NULL AND ca.status='open'
              AND ca.committed_quantity<ca.capacity_quantity AND ca.unit='kg' AND ca.estimated_unit_price>0");
        $ads->execute([$imagePrefix . '%']);
        if ((int)$ads->fetchColumn() !== 10) {
            throw new RuntimeException('Homepage cultivation marker records failed integrity validation.');
        }

        $ledgers = $pdo->prepare("SELECT COUNT(*) FROM (
            SELECT r.reservation_id FROM crop_photos cp
            JOIN crop c ON c.crop_id=cp.crop_id JOIN reserve_crop rc ON rc.crop_id=c.crop_id
            JOIN reservation r ON r.reserve_crop_id=rc.reserve_crop_id JOIN payment p ON p.reservation_id=r.reservation_id
            WHERE cp.photo_path LIKE ? AND r.reservation_source='crop' AND r.cultivation_request_id IS NULL
              AND r.reservation_status='completed' AND r.transaction_status='paid' AND rc.status='completed'
              AND rc.quantity_requested>0 AND rc.unit_price=c.price_per_unit AND c.quantity>=0
            GROUP BY r.reservation_id,rc.total_amount
            HAVING COUNT(*)=2 AND COUNT(DISTINCT p.payment_type)=2 AND SUM(p.payment_status='completed')=2
              AND ABS(SUM(p.amount)-rc.total_amount)<=0.01
              AND ABS(SUM(CASE WHEN p.payment_type='advance' THEN p.amount ELSE 0 END)-ROUND(rc.total_amount/3))<=0.01
              AND SUM(CASE WHEN p.payment_type='final' AND p.payment_date>=NOW()-INTERVAL 7 DAY THEN 1 ELSE 0 END)=1
        ) valid_ledgers");
        $ledgers->execute([$imagePrefix . '%']);
        if ((int)$ledgers->fetchColumn() !== 10) {
            throw new RuntimeException('Homepage reservation/payment marker records failed integrity validation.');
        }
    };

    if ($adPhotoCount === 10 && $cropPhotoCount === 10) {
        $validate();
        return;
    }

    $farmerLocation = $pdo->prepare('SELECT u.location FROM farmer f JOIN user u ON u.user_id=f.user_id WHERE f.farmer_id=?');
    $insertAd = $pdo->prepare("INSERT INTO cultivation_ad
        (farmer_id,crop_name,category,district,capacity_quantity,committed_quantity,unit,estimated_unit_price,timing_model,expected_harvest_date,growing_period_days,planned_start_date,cultivation_started_at,cultivation_area,area_unit,description,status)
        VALUES (?,?,'Vegetables',?,?,0,'kg',?,'growing_period',NULL,?,NULL,NULL,?,'acres',?,'open')");
    $insertAdPhoto = $pdo->prepare('INSERT INTO cultivation_ad_photos (cultivation_ad_id,photo_path) VALUES (?,?)');
    $insertCrop = $pdo->prepare("INSERT INTO crop
        (farmer_id,district,crop_name,category,location,cultivate_area,quantity,price_per_unit,suggested_price,growth_stage,harvest_date,crop_status,image_url,created_at,updated_at)
        VALUES (?,?,?,'Vegetables',?,?,?,?,?,'harvested',CURDATE()-INTERVAL 2 DAY,'active',?,NOW()-INTERVAL 4 DAY,NOW())");
    $insertCropPhoto = $pdo->prepare('INSERT INTO crop_photos (crop_id,photo_path) VALUES (?,?)');
    $insertReserve = $pdo->prepare("INSERT INTO reserve_crop
        (buyer_id,crop_id,quantity_requested,unit_price,total_amount,status,reserved_date,expiry_date)
        VALUES (?,?,?,?,?,'completed',NOW()-INTERVAL 4 DAY,NULL)");
    $insertReservation = $pdo->prepare("INSERT INTO reservation
        (reservation_source,reserve_crop_id,cultivation_request_id,collection_date,reservation_status,transaction_status,completion_date)
        VALUES ('crop',?,NULL,CURDATE()-INTERVAL 1 DAY,'completed','paid',CURDATE())");
    $insertPayment = $pdo->prepare("INSERT INTO payment
        (reservation_id,amount,payment_type,payment_date,payment_status,proof_file,method)
        VALUES (?,?,?,NOW()-INTERVAL ? DAY,'completed',NULL,'bank_transfer')");

    $pdo->beginTransaction();
    try {
        foreach ($specs as $index => [$cropName, $farmerId, $buyerId, $days, $price, $capacity]) {
            $farmerLocation->execute([$farmerId]);
            $district = (string)$farmerLocation->fetchColumn();
            $imagePath = $imagePrefix . strtolower($cropName) . '.jpg';
            $area = round($capacity / 400, 2);
            $description = "Planned {$cropName} cultivation with capacity available for buyer requests.";

            $insertAd->execute([$farmerId, $cropName, $district, $capacity, $price, $days, $area, $description]);
            $insertAdPhoto->execute([(int)$pdo->lastInsertId(), $imagePath]);

            $quantity = 20 + $index;
            $listingQuantity = 480 + ($index * 20);
            $insertCrop->execute([$farmerId, $district, $cropName, $district, $area, $listingQuantity, $price, $price, $imagePath]);
            $cropId = (int)$pdo->lastInsertId();
            $insertCropPhoto->execute([$cropId, $imagePath]);

            $total = round($quantity * $price, 2);
            $advance = round($total / 3);
            $final = round($total - $advance, 2);
            $insertReserve->execute([$buyerId, $cropId, $quantity, $price, $total]);
            $reserveId = (int)$pdo->lastInsertId();
            $insertReservation->execute([$reserveId]);
            $reservationId = (int)$pdo->lastInsertId();
            $insertPayment->execute([$reservationId, $advance, 'advance', 3]);
            $insertPayment->execute([$reservationId, $final, 'final', 1]);
        }
        $validate();
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
};
