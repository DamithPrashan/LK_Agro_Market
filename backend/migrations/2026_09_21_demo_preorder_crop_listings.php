<?php
declare(strict_types=1);

return static function (PDO $pdo): void {
    $listings = [
        [37, 'Anuradhapura', 'Pumpkin', 'Vegetable', 1.50, 650.00, 260.00, 'growing', '2026-10-18', 'pumpkin.jpg'],
        [38, 'Anuradhapura', 'Beans', 'Vegetable', 1.00, 420.00, 520.00, 'growing', '2026-10-12', 'beans.jpg'],
        [41, 'Anuradhapura', 'Tomato', 'Vegetable', 0.75, 380.00, 650.00, 'growing', '2026-10-09', 'tomato.jpg'],
        [12, 'Jaffna', 'Onion', 'Vegetable', 1.20, 720.00, 450.00, 'ready_for_harvest', '2026-10-03', 'onion.jpg'],
        [39, 'Kurunegala', 'Capsicum', 'Vegetable', 0.80, 300.00, 680.00, 'growing', '2026-10-15', 'capsicum.jpg'],
    ];
    $prefix = 'uploads/homepage_population_20260823/';
    $eligible = $pdo->prepare("SELECT COUNT(*) FROM farmer f JOIN user u ON u.user_id=f.user_id WHERE f.farmer_id=? AND f.verified_status=1 AND u.role='farmer' AND u.account_status='active'");
    $listingCount = $pdo->prepare('SELECT COUNT(*) FROM crop WHERE farmer_id=?');
    $insertCrop = $pdo->prepare("INSERT INTO crop (farmer_id,district,crop_name,category,location,cultivate_area,quantity,price_per_unit,suggested_price,growth_stage,harvest_date,crop_status,image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,'active',?)");
    $insertPhoto = $pdo->prepare('INSERT INTO crop_photos (crop_id,photo_path) VALUES (?,?)');
    $pdo->beginTransaction();
    try {
        foreach ($listings as [$farmerId, $district, $name, $category, $area, $quantity, $price, $stage, $harvest, $file]) {
            $path = $prefix . $file;
            if (!is_file(__DIR__ . '/../uploads/homepage_population_20260823/' . $file)) throw new RuntimeException("Missing crop asset: {$file}");
            $eligible->execute([$farmerId]);
            if ((int)$eligible->fetchColumn() !== 1) throw new RuntimeException("Ineligible farmer: {$farmerId}");
            $listingCount->execute([$farmerId]);
            if ((int)$listingCount->fetchColumn() !== 0) throw new RuntimeException("Farmer already has a crop listing: {$farmerId}");
            $insertCrop->execute([$farmerId, $district, $name, $category, $district, $area, $quantity, $price, $price, $stage, $harvest, $path]);
            $insertPhoto->execute([(int)$pdo->lastInsertId(), $path]);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
};
