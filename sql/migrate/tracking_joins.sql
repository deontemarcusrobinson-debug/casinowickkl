CREATE TABLE IF NOT EXISTS `tracking_joins` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `referral` VARCHAR(64) BINARY NOT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `agent` TEXT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_tracking_joins_referral_ip` (`referral`, `ip`) USING BTREE,
    INDEX `IX_tracking_joins_referral_time` (`time`, `referral`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `tracking_joins` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `tracking_joins` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `tracking_joins` CHANGE COLUMN `referral` `referral` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `tracking_joins` CHANGE COLUMN `ip` `ip` VARCHAR(45) NOT NULL;
ALTER TABLE `tracking_joins` CHANGE COLUMN `location` `location` VARCHAR(255) NOT NULL;
ALTER TABLE `tracking_joins` CHANGE COLUMN `agent` `agent` TEXT NOT NULL;
ALTER TABLE `tracking_joins` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_tracking_joins_referral_ip` ON `tracking_joins` (`referral`, `ip`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_tracking_joins_referral_time` ON `tracking_joins` (`time`, `referral`) USING BTREE;