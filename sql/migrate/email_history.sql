CREATE TABLE IF NOT EXISTS `email_history` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `time` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `email_history` CHARACTER SET=utf8mb4, COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `email_history` CHANGE COLUMN `id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `email_history` CHANGE COLUMN `email` `email` VARCHAR(255) NOT NULL;
ALTER TABLE `email_history` CHANGE COLUMN `subject` `subject` VARCHAR(255) NOT NULL;
ALTER TABLE `email_history` CHANGE COLUMN `message` `message` TEXT NOT NULL;
ALTER TABLE `email_history` CHANGE COLUMN `time` `time` BIGINT UNSIGNED NOT NULL;