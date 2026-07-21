/**
 * Resolve MySQL settings for local .env, Render, and Railway.
 * Prefer MYSQL* / DATABASE_URL when present, else DB_*.
 */
function resolveDatabaseConfig() {
    var url = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PRIVATE_URL;
    if(url) {
        try {
            var parsed = new URL(url);
            return {
                database: decodeURIComponent((parsed.pathname || '').replace(/^\//, '')) || process.env.DB_DATABASE,
                host: parsed.hostname,
                port: parseInt(parsed.port || process.env.DB_PORT || '3306', 10),
                user: decodeURIComponent(parsed.username || ''),
                password: decodeURIComponent(parsed.password || '')
            };
        } catch (e) {
            // fall through to discrete vars
        }
    }

    return {
        database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_DATABASE,
        host: process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST,
        port: parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
        user: process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USERNAME,
        password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || ''
    };
}

module.exports = { resolveDatabaseConfig };
