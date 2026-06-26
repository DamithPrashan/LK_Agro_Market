-- SQL Database Setup for LK Agro Market
-- You can run these queries in phpMyAdmin under the 'lk_agro_market' database

CREATE TABLE IF NOT EXISTS `user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `contact` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `district` VARCHAR(100) NOT NULL,
  `language` VARCHAR(20) NOT NULL DEFAULT 'sinhala',
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('farmer', 'buyer', 'admin') NOT NULL,
  `verified` TINYINT(1) NOT NULL DEFAULT 0,
  `nic` VARCHAR(50) NULL,
  `farm_location` VARCHAR(255) NULL,
  `nic_image` VARCHAR(255) NULL,
  `evidence` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `crop` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmer_id` INT NOT NULL,
  `crop_name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `price_per_unit` DECIMAL(10,2) NOT NULL,
  `growth_stage` VARCHAR(100) NOT NULL,
  `harvest_date` DATE NOT NULL,
  `crop_status` VARCHAR(50) NOT NULL DEFAULT 'active',
  FOREIGN KEY (`farmer_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `crop_id` INT NOT NULL,
  `farmer_id` INT NOT NULL,
  `buyer_id` INT NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `price_per_unit` DECIMAL(10,2) NOT NULL,
  `collection_date` DATE NOT NULL,
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, prepaid, completed, failed
  `order_status` VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Accepted, Ready, Completed
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`crop_id`) REFERENCES `crop`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`farmer_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`buyer_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `payment_type` VARCHAR(50) NOT NULL, -- prepayment, balance
  `amount` DECIMAL(10,2) NOT NULL,
  `method` VARCHAR(50) NOT NULL, -- bank, lanka
  `proof_file` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ratings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `reviewer_id` INT NOT NULL,
  `rated_id` INT NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`rated_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
