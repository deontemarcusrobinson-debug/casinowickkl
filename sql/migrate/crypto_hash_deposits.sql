CREATE TABLE IF NOT EXISTS `crypto_hash_deposits` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `status` TINYINT NOT NULL DEFAULT 0,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `currency` VARCHAR(32) NOT NULL,
    `tx_hash` VARCHAR(128) NOT NULL,
    `to_address` VARCHAR(128) NOT NULL,
    `from_address` VARCHAR(128) NOT NULL DEFAULT '',
    `crypto_amount` DOUBLE UNSIGNED NOT NULL DEFAULT 0,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `exchange` DECIMAL(32,8) UNSIGNED NOT NULL DEFAULT 0,
    `confirmations` INT UNSIGNED NOT NULL DEFAULT 0,
    `verify_json` TEXT NULL,
    `adminid` VARCHAR(36) BINARY NULL,
    `reject_reason` VARCHAR(255) NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    `approved_time` BIGINT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UQ_crypto_hash_deposits_tx_hash` (`tx_hash`) USING BTREE,
    INDEX `IX_crypto_hash_deposits_status_time` (`status`, `time`) USING BTREE,
    INDEX `IX_crypto_hash_deposits_userid` (`userid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crypto_hash_deposits` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `status` `status` TINYINT NOT NULL DEFAULT 0;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `currency` `currency` VARCHAR(32) NOT NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `tx_hash` `tx_hash` VARCHAR(128) NOT NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `to_address` `to_address` VARCHAR(128) NOT NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `from_address` `from_address` VARCHAR(128) NOT NULL DEFAULT '';
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `crypto_amount` `crypto_amount` DOUBLE UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `exchange` `exchange` DECIMAL(32,8) UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `confirmations` `confirmations` INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `verify_json` `verify_json` TEXT NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `adminid` `adminid` VARCHAR(36) BINARY NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `reject_reason` `reject_reason` VARCHAR(255) NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `crypto_hash_deposits` CHANGE COLUMN `approved_time` `approved_time` BIGINT UNSIGNED NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `UQ_crypto_hash_deposits_tx_hash` ON `crypto_hash_deposits` (`tx_hash`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_crypto_hash_deposits_status_time` ON `crypto_hash_deposits` (`status`, `time`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_crypto_hash_deposits_userid` ON `crypto_hash_deposits` (`userid`) USING BTREE;
