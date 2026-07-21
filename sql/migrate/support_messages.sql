CREATE TABLE IF NOT EXISTS `support_messages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `message` TEXT NOT NULL,
    `requestid` BIGINT UNSIGNED NOT NULL,
    `response` BOOLEAN NOT NULL DEFAULT 0,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_support_messages_requestid` (`requestid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `support_messages` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `support_messages` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `support_messages` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `support_messages` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `support_messages` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `support_messages` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `support_messages` CHANGE COLUMN `message` `message` TEXT NOT NULL;
ALTER TABLE `support_messages` CHANGE COLUMN `requestid` `requestid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `support_messages` CHANGE COLUMN `response` `response` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `support_messages` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_support_messages_requestid` ON `support_messages` (`requestid`) USING BTREE;