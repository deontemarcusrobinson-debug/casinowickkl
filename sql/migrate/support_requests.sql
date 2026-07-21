CREATE TABLE IF NOT EXISTS `support_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `closed` BOOLEAN NOT NULL DEFAULT 0,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `department` TINYINT UNSIGNED NOT NULL,
    `requestid` VARCHAR(36) BINARY NOT NULL,
    `update` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UQ_support_requests_requestid` (`requestid`) USING BTREE,
    INDEX `IX_support_requests_userid_status` (`userid`, `status`) USING BTREE,
    INDEX `IX_support_requests_userid_closed` (`userid`, `closed`) USING BTREE,
    INDEX `IX_support_requests_status` (`status`) USING BTREE,
    INDEX `IX_support_requests_department_status_closed` (`department`, `status`, `closed`) USING BTREE,
    INDEX `IX_support_requests_department_closed` (`department`, `closed`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `support_requests` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `support_requests` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `support_requests` CHANGE COLUMN `closed` `closed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `support_requests` CHANGE COLUMN `status` `status` TINYINT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `support_requests` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `support_requests` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `support_requests` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `support_requests` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `support_requests` CHANGE COLUMN `subject` `subject` VARCHAR(255) NOT NULL;
ALTER TABLE `support_requests` CHANGE COLUMN `department` `department` TINYINT UNSIGNED NOT NULL;
ALTER TABLE `support_requests` CHANGE COLUMN `requestid` `requestid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `support_requests` CHANGE COLUMN `update` `update` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `support_requests` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `UQ_support_requests_requestid` ON `support_requests` (`requestid`) USING BTREE;

CREATE INDEX IF NOT EXISTS `IX_support_requests_userid_status` ON `support_requests` (`userid`, `status`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_support_requests_userid_closed` ON `support_requests` (`userid`, `closed`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_support_requests_status` ON `support_requests` (`status`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_support_requests_department_status_closed` ON `support_requests` (`department`, `status`, `closed`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_support_requests_department_closed` ON `support_requests` (`department`, `closed`) USING BTREE;