CREATE TABLE IF NOT EXISTS `users_email_change_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `used` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(32) BINARY NOT NULL,
    `expire` BIGINT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_users_email_change_requests_userid_used_removed_expire` (`userid`, `used`, `removed`, `expire`) USING BTREE,
    INDEX `IX_users_email_change_requests_token_used_removed_expire` (`token`, `used`, `removed`, `expire`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_email_change_requests` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_email_change_requests` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `users_email_change_requests` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `users_email_change_requests` CHANGE COLUMN `used` `used` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `users_email_change_requests` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `users_email_change_requests` CHANGE COLUMN `email` `email` VARCHAR(255) NOT NULL;
ALTER TABLE `users_email_change_requests` CHANGE COLUMN `token` `token` VARCHAR(32) BINARY NOT NULL;
ALTER TABLE `users_email_change_requests` CHANGE COLUMN `expire` `expire` BIGINT NOT NULL;
ALTER TABLE `users_email_change_requests` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_users_email_change_requests_userid_used_removed_expire` ON `users_email_change_requests` (`userid`, `used`, `removed`, `expire`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_email_change_requests_token_used_removed_expire` ON `users_email_change_requests` (`token`, `used`, `removed`, `expire`) USING BTREE;