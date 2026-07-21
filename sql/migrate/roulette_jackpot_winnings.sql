CREATE TABLE IF NOT EXISTS `roulette_jackpot_winnings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `anonymous` BOOLEAN NOT NULL,
    `bets` DECIMAL(32,2) UNSIGNED NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `jackpotid` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_roulette_jackpot_winnings_jackpotid` (`jackpotid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `roulette_jackpot_winnings` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `roulette_jackpot_winnings` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `roulette_jackpot_winnings` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `roulette_jackpot_winnings` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `roulette_jackpot_winnings` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `roulette_jackpot_winnings` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `roulette_jackpot_winnings` CHANGE COLUMN `anonymous` `anonymous` BOOLEAN NOT NULL;
ALTER TABLE `roulette_jackpot_winnings` CHANGE COLUMN `bets` `bets` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `roulette_jackpot_winnings` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `roulette_jackpot_winnings` CHANGE COLUMN `jackpotid` `jackpotid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `roulette_jackpot_winnings` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_roulette_jackpot_winnings_jackpotid` ON `roulette_jackpot_winnings` (`jackpotid`) USING BTREE;