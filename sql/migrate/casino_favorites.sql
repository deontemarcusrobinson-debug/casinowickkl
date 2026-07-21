CREATE TABLE IF NOT EXISTS `casino_favorites` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `game` VARCHAR(255) NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_casino_favorites_removed` (`removed`) USING BTREE,
    INDEX `IX_casino_favorites_userid_game_removed` (`userid`, `game`, `removed`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `casino_favorites` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `casino_favorites` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `casino_favorites` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `casino_favorites` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `casino_favorites` CHANGE COLUMN `game` `game` VARCHAR(255) NOT NULL;
ALTER TABLE `casino_favorites` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_casino_favorites_removed` ON `casino_favorites` (`removed`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_casino_favorites_userid_game_removed` ON `casino_favorites` (`userid`, `game`, `removed`) USING BTREE;