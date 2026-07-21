CREATE TABLE IF NOT EXISTS `chat_ignore` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `ignoreid` VARCHAR(36) BINARY NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_chat_ignore_removed_ignoreid` (`removed`, `ignoreid`) USING BTREE,
    INDEX `IX_chat_ignore_userid_ignoreid_removed` (`userid`, `ignoreid`, `removed`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `chat_ignore` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `chat_ignore` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `chat_ignore` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `chat_ignore` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `chat_ignore` CHANGE COLUMN `ignoreid` `ignoreid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `chat_ignore` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_chat_ignore_removed_ignoreid` ON `chat_ignore` (`removed`, `ignoreid`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_chat_ignore_userid_ignoreid_removed` ON `chat_ignore` (`userid`, `ignoreid`, `removed`) USING BTREE;