CREATE TABLE IF NOT EXISTS `referral_codes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `collected` DECIMAL(32,2) UNSIGNED NOT NULL DEFAULT 0.00,
    `available` DECIMAL(32,5) UNSIGNED NOT NULL DEFAULT 0.00000,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UQ_referral_codes_code` (`code`) USING BTREE,
    INDEX `IX_referral_codes_userid` (`userid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `referral_codes` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `referral_codes` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `referral_codes` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `referral_codes` CHANGE COLUMN `code` `code` VARCHAR(32) NOT NULL;
ALTER TABLE `referral_codes` CHANGE COLUMN `collected` `collected` DECIMAL(32,2) UNSIGNED NOT NULL DEFAULT 0.00;
ALTER TABLE `referral_codes` CHANGE COLUMN `available` `available` DECIMAL(32,5) UNSIGNED NOT NULL DEFAULT 0.00000;
ALTER TABLE `referral_codes` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `UQ_referral_codes_code` ON `referral_codes` (`code`) USING BTREE;

CREATE INDEX IF NOT EXISTS `IX_referral_codes_userid` ON `referral_codes` (`userid`) USING BTREE;