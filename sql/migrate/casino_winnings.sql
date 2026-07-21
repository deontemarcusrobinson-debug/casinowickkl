CREATE TABLE IF NOT EXISTS `casino_winnings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `betid` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_casino_winnings_betid` (`betid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `casino_winnings` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `casino_winnings` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `casino_winnings` CHANGE COLUMN `betid` `betid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `casino_winnings` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `casino_winnings` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_casino_winnings_betid` ON `casino_winnings` (`betid`) USING BTREE;