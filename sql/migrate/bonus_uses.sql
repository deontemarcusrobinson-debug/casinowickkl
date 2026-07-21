CREATE TABLE IF NOT EXISTS `bonus_uses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `bonusid` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_bonus_uses_bonusid` (`bonusid`) USING BTREE,
    INDEX `IX_bonus_uses_userid_bonusid` (`userid`, `bonusid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `bonus_uses` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `bonus_uses` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `bonus_uses` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `bonus_uses` CHANGE COLUMN `bonusid` `bonusid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `bonus_uses` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_bonus_uses_bonusid` ON `bonus_uses` (`bonusid`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_bonus_uses_userid_bonusid` ON `bonus_uses` (`userid`, `bonusid`) USING BTREE;