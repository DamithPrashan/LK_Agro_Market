<?php
/**
 * LK Agro Market - Pre-Order Deduction Integration Test
 * Run this script from the terminal to verify the pre-order backend logic.
 */

require_once 'connection/db.php';

echo "=== Pre-Order Deduction Integration Test ===\n";

try {
    // 1. Find a buyer
    $buyerStmt = $pdo->query("
        SELECT b.buyer_id, u.user_id, u.name 
        FROM buyer b 
        JOIN user u ON b.user_id = u.user_id 
        LIMIT 1
    ");
    $buyer = $buyerStmt->fetch();
    if (!$buyer) {
        // Let's check if there are users with role buyer but not in buyer table, or create a dummy one
        $userStmt = $pdo->query("SELECT user_id, name FROM user WHERE role = 'buyer' LIMIT 1");
        $user = $userStmt->fetch();
        if (!$user) {
            // Seed a dummy buyer user
            $pdo->exec("INSERT INTO user (name, contact, email, district, password, role, verified) VALUES ('Test Buyer', '0771234567', 'testbuyer@example.com', 'Colombo', 'password', 'buyer', 1)");
            $userId = $pdo->lastInsertId();
            $pdo->exec("INSERT INTO buyer (user_id) VALUES ($userId)");
            $buyerId = $pdo->lastInsertId();
            $buyer = ['buyer_id' => $buyerId, 'user_id' => $userId, 'name' => 'Test Buyer'];
            echo "[Seeded] Created dummy buyer user.\n";
        } else {
            // User exists, check/insert into buyer table
            $pdo->exec("INSERT INTO buyer (user_id) VALUES ({$user['user_id']})");
            $buyerId = $pdo->lastInsertId();
            $buyer = ['buyer_id' => $buyerId, 'user_id' => $user['user_id'], 'name' => $user['name']];
            echo "[Seeded] Linked existing user to buyer table.\n";
        }
    }
    
    echo "Using Buyer: {$buyer['name']} (User ID: {$buyer['user_id']}, Buyer ID: {$buyer['buyer_id']})\n";

    // 2. Find or create an active crop listing
    $cropStmt = $pdo->query("SELECT crop_id, crop_name, quantity, harvest_date FROM crop WHERE crop_status = 'active' AND quantity > 5 LIMIT 1");
    $crop = $cropStmt->fetch();
    if (!$crop) {
        // Let's find any farmer or seed one
        $farmerStmt = $pdo->query("SELECT farmer_id FROM farmer LIMIT 1");
        $farmer = $farmerStmt->fetch();
        if (!$farmer) {
            // Seed farmer user
            $pdo->exec("INSERT INTO user (name, contact, email, district, password, role, verified) VALUES ('Test Farmer', '0777654321', 'testfarmer@example.com', 'Kandy', 'password', 'farmer', 1)");
            $farmerUserId = $pdo->lastInsertId();
            $pdo->exec("INSERT INTO farmer (user_id, verified_status) VALUES ($farmerUserId, 1)");
            $farmerId = $pdo->lastInsertId();
        } else {
            $farmerId = $farmer['farmer_id'];
        }
        
        // Seed an active crop listing
        $harvestDate = date('Y-m-d', strtotime('+5 days'));
        $pdo->exec("INSERT INTO crop (farmer_id, crop_name, category, location, quantity, price_per_unit, growth_stage, harvest_date, crop_status) VALUES ($farmerId, 'Test Carrot', 'Vegetables', 'Kandy', 100.00, 250.00, 'Maturing', '$harvestDate', 'active')");
        $cropId = $pdo->lastInsertId();
        $crop = ['crop_id' => $cropId, 'crop_name' => 'Test Carrot', 'quantity' => 100.00, 'harvest_date' => $harvestDate];
        echo "[Seeded] Created dummy active crop listing.\n";
    }

    echo "Using Crop: {$crop['crop_name']} (ID: {$crop['crop_id']}, Available Qty: {$crop['quantity']} kg, Harvest Date: {$crop['harvest_date']})\n";

    $cropId = $crop['crop_id'];
    $userId = $buyer['user_id'];
    $initialQty = floatval($crop['quantity']);
    $orderQty = 5.0; // Let's order 5 kg
    $collectionDate = date('Y-m-d', strtotime($crop['harvest_date'] . ' + 2 days')); // valid delivery date

    echo "\n--- TEST CASE 1: Place a valid pre-order (Should succeed and deduct stock) ---\n";
    
    // Write run_isolated_test.php
    $isolatedCode = "<?php
session_start();
\$_SESSION['user'] = ['id' => $userId, 'role' => 'buyer'];
\$mockInput = [
    'crop_id' => $cropId,
    'quantity' => $orderQty,
    'collection_date' => '$collectionDate'
];
require_once 'place_preorder.php';
?>";
    file_put_contents('run_preorder_isolated.php', $isolatedCode);

    // Execute isolated test in a subprocess
    $output = [];
    $retval = 0;
    exec('php -dextension_dir="C:\php-8.5.4\ext" -dextension=pdo_mysql run_preorder_isolated.php', $output, $retval);
    @unlink('run_preorder_isolated.php');
    
    $jsonResponse = implode("\n", $output);
    echo "Subprocess Exit Code: $retval\n";
    echo "Raw Response: $jsonResponse\n";

    $response = json_decode($jsonResponse, true);
    
    if ($response && isset($response['success']) && $response['success'] === true) {
        echo "✅ PASS: Response success is true.\n";
        if (isset($response['updated_quantity'])) {
            echo "✅ PASS: Response contains updated_quantity: {$response['updated_quantity']}\n";
        } else {
            echo "❌ FAIL: Response does not contain updated_quantity.\n";
        }
    } else {
        echo "❌ FAIL: Pre-order request was unsuccessful.\n";
    }

    // Verify DB update
    $verifyStmt = $pdo->prepare("SELECT quantity FROM crop WHERE crop_id = ?");
    $verifyStmt->execute([$cropId]);
    $newQty = floatval($verifyStmt->fetchColumn());
    echo "Initial Qty: $initialQty kg | Expected Qty: " . ($initialQty - $orderQty) . " kg | Actual Qty in DB: $newQty kg\n";
    if (abs($newQty - ($initialQty - $orderQty)) < 0.01) {
        echo "✅ PASS: Database quantity successfully and correctly decremented.\n";
    } else {
        echo "❌ FAIL: Database quantity not decremented correctly.\n";
    }


    echo "\n--- TEST CASE 2: Order more than available (Should fail and not deduct stock) ---\n";
    $excessQty = $newQty + 10.0;
    $isolatedCode2 = "<?php
session_start();
\$_SESSION['user'] = ['id' => $userId, 'role' => 'buyer'];
\$mockInput = [
    'crop_id' => $cropId,
    'quantity' => $excessQty,
    'collection_date' => '$collectionDate'
];
require_once 'place_preorder.php';
?>";
    file_put_contents('run_preorder_isolated.php', $isolatedCode2);

    $output2 = [];
    $retval2 = 0;
    exec('php -dextension_dir="C:\php-8.5.4\ext" -dextension=pdo_mysql run_preorder_isolated.php', $output2, $retval2);
    @unlink('run_preorder_isolated.php');

    $jsonResponse2 = implode("\n", $output2);
    echo "Raw Response: $jsonResponse2\n";
    $response2 = json_decode($jsonResponse2, true);

    if ($response2 && isset($response2['success']) && $response2['success'] === false) {
        echo "✅ PASS: Request failed as expected with message: \"{$response2['message']}\"\n";
    } else {
        echo "❌ FAIL: Request succeeded or response structure was invalid.\n";
    }

    // Verify DB quantity remained unchanged
    $verifyStmt->execute([$cropId]);
    $finalQty = floatval($verifyStmt->fetchColumn());
    if (abs($finalQty - $newQty) < 0.01) {
        echo "✅ PASS: Database quantity remained unchanged at $finalQty kg.\n";
    } else {
        echo "❌ FAIL: Database quantity changed to $finalQty kg.\n";
    }

} catch (Exception $e) {
    echo "Exception occurred: " . $e->getMessage() . "\n";
}
?>
