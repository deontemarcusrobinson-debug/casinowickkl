CREATE TABLE IF NOT EXISTS `roulette_rolls` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `ended` BOOLEAN NOT NULL DEFAULT 0,
    `roll` TINYINT UNSIGNED NOT NULL,
    `progress` DECIMAL(32,5) UNSIGNED NOT NULL,
    `seedid` BIGINT UNSIGNED NOT NULL,
    `nonce` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_roulette_rolls_ended_seedid` (`ended`, `seedid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `roulette_rolls` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `roulette_rolls` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `roulette_rolls` CHANGE COLUMN `ended` `ended` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `roulette_rolls` CHANGE COLUMN `roll` `roll` TINYINT UNSIGNED NOT NULL;
ALTER TABLE `roulette_rolls` CHANGE COLUMN `progress` `progress` DECIMAL(32,5) UNSIGNED NOT NULL;
ALTER TABLE `roulette_rolls` CHANGE COLUMN `seedid` `seedid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `roulette_rolls` CHANGE COLUMN `nonce` `nonce` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `roulette_rolls` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_roulette_rolls_ended_seedid` ON `roulette_rolls` (`ended`, `seedid`) USING BTREE;