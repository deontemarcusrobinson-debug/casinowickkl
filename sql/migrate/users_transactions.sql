CREATE TABLE IF NOT EXISTS `users_transactions` ( -- new type column, bet/win/cashback/refund/deposit/withdraw/reward/adjust
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userid` VARCHAR(36) BINARY NOT NULL,
    `transaction` VARCHAR(32) NOT NULL,
    `amount` DECIMAL(32,2) NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `IX_users_transactions_userid_transaction_amount` (`userid`, `transaction`, `amount`) USING BTREE,
    INDEX `IX_users_transactions_userid` (`userid`) USING BTREE,
    INDEX `IX_users_transactions_transaction_amount` (`transaction`, `amount`) USING BTREE,
    INDEX `IX_users_transactions_transaction_time` (`transaction`, `time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_transactions` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users_transactions` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `users_transactions` CHANGE COLUMN `userid` `userid` VARCHAR(36) BINARY NOT NULL;
ALTER TABLE `users_transactions` CHANGE COLUMN `transaction` `transaction` VARCHAR(32) NOT NULL;
ALTER TABLE `users_transactions` CHANGE COLUMN `amount` `amount` DECIMAL(32,2) NOT NULL;
ALTER TABLE `users_transactions` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;

CREATE INDEX IF NOT EXISTS `IX_users_transactions_userid_transaction_amount` ON `users_transactions` (`userid`, `transaction`, `amount`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_transactions_userid` ON `users_transactions` (`userid`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_transactions_transaction_amount` ON `users_transactions` (`transaction`, `amount`) USING BTREE;
CREATE INDEX IF NOT EXISTS `IX_users_transactions_transaction_time` ON `users_transactions` (`transaction`, `time`) USING BTREE;