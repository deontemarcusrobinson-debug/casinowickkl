CREATE TABLE IF NOT EXISTS `deposit_codes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `referral` VARCHAR(36) BINARY NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `uses` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `amount` DECIMAL(32,5) UNSIGNED NOT NULL DEFAULT 0.00000,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UQ_deposit_codes_code` (`code`) USING BTREE,
    INDEX `IX_deposit_codes_removed` (`removed`) USING BTREE,
    INDEX `IX_deposit_codes_referral_code_removed` (`referral`, `removed`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `deposit_codes` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `deposit_codes` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `deposit_codes` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `deposit_codes` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `deposit_codes` CHANGE COLUMN `referral` `referral` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `deposit_codes` CHANGE COLUMN `code` `code` VARCHAR(32) NOT NULL;
ALTER TABLE `deposit_codes` CHANGE COLUMN `uses` `uses` BIGINT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `deposit_codes` CHANGE COLUMN `amount` `amount` DECIMAL(32,5) UNSIGNED NOT NULL DEFAULT 0.00000;
ALTER TABLE `deposit_codes` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `UQ_deposit_codes_code` ON `deposit_codes` (`code`) USING BTREE;

CREATE INDEX IF NOT EXISTS `IX_deposit_codes_removed` ON `deposit_codes` (`removed`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_deposit_codes_referral_code_removed` ON `deposit_codes` (`referral`, `removed`) USING BTREE;