CREATE TABLE IF NOT EXISTS `jackpot_bets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `anonymous` BOOLEAN NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `color` VARCHAR(32) NOT NULL,
    `ticketmin` BIGINT UNSIGNED NOT NULL,
    `ticketmax` BIGINT UNSIGNED NOT NULL,
    `gameid` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_jackpot_bets_userid_gameid` (`userid`, `gameid`) USING BTREE,
    INDEX `IX_jackpot_bets_gameid` (`gameid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `jackpot_bets` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `jackpot_bets` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `jackpot_bets` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `jackpot_bets` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `jackpot_bets` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `jackpot_bets` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `jackpot_bets` CHANGE COLUMN `anonymous` `anonymous` BOOLEAN NOT NULL;
ALTER TABLE `jackpot_bets` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `jackpot_bets` CHANGE COLUMN `color` `color` VARCHAR(32) NOT NULL;
ALTER TABLE `jackpot_bets` CHANGE COLUMN `ticketmin` `ticketmin` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `jackpot_bets` CHANGE COLUMN `ticketmax` `ticketmax` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `jackpot_bets` CHANGE COLUMN `gameid` `gameid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `jackpot_bets` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_jackpot_bets_userid_gameid` ON `jackpot_bets` (`userid`, `gameid`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_jackpot_bets_gameid` ON `jackpot_bets` (`gameid`) USING BTREE;