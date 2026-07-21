CREATE TABLE IF NOT EXISTS `admin_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `device` VARCHAR(64) BINARY NOT NULL,
    `expire` BIGINT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_admin_requests_userid_device_removed_expire` (`userid`, `device`, `removed`, `expire`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `admin_requests` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `admin_requests` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `admin_requests` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `admin_requests` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `admin_requests` CHANGE COLUMN `device` `device` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `admin_requests` CHANGE COLUMN `expire` `expire` BIGINT NOT NULL;
ALTER TABLE `admin_requests` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_admin_requests_userid_device_removed_expire` ON `admin_requests` (`userid`, `device`, `removed`, `expire`) USING BTREE;