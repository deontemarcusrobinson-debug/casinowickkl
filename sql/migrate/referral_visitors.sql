CREATE TABLE IF NOT EXISTS `referral_visitors` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `referral` VARCHAR(36) BINARY NOT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `agent` TEXT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_referral_visitors_referral_time` (`referral`, `time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `referral_visitors` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `referral_visitors` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `referral_visitors` CHANGE COLUMN `referral` `referral` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `referral_visitors` CHANGE COLUMN `ip` `ip` VARCHAR(45) NOT NULL;
ALTER TABLE `referral_visitors` CHANGE COLUMN `location` `location` VARCHAR(255) NOT NULL;
ALTER TABLE `referral_visitors` CHANGE COLUMN `agent` `agent` TEXT NOT NULL;
ALTER TABLE `referral_visitors` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_referral_visitors_referral_time` ON `referral_visitors` (`referral`, `time`) USING BTREE;