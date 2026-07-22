# MySQL 8 for Render private service (persistent disk must mount at /var/lib/mysql)
# Use native password plugin so older clients can connect; app uses mysql2 (supports both).
FROM mysql:8.0

CMD ["--default-authentication-plugin=mysql_native_password", "--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci"]

EXPOSE 3306
