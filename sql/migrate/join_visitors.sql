CREATE TABLE IF NOT EXISTS `join_visitors` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `link` VARCHAR(2048) NOT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `agent` TEXT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_join_visitors_time` (`time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `join_visitors` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `join_visitors` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `join_visitors` CHANGE COLUMN `link` `link` VARCHAR(2048) NOT NULL;
ALTER TABLE `join_visitors` CHANGE COLUMN `ip` `ip` VARCHAR(45) NOT NULL;
ALTER TABLE `join_visitors` CHANGE COLUMN `location` `location` VARCHAR(255) NOT NULL;
ALTER TABLE `join_visitors` CHANGE COLUMN `agent` `agent` TEXT NOT NULL;
ALTER TABLE `join_visitors` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_join_visitors_time` ON `join_visitors` (`time`) USING BTREE;