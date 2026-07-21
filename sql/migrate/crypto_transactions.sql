CREATE TABLE IF NOT EXISTS `crypto_transactions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `status` TINYINT NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(2048) NOT NULL,
    `xp` BIGINT UNSIGNED NOT NULL,
    `transactionid` BIGINT UNSIGNED NOT NULL,
    `address` VARCHAR(128) NOT NULL,
    `currency` VARCHAR(32) NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `value` DOUBLE UNSIGNED NOT NULL,
    `paid` DOUBLE UNSIGNED NOT NULL DEFAULT 0,
    `exchange` DECIMAL(32,5) UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UQ_crypto_transactions_transactionid` (`transactionid`) USING BTREE,
    INDEX `IX_crypto_transactions_userid_type` (`userid`, `type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crypto_transactions` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crypto_transactions` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `status` `status` TINYINT NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `type` `type` VARCHAR(32) NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `name` `name` VARCHAR(255) NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `avatar` `avatar` VARCHAR(2048) NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `xp` `xp` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `transactionid` `transactionid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `address` `address` VARCHAR(128) NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `currency` `currency` VARCHAR(32) NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `value` `value` DOUBLE UNSIGNED NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `paid` `paid` DOUBLE UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `exchange` `exchange` DECIMAL(32,5) UNSIGNED NOT NULL;
ALTER TABLE `crypto_transactions` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `UQ_crypto_transactions_transactionid` ON `crypto_transactions` (`transactionid`) USING BTREE;

CREATE INDEX IF NOT EXISTS `IX_crypto_transactions_userid_type` ON `crypto_transactions` (`userid`, `type`) USING BTREE;