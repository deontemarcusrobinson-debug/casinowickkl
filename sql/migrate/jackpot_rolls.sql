CREATE TABLE IF NOT EXISTS `jackpot_rolls` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `gameid` BIGINT UNSIGNED NOT NULL,
    `betid` BIGINT UNSIGNED NOT NULL,
    `chance` DECIMAL(5,2) UNSIGNED NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `tickets` BIGINT UNSIGNED NOT NULL,
    `blockid` BIGINT UNSIGNED NOT NULL,
    `public_seed` VARCHAR(64) BINARY NOT NULL,
    `roll` DOUBLE UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_jackpot_rolls_gameid_removed` (`gameid`, `removed`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `jackpot_rolls` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `jackpot_rolls` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `jackpot_rolls` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `jackpot_rolls` CHANGE COLUMN `gameid` `gameid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `jackpot_rolls` CHANGE COLUMN `betid` `betid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `jackpot_rolls` CHANGE COLUMN `chance` `chance` DECIMAL(5,2) UNSIGNED NOT NULL;
ALTER TABLE `jackpot_rolls` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `jackpot_rolls` CHANGE COLUMN `tickets` `tickets` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `jackpot_rolls` CHANGE COLUMN `blockid` `blockid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `jackpot_rolls` CHANGE COLUMN `public_seed` `public_seed` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `jackpot_rolls` CHANGE COLUMN `roll` `roll` DOUBLE UNSIGNED NOT NULL;
ALTER TABLE `jackpot_rolls` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_jackpot_rolls_gameid_removed` ON `jackpot_rolls` (`gameid`, `removed`) USING BTREE;