CREATE TABLE IF NOT EXISTS `tracking_links` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `referral` VARCHAR(64) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `expire` BIGINT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UQ_tracking_links_referral` (`referral`) USING BTREE,
    INDEX `IX_tracking_links_removed_expire` (`removed`, `expire`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `tracking_links` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `tracking_links` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `tracking_links` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `tracking_links` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `tracking_links` CHANGE COLUMN `referral` `referral` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `tracking_links` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `tracking_links` CHANGE COLUMN `expire` `expire` BIGINT NOT NULL;
ALTER TABLE `tracking_links` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `UQ_tracking_links_referral` ON `tracking_links` (`referral`) USING BTREE;

CREATE INDEX IF NOT EXISTS `IX_tracking_links_removed_expire` ON `tracking_links` (`removed`, `expire`) USING BTREE;