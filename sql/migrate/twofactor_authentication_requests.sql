CREATE TABLE IF NOT EXISTS `twofactor_authentication_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `used` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `token` VARCHAR(32) BINARY NOT NULL,
    `expire` BIGINT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_twofactor_authentication_requests_token` (`token`, `used`, `removed`, `expire`, `userid`) USING BTREE,
    INDEX `IX_twofactor_authentication_requests_userid` (`userid`, `used`, `removed`, `expire`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `twofactor_authentication_requests` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `twofactor_authentication_requests` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `twofactor_authentication_requests` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `twofactor_authentication_requests` CHANGE COLUMN `used` `used` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `twofactor_authentication_requests` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `twofactor_authentication_requests` CHANGE COLUMN `token` `token` VARCHAR(32) BINARY NOT NULL;
ALTER TABLE `twofactor_authentication_requests` CHANGE COLUMN `expire` `expire` BIGINT NOT NULL;
ALTER TABLE `twofactor_authentication_requests` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_twofactor_authentication_requests_token` ON `twofactor_authentication_requests` (`token`, `used`, `removed`, `expire`, `userid`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_twofactor_authentication_requests_userid` ON `twofactor_authentication_requests` (`userid`, `used`, `removed`, `expire`) USING BTREE;