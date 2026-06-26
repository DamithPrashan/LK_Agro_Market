<?php
require_once 'connection/db.php';
try {
    // 1. Add missing 'language' column to 'user' table
    $stmt = $pdo->query("SHOW COLUMNS FROM user LIKE 'language'");
    $column = $stmt->fetch();
    if (!$column) {
        $pdo->exec("ALTER TABLE user ADD COLUMN language VARCHAR(20) NOT NULL DEFAULT 'sinhala'");
        echo "Successfully added the 'language' column to the 'user' table!<br>";
    } else {
        echo "The 'language' column already exists in the 'user' table.<br>";
    }

    // 2. Add missing 'nic_image' column to 'farmer_verification' table
    $stmt2 = $pdo->query("SHOW COLUMNS FROM farmer_verification LIKE 'nic_image'");
    $column2 = $stmt2->fetch();
    if (!$column2) {
        $pdo->exec("ALTER TABLE farmer_verification ADD COLUMN nic_image VARCHAR(255) NULL AFTER evidence_file");
        echo "Successfully added the 'nic_image' column to the 'farmer_verification' table!<br>";
    } else {
        echo "The 'nic_image' column already exists in the 'farmer_verification' table.<br>";
    }

    // 3. Add missing 'image_url' column to 'crop' table
    $stmt3 = $pdo->query("SHOW COLUMNS FROM crop LIKE 'image_url'");
    $column3 = $stmt3->fetch();
    if (!$column3) {
        $pdo->exec("ALTER TABLE crop ADD COLUMN image_url VARCHAR(255) NULL AFTER crop_status");
        echo "Successfully added the 'image_url' column to the 'crop' table!<br>";
    } else {
        echo "The 'image_url' column already exists in the 'crop' table.<br>";
    }

} catch (PDOException $e) {
    echo "Error updating database: " . $e->getMessage();
}
?>
