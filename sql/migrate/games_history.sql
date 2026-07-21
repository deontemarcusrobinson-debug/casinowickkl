CREATE TABLE IF NOT EXISTS `games_history` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `visible` BOOLEAN NOT NULL,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `anonymous` BOOLEAN NOT NULL,
    `category` VARCHAR(32) NOT NULL,
    `gameid` VARCHAR(255) NOT NULL,
    `game` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `winning` DECIMAL(32,2) UNSIGNED NOT NULL,
    `multiplier` DECIMAL(32,2) UNSIGNED NOT NULL,
    `betid` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_games_history_visible_winning` (`visible`, `winning`) USING BTREE,
    INDEX `IX_games_history_game_visible` (`game`, `visible`) USING BTREE,
    INDEX `IX_games_history_userid_category` (`userid`, `category`) USING BTREE,
    INDEX `IX_games_history_userid_game` (`userid`, `game`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `games_history` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `games_history` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `games_history` CHANGE COLUMN `visible` `visible` BOOLEAN NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `anonymous` `anonymous` BOOLEAN NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `category` `category` VARCHAR(32) NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `gameid` `gameid` VARCHAR(255) NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `game` `game` VARCHAR(255) NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `winning` `winning` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `multiplier` `multiplier` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `betid` `betid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `games_history` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_games_history_visible_winning` ON `games_history` (`visible`, `winning`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_games_history_game_visible` ON `games_history` (`game`, `visible`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_games_history_userid_category` ON `games_history` (`userid`, `category`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_games_history_userid_game` ON `games_history` (`userid`, `game`) USING BTREE;