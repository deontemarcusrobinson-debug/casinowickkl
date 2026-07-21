CREATE TABLE IF NOT EXISTS `roulette_jackpot_games` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `ended` BOOLEAN NOT NULL DEFAULT 0,
    `amount` DECIMAL(32,5) UNSIGNED NOT NULL DEFAULT 0.00000,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_roulette_jackpot_games_ended` (`ended`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `roulette_jackpot_games` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `roulette_jackpot_games` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `roulette_jackpot_games` CHANGE COLUMN `ended` `ended` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `roulette_jackpot_games` CHANGE COLUMN `amount` `amount` DECIMAL(32,5) UNSIGNED NOT NULL DEFAULT 0.00000;
ALTER TABLE `roulette_jackpot_games` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_roulette_jackpot_games_ended` ON `roulette_jackpot_games` (`ended`) USING BTREE;