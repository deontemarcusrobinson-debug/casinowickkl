CREATE TABLE IF NOT EXISTS `coinflip_winnings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `gameid` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `position` TINYINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UQ_coinflip_winnings_gameid` (`gameid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `coinflip_winnings` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `coinflip_winnings` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `coinflip_winnings` CHANGE COLUMN `gameid` `gameid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `coinflip_winnings` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `coinflip_winnings` CHANGE COLUMN `position` `position` TINYINT UNSIGNED NOT NULL;
ALTER TABLE `coinflip_winnings` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `UQ_coinflip_winnings_gameid` ON `coinflip_winnings` (`gameid`) USING BTREE;