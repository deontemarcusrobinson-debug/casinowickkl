CREATE TABLE IF NOT EXISTS `casino_bets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `refunded` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `game` VARCHAR(255) NOT NULL,
    `transactionid` BIGINT UNSIGNED NOT NULL,
    `roundid` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UQ_casino_bets_transactionid` (`transactionid`) USING BTREE,
    UNIQUE INDEX `UQ_casino_bets_roundid` (`roundid`) USING BTREE,
    INDEX `IX_casino_bets_userid_refunded` (`userid`, `refunded`) USING BTREE,
    INDEX `IX_casino_bets_userid_game` (`userid`, `game`) USING BTREE,
    INDEX `IX_casino_bets_refunded_time` (`refunded`, `time`) USING BTREE,
    INDEX `IX_casino_bets_game` (`game`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `casino_bets` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `casino_bets` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `casino_bets` CHANGE COLUMN `refunded` `refunded` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `casino_bets` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `casino_bets` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `casino_bets` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `casino_bets` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `casino_bets` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `casino_bets` CHANGE COLUMN `game` `game` VARCHAR(255) NOT NULL;
ALTER TABLE `casino_bets` CHANGE COLUMN `transactionid` `transactionid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `casino_bets` CHANGE COLUMN `roundid` `roundid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `casino_bets` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `UQ_casino_bets_transactionid` ON `casino_bets` (`transactionid`) USING BTREE;
CREATE UNIQUE INDEX IF NOT EXISTS `UQ_casino_bets_roundid` ON `casino_bets` (`roundid`) USING BTREE;

CREATE INDEX IF NOT EXISTS `IX_casino_bets_userid_refunded` ON `casino_bets` (`userid`, `refunded`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_casino_bets_userid_game` ON `casino_bets` (`userid`, `game`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_casino_bets_refunded_time` ON `casino_bets` (`refunded`, `time`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_casino_bets_game` ON `casino_bets` (`game`) USING BTREE;