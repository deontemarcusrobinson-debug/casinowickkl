CREATE TABLE IF NOT EXISTS `bonus_codes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `uses` BIGINT UNSIGNED NOT NULL,
    `expire` BIGINT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `IX_bonus_codes_code` (`code`) USING BTREE,
    INDEX `IX_bonus_codes_removed_uses_expire` (`removed`, `uses`, `expire`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `bonus_codes` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `bonus_codes` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `bonus_codes` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `bonus_codes` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `bonus_codes` CHANGE COLUMN `code` `code` VARCHAR(32) NOT NULL;
ALTER TABLE `bonus_codes` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `bonus_codes` CHANGE COLUMN `uses` `uses` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `bonus_codes` CHANGE COLUMN `expire` `expire` BIGINT NOT NULL;
ALTER TABLE `bonus_codes` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `IX_bonus_codes_code` ON `bonus_codes` (`code`) USING BTREE;

CREATE INDEX IF NOT EXISTS `IX_bonus_codes_removed_uses_expire` ON `bonus_codes` (`removed`, `uses`, `expire`) USING BTREE;