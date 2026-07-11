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

    // 4. Create 'complaints' table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `complaints` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `reservation_id` INT NOT NULL,
          `buyer_id` INT NOT NULL,
          `reason` VARCHAR(255) NOT NULL,
          `description` TEXT NOT NULL,
          `evidence_file` VARCHAR(255) NULL,
          `status` VARCHAR(50) NOT NULL DEFAULT 'submitted',
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (`reservation_id`) REFERENCES `reservation`(`reservation_id`) ON DELETE CASCADE,
          FOREIGN KEY (`buyer_id`) REFERENCES `buyer`(`buyer_id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    echo "Verified/Created 'complaints' table successfully!<br>";

    // 4b. Add missing fields to 'complaints' table
    $stmt4b = $pdo->query("SHOW COLUMNS FROM complaints LIKE 'farmer_response'");
    if (!$stmt4b->fetch()) {
        $pdo->exec("ALTER TABLE complaints ADD COLUMN farmer_response TEXT NULL AFTER status");
        $pdo->exec("ALTER TABLE complaints ADD COLUMN admin_notes TEXT NULL AFTER farmer_response");
        $pdo->exec("ALTER TABLE complaints ADD COLUMN resolution_action VARCHAR(50) NULL AFTER admin_notes");
        $pdo->exec("ALTER TABLE complaints ADD COLUMN farmer_responded_at TIMESTAMP NULL AFTER resolution_action");
        $pdo->exec("ALTER TABLE complaints ADD COLUMN resolved_at TIMESTAMP NULL AFTER farmer_responded_at");
        echo "Successfully added advanced complaint management columns to 'complaints' table!<br>";
    }

    // 5. Create 'notifications' table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `notifications` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `user_id` INT NOT NULL,
          `title` VARCHAR(255) NOT NULL,
          `message` TEXT NOT NULL,
          `is_read` TINYINT(1) DEFAULT 0,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    echo "Verified/Created 'notifications' table successfully!<br>";

    // 6. Create 'crop_photos' table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `crop_photos` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `crop_id` INT NOT NULL,
          `photo_path` VARCHAR(255) NOT NULL,
          FOREIGN KEY (`crop_id`) REFERENCES `crop`(`crop_id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    echo "Verified/Created 'crop_photos' table successfully!<br>";

} catch (PDOException $e) {
    echo "Error updating database: " . $e->getMessage();
}
?>
