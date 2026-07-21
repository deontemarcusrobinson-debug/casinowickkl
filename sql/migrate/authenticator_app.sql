CREATE TABLE IF NOT EXISTS `authenticator_app` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `activated` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `secret` VARCHAR(128) BINARY NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_authenticator_app_userid_removed_activated` (`userid`, `removed`, `activated`) USING BTREE,
    INDEX `IX_authenticator_app_removed_activated` (`removed`, `activated`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `authenticator_app` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `authenticator_app` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `authenticator_app` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `authenticator_app` CHANGE COLUMN `activated` `activated` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `authenticator_app` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `authenticator_app` CHANGE COLUMN `secret` `secret` VARCHAR(128) BINARY NOT NULL;
ALTER TABLE `authenticator_app` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_authenticator_app_userid_removed_activated` ON `authenticator_app` (`userid`, `removed`, `activated`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_authenticator_app_removed_activated` ON `authenticator_app` (`removed`, `activated`) USING BTREE;