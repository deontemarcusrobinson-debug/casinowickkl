CREATE TABLE IF NOT EXISTS `crash_rolls` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `ended` BOOLEAN NOT NULL DEFAULT 0,
    `point` DECIMAL(32,2) UNSIGNED NOT NULL,
    `seedid` BIGINT UNSIGNED NOT NULL,
    `nonce` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_crash_rolls_ended_seedid` (`ended`, `seedid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crash_rolls` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crash_rolls` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `crash_rolls` CHANGE COLUMN `ended` `ended` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `crash_rolls` CHANGE COLUMN `point` `point` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `crash_rolls` CHANGE COLUMN `seedid` `seedid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `crash_rolls` CHANGE COLUMN `nonce` `nonce` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `crash_rolls` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_crash_rolls_ended_seedid` ON `crash_rolls` (`ended`, `seedid`) USING BTREE;