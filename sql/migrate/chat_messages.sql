CREATE TABLE IF NOT EXISTS `chat_messages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `anonymous` BOOLEAN NOT NULL,
    `private` BOOLEAN NOT NULL,
    `rank` TINYINT UNSIGNED NOT NULL,
    `message` TEXT NOT NULL,
    `channel` VARCHAR(32) NOT NULL,
    `reply` BIGINT UNSIGNED DEFAULT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_chat_messages_deleted_reply` (`deleted`, `reply`) USING BTREE,
    INDEX `IX_chat_messages_channel_deleted` (`channel`, `deleted`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `chat_messages` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `chat_messages` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `chat_messages` CHANGE COLUMN `deleted` `deleted` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `chat_messages` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `chat_messages` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `chat_messages` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `chat_messages` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `chat_messages` CHANGE COLUMN `anonymous` `anonymous` BOOLEAN NOT NULL;
ALTER TABLE `chat_messages` CHANGE COLUMN `private` `private` BOOLEAN NOT NULL;
ALTER TABLE `chat_messages` CHANGE COLUMN `rank` `rank` TINYINT UNSIGNED NOT NULL;
ALTER TABLE `chat_messages` CHANGE COLUMN `message` `message` TEXT NOT NULL;
ALTER TABLE `chat_messages` CHANGE COLUMN `channel` `channel` VARCHAR(32) NOT NULL;
ALTER TABLE `chat_messages` CHANGE COLUMN `reply` `reply` BIGINT UNSIGNED DEFAULT NULL;
ALTER TABLE `chat_messages` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_chat_messages_deleted_reply` ON `chat_messages` (`deleted`, `reply`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_chat_messages_channel_deleted` ON `chat_messages` (`channel`, `deleted`) USING BTREE;