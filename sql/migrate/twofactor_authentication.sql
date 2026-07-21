CREATE TABLE IF NOT EXISTS `twofactor_authentication` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `removed` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `method` VARCHAR(32) NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_twofactor_authentication_userid_removed` (`userid`, `removed`) USING BTREE,
    INDEX `IX_twofactor_authentication_userid_method_removed` (`userid`, `method`, `removed`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `twofactor_authentication` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `twofactor_authentication` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `twofactor_authentication` CHANGE COLUMN `removed` `removed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `twofactor_authentication` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `twofactor_authentication` CHANGE COLUMN `method` `method` VARCHAR(32) NOT NULL;
ALTER TABLE `twofactor_authentication` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_twofactor_authentication_userid_removed` ON `twofactor_authentication` (`userid`, `removed`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_twofactor_authentication_userid_method_removed` ON `twofactor_authentication` (`userid`, `method`, `removed`) USING BTREE;