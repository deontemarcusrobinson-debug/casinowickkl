CREATE TABLE IF NOT EXISTS `tower_bets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `ended` BOOLEAN NOT NULL DEFAULT 0,
    `cashout` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `difficulty` VARCHAR(32) NOT NULL,
    `winning` DECIMAL(32,2) NOT NULL DEFAULT 0.00,
    `route` VARCHAR(9) DEFAULT NULL,
    `roll` VARCHAR(9) NOT NULL,
    `server_seedid` BIGINT UNSIGNED NOT NULL,
    `client_seedid` BIGINT UNSIGNED NOT NULL,
    `nonce` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_tower_bets_userid_ended` (`userid`, `ended`) USING BTREE,
    INDEX `IX_tower_bets_ended_time` (`ended`, `time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `tower_bets` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `tower_bets` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `tower_bets` CHANGE COLUMN `ended` `ended` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `tower_bets` CHANGE COLUMN `cashout` `cashout` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `tower_bets` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `tower_bets` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `tower_bets` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `tower_bets` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `tower_bets` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `tower_bets` CHANGE COLUMN `difficulty` `difficulty` VARCHAR(32) NOT NULL;
ALTER TABLE `tower_bets` CHANGE COLUMN `winning` `winning` DECIMAL(32,2) NOT NULL DEFAULT 0.00;
ALTER TABLE `tower_bets` CHANGE COLUMN `route` `route` VARCHAR(9) DEFAULT NULL;
ALTER TABLE `tower_bets` CHANGE COLUMN `roll` `roll` VARCHAR(9) NOT NULL;
ALTER TABLE `tower_bets` CHANGE COLUMN `server_seedid` `server_seedid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `tower_bets` CHANGE COLUMN `client_seedid` `client_seedid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `tower_bets` CHANGE COLUMN `nonce` `nonce` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `tower_bets` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_tower_bets_userid_ended` ON `tower_bets` (`userid`, `ended`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_tower_bets_ended_time` ON `tower_bets` (`ended`, `time`) USING BTREE;