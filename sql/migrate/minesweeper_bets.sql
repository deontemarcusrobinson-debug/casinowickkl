CREATE TABLE IF NOT EXISTS `minesweeper_bets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `ended` BOOLEAN NOT NULL DEFAULT 0,
    `cashout` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `bombs` TINYINT UNSIGNED NOT NULL,
    `winning` DECIMAL(32,2) UNSIGNED NOT NULL DEFAULT 0.00,
    `route` VARCHAR(50) DEFAULT NULL,
    `roll` VARCHAR(50) NOT NULL,
    `server_seedid` BIGINT UNSIGNED NOT NULL,
    `client_seedid` BIGINT UNSIGNED NOT NULL,
    `nonce` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_minesweeper_bets_userid_ended` (`userid`, `ended`) USING BTREE,
    INDEX `IX_minesweeper_bets_ended_time` (`ended`, `time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `minesweeper_bets` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `minesweeper_bets` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `ended` `ended` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `cashout` `cashout` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `bombs` `bombs` TINYINT UNSIGNED NOT NULL;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `winning` `winning` DECIMAL(32,2) UNSIGNED NOT NULL DEFAULT 0.00;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `route` `route` VARCHAR(50) DEFAULT NULL;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `roll` `roll` VARCHAR(50) NOT NULL;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `server_seedid` `server_seedid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `client_seedid` `client_seedid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `nonce` `nonce` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `minesweeper_bets` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_minesweeper_bets_userid_ended` ON `minesweeper_bets` (`userid`, `ended`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_minesweeper_bets_ended_time` ON `minesweeper_bets` (`ended`, `time`) USING BTREE;