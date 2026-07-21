CREATE TABLE IF NOT EXISTS `coinflip_games` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `canceled` BOOLEAN NOT NULL DEFAULT 0,
    `ended` BOOLEAN NOT NULL DEFAULT 0,
    `creator` VARCHAR(36) BINARY NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `server_seed` VARCHAR(64) BINARY NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_coinflip_games_ended_canceled` (`ended`, `canceled`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `coinflip_games` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `coinflip_games` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `coinflip_games` CHANGE COLUMN `canceled` `canceled` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `coinflip_games` CHANGE COLUMN `ended` `ended` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `coinflip_games` CHANGE COLUMN `creator` `creator` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `coinflip_games` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `coinflip_games` CHANGE COLUMN `server_seed` `server_seed` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `coinflip_games` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_coinflip_games_ended_canceled` ON `coinflip_games` (`ended`, `canceled`) USING BTREE;