<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in
require_login();

$crop_name = isset($_GET['crop_name']) ? trim($_GET['crop_name']) : '';
$district  = isset($_GET['district']) ? trim($_GET['district']) : '';

if (empty($crop_name)) {
    echo json_encode([
        "success" => false,
        "message" => "Crop name is required."
    ]);
    exit;
}

try {
    // 1. Try district average within last 60 days
    $sql = "SELECT ROUND(AVG(price_per_unit), 2) AS suggested_price, COUNT(*) AS sample_count 
            FROM crop 
            WHERE crop_name = ? 
              AND district = ? 
              AND crop_status = 'active' 
              AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$crop_name, $district]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. If sample count is < 3, relax the 60 day restriction in the district (for testing/checking purpose)
    if (!$result || intval($result['sample_count']) < 3) {
        $sqlAllTime = "SELECT ROUND(AVG(price_per_unit), 2) AS suggested_price, COUNT(*) AS sample_count 
                       FROM crop 
                       WHERE crop_name = ? 
                         AND district = ? 
                         AND crop_status = 'active'";
        $stmtAllTime = $pdo->prepare($sqlAllTime);
        $stmtAllTime->execute([$crop_name, $district]);
        $allTimeResult = $stmtAllTime->fetch(PDO::FETCH_ASSOC);
        
        if ($allTimeResult && intval($allTimeResult['sample_count']) >= 3) {
            $result = $allTimeResult;
        }
    }

    // 3. If sample count in district is still < 3, fall back to national average within 60 days
    if (!$result || intval($result['sample_count']) < 3) {
        $sqlNational = "SELECT ROUND(AVG(price_per_unit), 2) AS suggested_price, COUNT(*) AS sample_count 
                        FROM crop 
                        WHERE crop_name = ? 
                          AND crop_status = 'active' 
                          AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)";
        $stmtNational = $pdo->prepare($sqlNational);
        $stmtNational->execute([$crop_name]);
        $nationalResult = $stmtNational->fetch(PDO::FETCH_ASSOC);
        
        // 4. If national count is < 3, relax the 60 day restriction nationally
        if (!$nationalResult || intval($nationalResult['sample_count']) < 3) {
            $sqlNationalAllTime = "SELECT ROUND(AVG(price_per_unit), 2) AS suggested_price, COUNT(*) AS sample_count 
                                   FROM crop 
                                   WHERE crop_name = ? 
                                     AND crop_status = 'active'";
            $stmtNationalAllTime = $pdo->prepare($sqlNationalAllTime);
            $stmtNationalAllTime->execute([$crop_name]);
            $nationalAllTimeResult = $stmtNationalAllTime->fetch(PDO::FETCH_ASSOC);
            
            if ($nationalAllTimeResult && intval($nationalAllTimeResult['sample_count']) > 0) {
                echo json_encode([
                    "success" => true,
                    "suggested_price" => $nationalAllTimeResult['suggested_price'] !== null ? floatval($nationalAllTimeResult['suggested_price']) : null,
                    "basis" => "national",
                    "sample_count" => intval($nationalAllTimeResult['sample_count'])
                ]);
                exit;
            }
        } else {
            echo json_encode([
                "success" => true,
                "suggested_price" => $nationalResult['suggested_price'] !== null ? floatval($nationalResult['suggested_price']) : null,
                "basis" => "national",
                "sample_count" => intval($nationalResult['sample_count'])
            ]);
            exit;
        }

        // If absolutely no listings exist at all
        echo json_encode([
            "success" => true,
            "suggested_price" => null,
            "basis" => "none",
            "sample_count" => 0
        ]);
        exit;
    }

    // Return the district suggestion
    echo json_encode([
        "success" => true,
        "suggested_price" => $result['suggested_price'] !== null ? floatval($result['suggested_price']) : null,
        "basis" => "district",
        "sample_count" => intval($result['sample_count'])
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
