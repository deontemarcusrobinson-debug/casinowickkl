CREATE TABLE IF NOT EXISTS `users_links` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `provider` VARCHAR(32) NOT NULL,
    `providerid` VARCHAR(32) NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_users_links_userid_provider_removed` (`userid`, `provider`, `removed`) USING BTREE,
    INDEX `IX_users_links_provider_providerid_removed` (`provider`, `providerid`, `removed`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_links` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_links` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `users_links` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `users_links` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `users_links` CHANGE COLUMN `provider` `provider` VARCHAR(32) NOT NULL;
ALTER TABLE `users_links` CHANGE COLUMN `providerid` `providerid` VARCHAR(32) NOT NULL;
ALTER TABLE `users_links` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_users_links_userid_provider_removed` ON `users_links` (`userid`, `provider`, `removed`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_links_provider_providerid_removed` ON `users_links` (`provider`, `providerid`, `removed`) USING BTREE;