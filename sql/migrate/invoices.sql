CREATE TABLE IF NOT EXISTS `invoices` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `invoiceid` VARCHAR(64) NOT NULL,
    `userid` VARCHAR(36) BINARY DEFAULT NULL,
    `customer` VARCHAR(255) NOT NULL,
    `product` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(32,2) UNSIGNED NOT NULL,
    `currency` VARCHAR(16) NOT NULL DEFAULT 'USD',
    `provider` VARCHAR(32) NOT NULL DEFAULT 'paypal',
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UQ_invoices_invoiceid` (`invoiceid`) USING BTREE,
    INDEX `IX_invoices_userid` (`userid`) USING BTREE,
    INDEX `IX_invoices_status` (`status`) USING BTREE,
    INDEX `IX_invoices_time` (`time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
