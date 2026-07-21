CREATE TABLE IF NOT EXISTS `coinflip_bets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `anonymous` BOOLEAN NOT NULL,
    `bot` BOOLEAN NOT NULL,
    `gameid` BIGINT UNSIGNED NOT NULL,
    `position` TINYINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_coinflip_bets_userid_gameid` (`userid`, `gameid`) USING BTREE,
    INDEX `IX_coinflip_bets_gameid_time` (`gameid`, `time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `coinflip_bets` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `coinflip_bets` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `coinflip_bets` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `coinflip_bets` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `coinflip_bets` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `coinflip_bets` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `coinflip_bets` CHANGE COLUMN `anonymous` `anonymous` BOOLEAN NOT NULL;
ALTER TABLE `coinflip_bets` CHANGE COLUMN `bot` `bot` BOOLEAN NOT NULL;
ALTER TABLE `coinflip_bets` CHANGE COLUMN `gameid` `gameid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `coinflip_bets` CHANGE COLUMN `position` `position` TINYINT UNSIGNED NOT NULL;
ALTER TABLE `coinflip_bets` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_coinflip_bets_userid_gameid` ON `coinflip_bets` (`userid`, `gameid`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_coinflip_bets_gameid_time` ON `coinflip_bets` (`gameid`, `time`) USING BTREE;