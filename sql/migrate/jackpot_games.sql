CREATE TABLE IF NOT EXISTS `jackpot_games` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `ended` BOOLEAN NOT NULL DEFAULT 0,
    `server_seed` VARCHAR(64) BINARY NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_jackpot_games_ended_time` (`ended`, `time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `jackpot_games` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `jackpot_games` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `jackpot_games` CHANGE COLUMN `ended` `ended` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `jackpot_games` CHANGE COLUMN `server_seed` `server_seed` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `jackpot_games` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_jackpot_games_ended_time` ON `jackpot_games` (`ended`, `time`) USING BTREE;