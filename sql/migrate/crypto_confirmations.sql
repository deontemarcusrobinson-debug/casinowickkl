CREATE TABLE IF NOT EXISTS `crypto_confirmations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `listingid` BIGINT UNSIGNED NOT NULL,
    `transactionid` BIGINT UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UQ_crypto_confirmations_listingid` (`listingid`) USING BTREE,
    UNIQUE INDEX `UQ_crypto_confirmations_transactionid` (`transactionid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crypto_confirmations` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crypto_confirmations` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `crypto_confirmations` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `crypto_confirmations` CHANGE COLUMN `listingid` `listingid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `crypto_confirmations` CHANGE COLUMN `transactionid` `transactionid` BIGINT UNSIGNED NOT NULL;
ALTER TABLE `crypto_confirmations` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `UQ_crypto_confirmations_listingid` ON `crypto_confirmations` (`listingid`) USING BTREE;
CREATE UNIQUE INDEX IF NOT EXISTS `UQ_crypto_confirmations_transactionid` ON `crypto_confirmations` (`transactionid`) USING BTREE;