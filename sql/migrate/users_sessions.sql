CREATE TABLE IF NOT EXISTS `users_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `session` VARCHAR(64) BINARY NOT NULL,
    `device` VARCHAR(64) BINARY NOT NULL,
    `expire` BIGINT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_users_sessions_userid_removed_expire` (`userid`, `removed`, `expire`) USING BTREE,
    INDEX `IX_users_sessions_userid_device_removed_expire` (`userid`, `device`, `removed`, `expire`) USING BTREE,
    INDEX `IX_users_sessions_userid_session_device_removed_expire` (`userid`, `session`, `device`, `removed`, `expire`) USING BTREE,
    INDEX `IX_users_sessions_session_device_removed_expire_userid` (`session`, `device`, `removed`, `expire`, `userid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_sessions` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_sessions` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `users_sessions` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `users_sessions` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `users_sessions` CHANGE COLUMN `session` `session` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `users_sessions` CHANGE COLUMN `device` `device` VARCHAR(64) BINARY NOT NULL;
ALTER TABLE `users_sessions` CHANGE COLUMN `expire` `expire` BIGINT NOT NULL;
ALTER TABLE `users_sessions` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_users_sessions_userid_removed_expire` ON `users_sessions` (`userid`, `removed`, `expire`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_sessions_userid_device_removed_expire` ON `users_sessions` (`userid`, `device`, `removed`, `expire`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_sessions_userid_session_device_removed_expire` ON `users_sessions` (`userid`, `session`, `device`, `removed`, `expire`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_sessions_session_device_removed_expire_userid` ON `users_sessions` (`session`, `device`, `removed`, `expire`, `userid`) USING BTREE;