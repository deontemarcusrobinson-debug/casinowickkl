CREATE TABLE IF NOT EXISTS `referral_wagered` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `referral` VARCHAR(36) BINARY NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `commission` DECIMAL(32,5) UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_referral_wagered_referral_userid` (`referral`, `userid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `referral_wagered` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `referral_wagered` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `referral_wagered` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `referral_wagered` CHANGE COLUMN `referral` `referral` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `referral_wagered` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `referral_wagered` CHANGE COLUMN `commission` `commission` DECIMAL(32,5) UNSIGNED NOT NULL;
ALTER TABLE `referral_wagered` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_referral_wagered_referral_userid` ON `referral_wagered` (`referral`, `userid`) USING BTREE;