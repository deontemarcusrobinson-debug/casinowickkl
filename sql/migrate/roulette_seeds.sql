CREATE TABLE IF NOT EXISTS `roulette_seeds` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `server_seed` VARCHAR(64) BINARY NOT NULL,
    `public_seed` VARCHAR(64) BINARY NOT NULL,
    `uses` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_roulette_seeds_removed_time` (`removed`, `time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `roulette_seeds` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `roulette_seeds` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `roulette_seeds` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `roulette_seeds` CHANGE COLUMN `server_seed` `server_seed` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `roulette_seeds` CHANGE COLUMN `public_seed` `public_seed` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `roulette_seeds` CHANGE COLUMN `uses` `uses` BIGINT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `roulette_seeds` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_roulette_seeds_removed_time` ON `roulette_seeds` (`removed`, `time`) USING BTREE;