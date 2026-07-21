CREATE TABLE IF NOT EXISTS `users_trades` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(32) NOT NULL,
    `method` VARCHAR(32) NOT NULL,
    `option` VARCHAR(32) NOT NULL,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `value` DOUBLE UNSIGNED NOT NULL,
    `tradeid` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_users_trades_type_time` (`type`, `time`) USING BTREE,
    INDEX `IX_users_trades_type_method_time` (`type`, `method`, `time`) USING BTREE,
    INDEX `IX_users_trades_method_time` (`method`, `time`) USING BTREE,
    INDEX `IX_users_trades_userid_type_time` (`userid`, `type`, `time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_trades` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_trades` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `users_trades` CHANGE COLUMN `type` `type` VARCHAR(32) NOT NULL;
ALTER TABLE `users_trades` CHANGE COLUMN `method` `method` VARCHAR(32) NOT NULL;
ALTER TABLE `users_trades` CHANGE COLUMN `option` `option` VARCHAR(32) NOT NULL;
ALTER TABLE `users_trades` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `users_trades` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `users_trades` CHANGE COLUMN `value` `value` DOUBLE UNSIGNED NOT NULL;
ALTER TABLE `users_trades` CHANGE COLUMN `tradeid` `tradeid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `users_trades` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_users_trades_type_time` ON `users_trades` (`type`, `time`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_trades_type_method_time` ON `users_trades` (`type`, `method`, `time`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_trades_method_time` ON `users_trades` (`method`, `time`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_trades_userid_type_time` ON `users_trades` (`userid`, `type`, `time`) USING BTREE;