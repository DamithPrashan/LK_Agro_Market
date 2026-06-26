<?php
// Database configuration variables
$host     = '127.0.0.1';     // Or 'localhost'
$port     = '3306';          // Custom port for this machine
$db       = 'lk_agro_market'; // Replace with your actual database name
$user     = 'root';           // Default XAMPP username
$password = '';               // Default XAMPP password is empty
$charset  = 'utf8mb4';        // Best practice for character encoding

// Data Source Name (DSN) specifies the driver, host, database, and charset
$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";

// Configuration options for PDO
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Turns errors into exceptions you can catch
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Fetches associative arrays by default
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Turns off emulation; forces real prepared statements
];

try {
    // Create the PDO instance (Establish the connection)
    $pdo = new PDO($dsn, $user, $password, $options);
    
    // Uncomment the line below just to test if it works, then comment it out again!
    //  echo "Database connection successful!"; 
    
} catch (\PDOException $e) {
    // If something goes wrong, stop execution and show the error message
    die("Database connection failed: " . $e->getMessage());
}
?>