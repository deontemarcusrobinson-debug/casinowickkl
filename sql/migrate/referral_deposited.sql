CREATE TABLE IF NOT EXISTS `referral_deposited` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `referral` VARCHAR(36) BINARY NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `commission` DECIMAL(32,5) UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_referral_deposited_referral` (`referral`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `referral_deposited` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `referral_deposited` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `referral_deposited` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `referral_deposited` CHANGE COLUMN `referral` `referral` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `referral_deposited` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `referral_deposited` CHANGE COLUMN `commission` `commission` DECIMAL(32,5) UNSIGNED NOT NULL;
ALTER TABLE `referral_deposited` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_referral_deposited_referral` ON `referral_deposited` (`referral`) USING BTREE;