CREATE TABLE IF NOT EXISTS `referral_uses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `referral` VARCHAR(36) BINARY NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_referral_uses_referral_userid` (`referral`, `userid`) USING BTREE,
    INDEX `IX_referral_uses_userid_referral` (`userid`, `referral`) USING BTREE,
    INDEX `IX_referral_uses_referral_time` (`referral`, `time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `referral_uses` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `referral_uses` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `referral_uses` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `referral_uses` CHANGE COLUMN `referral` `referral` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `referral_uses` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `referral_uses` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_referral_uses_referral_userid` ON `referral_uses` (`referral`, `userid`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_referral_uses_userid_referral` ON `referral_uses` (`userid`, `referral`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_referral_uses_referral_time` ON `referral_uses` (`referral`, `time`) USING BTREE;