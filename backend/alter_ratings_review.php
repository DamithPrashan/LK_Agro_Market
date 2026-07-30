<?php
require_once __DIR__ . '/connection/db.php';

try {
    // 1. Add reservation_id to ratings_review if it doesn't exist
    $stmt = $pdo->query("SHOW COLUMNS FROM ratings_review LIKE 'reservation_id'");
    $column = $stmt->fetch();
    if (!$column) {
        // Since ratings_review is currently empty, we can safely make it INT NOT NULL
        $pdo->exec("ALTER TABLE ratings_review ADD COLUMN reservation_id INT NOT NULL AFTER review_id");
        echo "Added 'reservation_id' column to 'ratings_review' table.\n";
        
        // Add foreign key constraint
        $pdo->exec("ALTER TABLE ratings_review ADD CONSTRAINT fk_ratings_reservation FOREIGN KEY (reservation_id) REFERENCES reservation(reservation_id) ON DELETE CASCADE");
        echo "Added foreign key constraint 'fk_ratings_reservation' to 'ratings_review'.\n";
    } else {
        echo "'reservation_id' column already exists in 'ratings_review' table.\n";
    }

    // 2. Add average_rating to user if it doesn't exist
    $stmt2 = $pdo->query("SHOW COLUMNS FROM user LIKE 'average_rating'");
    $column2 = $stmt2->fetch();
    if (!$column2) {
        $pdo->exec("ALTER TABLE user ADD COLUMN average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00");
        echo "Added 'average_rating' column to 'user' table.\n";
    } else {
        echo "'average_rating' column already exists in 'user' table.\n";
    }

    echo "Database migrations executed successfully.\n";

} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
