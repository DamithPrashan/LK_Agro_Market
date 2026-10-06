<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

require_once __DIR__ . '/../../connection/db.php';
require_once __DIR__ . '/../auth_check.php';

// Enable session check to map user info if available
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    // 1. DETAIL VIEW FOR A SPECIFIC CROP LISTING
    if (isset($_GET['id']) && is_numeric($_GET['id'])) {
        $crop_id = intval($_GET['id']);
        
        // Fetch crop, farmer, and user info
        $cropQuery = "
            SELECT 
                c.crop_id as id, 
                c.crop_name as name, 
                c.category, 
                COALESCE(NULLIF(c.district, ''), NULLIF(c.location, ''), NULLIF(u.location, '')) as district,
                c.location, 
                c.quantity as qty, 
                c.price_per_unit as price, 
                c.growth_stage, 
                c.harvest_date as harvest, 
                c.crop_status, 
                c.image_url,
                u.name as farmer_name,
                u.email as farmer_email,
                u.phone as farmer_phone,
                f.verified_status as is_verified,
                u.user_id as farmer_user_id,
                u.average_rating as user_average_rating,
                fv.verification_rating,
                fv.farm_location
            FROM crop c
            JOIN farmer f ON c.farmer_id = f.farmer_id
            JOIN user u ON f.user_id = u.user_id
            LEFT JOIN farmer_verification fv ON f.farmer_id = fv.farmer_id
            WHERE c.crop_id = ? AND c.crop_status = 'active'
            LIMIT 1
        ";
        
        $stmt = $pdo->prepare($cropQuery);
        $stmt->execute([$crop_id]);
        $crop = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$crop) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Crop listing not found."
            ]);
            exit;
        }

        // Fetch ratings/reviews for this farmer (reviewee_id = farmer's user_id)
        // Find the farmer's user_id first
        $userQuery = $pdo->prepare("SELECT user_id FROM farmer WHERE farmer_id = (SELECT farmer_id FROM crop WHERE crop_id = ?)");
        $userQuery->execute([$crop_id]);
        $farmer_user = $userQuery->fetch();
        
        $reviews = [];
        $average_rating = 0.0;
        
        if ($farmer_user) {
            $farmer_user_id = $farmer_user['user_id'];
            
            // Get all reviews
            $reviewStmt = $pdo->prepare("
                SELECT 
                    r.review_id as id, 
                    r.rating, 
                    r.comment, 
                    DATE_FORMAT(r.review_date, '%b %d, %Y') as created_at, 
                    u.name as reviewer_name 
                FROM ratings_review r 
                JOIN user u ON r.reviewer_id = u.user_id 
                WHERE r.reviewee_id = ? AND r.is_removed = 0
                ORDER BY r.review_date DESC
            ");
            $reviewStmt->execute([$farmer_user_id]);
            $reviews = $reviewStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Calculate dynamic average rating using Option 1 (Cumulative Baseline Model)
            $initialRating = null;
            if (!empty($crop['verification_rating']) && floatval($crop['verification_rating']) > 0) {
                $initialRating = floatval($crop['verification_rating']);
            } elseif (!empty($crop['user_average_rating']) && floatval($crop['user_average_rating']) > 0 && empty($reviews)) {
                $initialRating = floatval($crop['user_average_rating']);
            }

            $sumRatings = array_sum(array_column($reviews, 'rating'));
            $countRatings = count($reviews);

            if ($initialRating !== null && $initialRating > 0) {
                $sumRatings += $initialRating;
                $countRatings += 1;
            }

            $average_rating = ($countRatings > 0) ? round($sumRatings / $countRatings, 1) : 0.0;
        }
        
        // Fetch crop photos from crop_photos table
        $photosStmt = $pdo->prepare("SELECT photo_path FROM crop_photos WHERE crop_id = ?");
        $photosStmt->execute([$crop_id]);
        $crop_photos = $photosStmt->fetchAll(PDO::FETCH_COLUMN);

        $crop['rating'] = $average_rating;
        $crop['reviews'] = $reviews;
        $crop['images'] = $crop_photos;
        
        echo json_encode([
            "success" => true,
            "crop" => $crop
        ]);
        exit;
    }
    
    // 2. BROWSE & FILTER VIEW LISTINGS
    $whereClauses = [];
    $params = [];
    
    // Default show only active listings
    $whereClauses[] = "c.crop_status = 'active'";
    
    // Search Query (matches crop name, farmer name, or district/location)
    if (isset($_GET['search_query']) && trim($_GET['search_query']) !== '') {
        $search_query = trim($_GET['search_query']);
        $whereClauses[] = "(c.crop_name LIKE ? OR u.name LIKE ? OR c.location LIKE ? OR c.district LIKE ? OR u.location LIKE ?)";
        $likeParam = "%" . $search_query . "%";
        $params[] = $likeParam;
        $params[] = $likeParam;
        $params[] = $likeParam;
        $params[] = $likeParam;
        $params[] = $likeParam;
    }
    
    // District / Location filter
    if (isset($_GET['district']) && trim($_GET['district']) !== '' && trim($_GET['district']) !== 'All' && trim($_GET['district']) !== 'All Crops' && trim($_GET['district']) !== 'All Districts') {
        $whereClauses[] = "(c.location = ? OR c.district = ? OR u.location = ?)";
        $params[] = trim($_GET['district']);
        $params[] = trim($_GET['district']);
        $params[] = trim($_GET['district']);
    }
    
    // Crop Type filter
    if (isset($_GET['crop_type']) && trim($_GET['crop_type']) !== '' && trim($_GET['crop_type']) !== 'All Crops' && trim($_GET['crop_type']) !== 'All') {
        $whereClauses[] = "c.crop_name = ?";
        $params[] = trim($_GET['crop_type']);
    }
    
    // Helper function to validate dates (YYYY-MM-DD)
    if (!function_exists('isValidDateString')) {
        function isValidDateString($dateStr) {
            $d = DateTime::createFromFormat('Y-m-d', $dateStr);
            return $d && $d->format('Y-m-d') === $dateStr;
        }
    }

    // Min Price range filter (with validation and legacy support)
    $minPriceVal = '';
    if (isset($_GET['minPrice']) && trim($_GET['minPrice']) !== '') {
        $minPriceVal = trim($_GET['minPrice']);
    } elseif (isset($_GET['price_min']) && trim($_GET['price_min']) !== '') {
        $minPriceVal = trim($_GET['price_min']);
    }

    // Max Price range filter (with validation and legacy support)
    $maxPriceVal = '';
    if (isset($_GET['maxPrice']) && trim($_GET['maxPrice']) !== '') {
        $maxPriceVal = trim($_GET['maxPrice']);
    } elseif (isset($_GET['price_max']) && trim($_GET['price_max']) !== '') {
        $maxPriceVal = trim($_GET['price_max']);
    }

    // Apply Price filter (using BETWEEN if both are provided, otherwise >= or <=)
    $hasMin = ($minPriceVal !== '' && is_numeric($minPriceVal) && floatval($minPriceVal) >= 0);
    $hasMax = ($maxPriceVal !== '' && is_numeric($maxPriceVal) && floatval($maxPriceVal) >= 0);

    if ($hasMin && $hasMax) {
        $whereClauses[] = "c.price_per_unit BETWEEN ? AND ?";
        $params[] = floatval($minPriceVal);
        $params[] = floatval($maxPriceVal);
    } else {
        if ($hasMin) {
            $whereClauses[] = "c.price_per_unit >= ?";
            $params[] = floatval($minPriceVal);
        }
        if ($hasMax) {
            $whereClauses[] = "c.price_per_unit <= ?";
            $params[] = floatval($maxPriceVal);
        }
    }
    
    // Parse Harvest dates (with validation)
    $hFrom = isset($_GET['harvestFrom']) && trim($_GET['harvestFrom']) !== '' && isValidDateString(trim($_GET['harvestFrom'])) ? trim($_GET['harvestFrom']) : null;
    $hTo = isset($_GET['harvestTo']) && trim($_GET['harvestTo']) !== '' && isValidDateString(trim($_GET['harvestTo'])) ? trim($_GET['harvestTo']) : null;

    if ($hFrom && $hTo) {
        $whereClauses[] = "c.harvest_date BETWEEN ? AND ?";
        $params[] = $hFrom;
        $params[] = $hTo;
    } else {
        if ($hFrom) {
            $whereClauses[] = "c.harvest_date >= ?";
            $params[] = $hFrom;
        }
        if ($hTo) {
            $whereClauses[] = "c.harvest_date <= ?";
            $params[] = $hTo;
        }
    }

    // Backwards compatibility for legacy single harvest_date
    if (isset($_GET['harvest_date']) && trim($_GET['harvest_date']) !== '' && !$hFrom && !$hTo) {
        $hDate = trim($_GET['harvest_date']);
        if (isValidDateString($hDate)) {
            $whereClauses[] = "c.harvest_date >= ?";
            $params[] = $hDate;
        }
    }
    
    // Verified-only Toggle filter
    if (isset($_GET['is_verified']) && ($_GET['is_verified'] === 'true' || $_GET['is_verified'] === '1')) {
        $whereClauses[] = "f.verified_status = 1";
    }
    
    // Build SQL Query with dynamically calculated rating
    $sql = "
        SELECT 
            c.crop_id as id, 
            c.crop_name as name, 
            c.category, 
            COALESCE(NULLIF(c.district, ''), NULLIF(c.location, ''), NULLIF(u.location, '')) as district,
            c.location, 
            c.quantity as qty, 
            c.price_per_unit as price, 
            c.harvest_date as harvest, 
            c.image_url,
            u.name as farmer_name, 
            f.verified_status as is_verified,
            COALESCE(
                (
                    SELECT ROUND(
                        (COALESCE(SUM(r.rating), 0) + COALESCE(fv.verification_rating, 0)) / 
                        (COUNT(r.rating) + CASE WHEN fv.verification_rating IS NOT NULL AND fv.verification_rating > 0 THEN 1 ELSE 0 END),
                        1
                    )
                    FROM ratings_review r 
                    WHERE r.reviewee_id = u.user_id AND r.is_removed = 0
                    HAVING (COUNT(r.rating) + CASE WHEN fv.verification_rating IS NOT NULL AND fv.verification_rating > 0 THEN 1 ELSE 0 END) > 0
                ),
                NULLIF(u.average_rating, 0.00),
                fv.verification_rating,
                0.0
            ) as rating,
            CASE WHEN EXISTS (
                SELECT 1 FROM reserve_crop rc_tr
                JOIN reservation r_tr ON r_tr.reserve_crop_id = rc_tr.reserve_crop_id
                JOIN payment p_tr ON p_tr.reservation_id = r_tr.reservation_id
                WHERE rc_tr.crop_id = c.crop_id
                  AND p_tr.payment_type = 'final'
                  AND p_tr.payment_status = 'completed'
                  AND p_tr.payment_date >= NOW() - INTERVAL 7 DAY
            ) THEN 1 ELSE 0 END as is_trending
        FROM crop c
        JOIN farmer f ON c.farmer_id = f.farmer_id
        JOIN user u ON f.user_id = u.user_id
        LEFT JOIN farmer_verification fv ON f.farmer_id = fv.farmer_id AND fv.verification_status = 'approved'
    ";
    
    if (!empty($whereClauses)) {
        $sql .= " WHERE " . implode(" AND ", $whereClauses);
    }
    
    // Apply sorting
    $sort_by = isset($_GET['sort_by']) ? trim($_GET['sort_by']) : '';
    $orderBy = " ORDER BY c.harvest_date ASC"; // default sort
    
    if ($sort_by === 'price_asc') {
        $orderBy = " ORDER BY c.price_per_unit ASC";
    } elseif ($sort_by === 'price_desc') {
        $orderBy = " ORDER BY c.price_per_unit DESC";
    } elseif ($sort_by === 'rating_desc') {
        $orderBy = " ORDER BY rating DESC";
    } elseif ($sort_by === 'harvest_desc') {
        $orderBy = " ORDER BY c.harvest_date DESC";
    }
    
    $sql .= $orderBy;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $listings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "success" => true,
        "listings" => $listings
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>

