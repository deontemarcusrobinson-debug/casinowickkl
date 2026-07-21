CREATE TABLE IF NOT EXISTS `users_restrictions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `restriction` VARCHAR(32) NOT NULL,
    `reason` TEXT NOT NULL,
    `adminid` VARCHAR(36) BINARY NOT NULL,
    `expire` BIGINT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_users_restrictions_userid_removed_expire` (`userid`, `removed`, `expire`) USING BTREE,
    INDEX `IX_users_restrictions_userid_restriction_removed_expire_adminid` (`userid`, `restriction`, `removed`, `expire`, `adminid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_restrictions` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_restrictions` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `users_restrictions` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `users_restrictions` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `users_restrictions` CHANGE COLUMN `restriction` `restriction` VARCHAR(32) NOT NULL;
ALTER TABLE `users_restrictions` CHANGE COLUMN `reason` `reason` TEXT NOT NULL;
ALTER TABLE `users_restrictions` CHANGE COLUMN `adminid` `adminid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `users_restrictions` CHANGE COLUMN `expire` `expire` BIGINT NOT NULL;
ALTER TABLE `users_restrictions` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_users_restrictions_userid_removed_expire` ON `users_restrictions` (`userid`, `removed`, `expire`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_restrictions_userid_restriction_removed_expire_adminid` ON `users_restrictions` (`userid`, `restriction`, `removed`, `expire`, `adminid`) USING BTREE;