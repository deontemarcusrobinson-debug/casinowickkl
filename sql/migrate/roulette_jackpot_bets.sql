CREATE TABLE IF NOT EXISTS `roulette_jackpot_bets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `amount` DECIMAL(32,5) UNSIGNED NOT NULL,
    `jackpotid` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `roulette_jackpot_bets` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `roulette_jackpot_bets` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `roulette_jackpot_bets` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `roulette_jackpot_bets` CHANGE COLUMN `amount` `amount` DECIMAL(32,5) UNSIGNED NOT NULL;
ALTER TABLE `roulette_jackpot_bets` CHANGE COLUMN `jackpotid` `jackpotid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `roulette_jackpot_bets` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;