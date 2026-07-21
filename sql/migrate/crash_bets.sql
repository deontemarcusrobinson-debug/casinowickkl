CREATE TABLE IF NOT EXISTS `crash_bets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `anonymous` BOOLEAN NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `auto` DECIMAL(32,2) UNSIGNED NOT NULL,
    `cashedout` BOOLEAN NOT NULL DEFAULT 0,
    `point` DECIMAL(32,2) UNSIGNED NOT NULL DEFAULT 0.00,
    `gameid` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_crash_bets_gameid_userid` (`gameid`, `userid`) USING BTREE,
    INDEX `IX_crash_bets_time` (`time`) USING BTREE,
    INDEX `IX_crash_bets_gameid` (`gameid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crash_bets` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crash_bets` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `crash_bets` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `crash_bets` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `crash_bets` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `crash_bets` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `crash_bets` CHANGE COLUMN `anonymous` `anonymous` BOOLEAN NOT NULL;
ALTER TABLE `crash_bets` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `crash_bets` CHANGE COLUMN `auto` `auto` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `crash_bets` CHANGE COLUMN `cashedout` `cashedout` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `crash_bets` CHANGE COLUMN `point` `point` DECIMAL(32,2) UNSIGNED NOT NULL DEFAULT 0.00;
ALTER TABLE `crash_bets` CHANGE COLUMN `gameid` `gameid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `crash_bets` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_crash_bets_gameid_userid` ON `crash_bets` (`gameid`, `userid`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_crash_bets_time` ON `crash_bets` (`time`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_crash_bets_gameid` ON `crash_bets` (`gameid`) USING BTREE;