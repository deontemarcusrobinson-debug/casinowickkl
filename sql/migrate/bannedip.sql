CREATE TABLE IF NOT EXISTS `bannedip` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `ip` VARCHAR(45) NOT NULL,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_bannedip_ip_removed` (`ip`, `removed`) USING BTREE,
    INDEX `IX_bannedip_removed_ip` (`removed`, `ip`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `bannedip` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `bannedip` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `bannedip` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `bannedip` CHANGE COLUMN `ip` `ip` VARCHAR(45) NOT NULL;
ALTER TABLE `bannedip` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `bannedip` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_bannedip_ip_removed` ON `bannedip` (`ip`, `removed`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_bannedip_removed_ip` ON `bannedip` (`removed`, `ip`) USING BTREE;