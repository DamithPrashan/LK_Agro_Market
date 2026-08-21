ALTER TABLE `user`
    ADD COLUMN `account_status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active' AFTER `role`;
