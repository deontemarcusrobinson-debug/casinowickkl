CREATE TABLE IF NOT EXISTS `users_client_seeds` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `seed` VARCHAR(32) BINARY NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_users_client_seeds_userid_removed` (`userid`, `removed`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_client_seeds` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_client_seeds` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `users_client_seeds` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `users_client_seeds` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `users_client_seeds` CHANGE COLUMN `seed` `seed` VARCHAR(32) BINARY NOT NULL;
ALTER TABLE `users_client_seeds` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_users_client_seeds_userid_removed` ON `users_client_seeds` (`userid`, `removed`) USING BTREE;