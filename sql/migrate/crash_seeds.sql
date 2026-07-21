CREATE TABLE IF NOT EXISTS `crash_seeds` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `server_seed` VARCHAR(64) BINARY NOT NULL,
    `public_seed` VARCHAR(64) BINARY NOT NULL,
    `uses` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_crash_seeds_removed_time` (`removed`, `time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crash_seeds` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crash_seeds` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `crash_seeds` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `crash_seeds` CHANGE COLUMN `server_seed` `server_seed` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `crash_seeds` CHANGE COLUMN `public_seed` `public_seed` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `crash_seeds` CHANGE COLUMN `uses` `uses` BIGINT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `crash_seeds` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_crash_seeds_removed_time` ON `crash_seeds` (`removed`, `time`) USING BTREE;