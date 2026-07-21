CREATE TABLE IF NOT EXISTS `users_logins` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(32) NOT NULL,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `sessionid` BIGINT UNSIGNED NOT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `agent` TEXT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_users_logins_userid_sessionid` (`userid`, `sessionid`) USING BTREE,
    INDEX `IX_users_logins_sessionid` (`sessionid`) USING BTREE,
    INDEX `IX_users_logins_userid_ip` (`userid`, `ip`) USING BTREE,
    INDEX `IX_users_logins_ip_userid` (`ip`, `userid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_logins` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_logins` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `users_logins` CHANGE COLUMN `type` `type` VARCHAR(32) NOT NULL;
ALTER TABLE `users_logins` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `users_logins` CHANGE COLUMN `sessionid` `sessionid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `users_logins` CHANGE COLUMN `ip` `ip` VARCHAR(45) NOT NULL;
ALTER TABLE `users_logins` CHANGE COLUMN `location` `location` VARCHAR(255) NOT NULL;
ALTER TABLE `users_logins` CHANGE COLUMN `agent` `agent` TEXT NOT NULL;
ALTER TABLE `users_logins` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_users_logins_userid_sessionid` ON `users_logins` (`userid`, `sessionid`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_logins_sessionid` ON `users_logins` (`sessionid`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_logins_userid_ip` ON `users_logins` (`userid`, `ip`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_logins_ip_userid` ON `users_logins` (`ip`, `userid`) USING BTREE;