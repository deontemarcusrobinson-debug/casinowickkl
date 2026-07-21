CREATE TABLE IF NOT EXISTS `authenticator_app_recovery_codes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `used` BOOLEAN NOT NULL DEFAULT 0,
    `code` VARCHAR(10) NOT NULL,
    `appid` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_authenticator_app_recovery_codes_appid_removed` (`appid`, `removed`) USING BTREE,
    INDEX `IX_authenticator_app_recovery_codes_appid_code_removed_used` (`appid`, `code`, `removed`, `used`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `authenticator_app_recovery_codes` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `authenticator_app_recovery_codes` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `authenticator_app_recovery_codes` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `authenticator_app_recovery_codes` CHANGE COLUMN `used` `used` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `authenticator_app_recovery_codes` CHANGE COLUMN `code` `code` VARCHAR(10) NOT NULL;
ALTER TABLE `authenticator_app_recovery_codes` CHANGE COLUMN `appid` `appid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `authenticator_app_recovery_codes` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_authenticator_app_recovery_codes_appid_removed` ON `authenticator_app_recovery_codes` (`appid`, `removed`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_authenticator_app_recovery_codes_appid_code_removed_used` ON `authenticator_app_recovery_codes` (`appid`, `code`, `removed`, `used`) USING BTREE;