CREATE TABLE IF NOT EXISTS `email_verification_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `used` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `expire` BIGINT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_email_verification_requests_userid_used_removed_expire` (`userid`, `used`, `removed`, `expire`) USING BTREE,
    INDEX `IX_email_verification_requests_userid_code_used_removed_expire` (`userid`, `code`, `used`, `removed`, `expire`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `email_verification_requests` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `email_verification_requests` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `email_verification_requests` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `email_verification_requests` CHANGE COLUMN `used` `used` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `email_verification_requests` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `email_verification_requests` CHANGE COLUMN `code` `code` VARCHAR(6) NOT NULL;
ALTER TABLE `email_verification_requests` CHANGE COLUMN `expire` `expire` BIGINT NOT NULL;
ALTER TABLE `email_verification_requests` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_email_verification_requests_userid_used_removed_expire` ON `email_verification_requests` (`userid`, `used`, `removed`, `expire`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_email_verification_requests_userid_code_used_removed_expire` ON `email_verification_requests` (`userid`, `code`, `used`, `removed`, `expire`) USING BTREE;