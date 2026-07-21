CREATE TABLE IF NOT EXISTS `crypto_listings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `canceled` BOOLEAN NOT NULL DEFAULT 0,
    `confirmed` BOOLEAN NOT NULL DEFAULT 0,
    `type` VARCHAR(32) NOT NULL,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `address` VARCHAR(128) NOT NULL,
    `currency` VARCHAR(32) NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_crypto_listings_confirmed_canceled_userid` (`confirmed`, `canceled`, `userid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crypto_listings` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `crypto_listings` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `crypto_listings` CHANGE COLUMN `canceled` `canceled` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `crypto_listings` CHANGE COLUMN `confirmed` `confirmed` BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE `crypto_listings` CHANGE COLUMN `type` `type` VARCHAR(32) NOT NULL;
ALTER TABLE `crypto_listings` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `crypto_listings` CHANGE COLUMN `address` `address` VARCHAR(128) NOT NULL;
ALTER TABLE `crypto_listings` CHANGE COLUMN `currency` `currency` VARCHAR(32) NOT NULL;
ALTER TABLE `crypto_listings` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) UNSIGNED NOT NULL;
ALTER TABLE `crypto_listings` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_crypto_listings_confirmed_canceled_userid` ON `crypto_listings` (`confirmed`, `canceled`, `userid`) USING BTREE;