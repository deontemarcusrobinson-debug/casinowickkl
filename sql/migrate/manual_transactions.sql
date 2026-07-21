CREATE TABLE IF NOT EXISTS `manual_transactions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(32) NOT NULL,
    `adminid` VARCHAR(36) BINARY NOT NULL,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_manual_transactions_userid_type` (`userid`, `type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `manual_transactions` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `manual_transactions` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `manual_transactions` CHANGE COLUMN `type` `type` VARCHAR(32) NOT NULL;
ALTER TABLE `manual_transactions` CHANGE COLUMN `adminid` `adminid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `manual_transactions` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `manual_transactions` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `manual_transactions` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `manual_transactions` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `manual_transactions` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `manual_transactions` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_manual_transactions_userid_type` ON `manual_transactions` (`userid`, `type`) USING BTREE;