CREATE TABLE IF NOT EXISTS `support_claims` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `ended` BOOLEAN NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `requestid` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_support_claims_requestid_ended` (`requestid`, `ended`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `support_claims` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `support_claims` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `support_claims` CHANGE COLUMN `ended` `ended` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `support_claims` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `support_claims` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `support_claims` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `support_claims` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `support_claims` CHANGE COLUMN `requestid` `requestid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `support_claims` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_support_claims_requestid_ended` ON `support_claims` (`requestid`, `ended`) USING BTREE;