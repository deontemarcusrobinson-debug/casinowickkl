/**
 * Ensure listed emails are owners + on the admin whitelist (settings.json).
 * Safe to run on every boot — needed on Render because DB userids differ from local.
 *
 * ADMIN_EMAILS=a@x.com,b@y.com
 */
require('dotenv').config();

var fs = require('fs');
var path = require('path');
var mysql = require('mysql2');

var ROOT = path.join(__dirname, '..');
var settingsPath = path.join(ROOT, 'settings.json');
var dbHelperPath = path.join(ROOT, 'config', 'databaseEnv.js');

function resolveDatabaseConfig() {
    if(fs.existsSync(dbHelperPath)) {
        return require(dbHelperPath).resolveDatabaseConfig();
    }
    return {
        database: process.env.MYSQLDATABASE || process.env.DB_DATABASE,
        host: process.env.MYSQLHOST || process.env.DB_HOST,
        port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10),
        user: process.env.MYSQLUSER || process.env.DB_USERNAME,
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || ''
    };
}

function parseEmails() {
    var raw = process.env.ADMIN_EMAILS || 'nbtnateyt@gmail.com,nbtrobinson@gmail.com';
    return raw.split(',')
        .map(function(s) { return String(s || '').trim().toLowerCase(); })
        .filter(Boolean);
}

function grantAdmins(callback) {
    var emails = parseEmails();
    if(!emails.length) {
        console.log('[admin] ADMIN_EMAILS empty — skip');
        return callback(null, []);
    }

    var db = resolveDatabaseConfig();
    if(!db.host || !db.user || !db.database) {
        return callback(new Error('MySQL env missing for grantAdmins'));
    }

    var conn = mysql.createConnection({
        host: db.host,
        port: db.port || 3306,
        user: db.user,
        password: db.password || '',
        database: db.database
    });

    conn.connect(function(errConnect) {
        if(errConnect) {
            conn.destroy();
            return callback(errConnect);
        }

        var placeholders = emails.map(function() { return '?'; }).join(',');
        var sql = 'SELECT `id`, `userid`, `email`, `rank` FROM `users` WHERE LOWER(`email`) IN (' + placeholders + ')';

        conn.query(sql, emails, function(errQuery, rows) {
            if(errQuery) {
                conn.destroy();
                return callback(errQuery);
            }

            rows = rows || [];
            var found = {};
            rows.forEach(function(r) { found[String(r.email).toLowerCase()] = r; });

            emails.forEach(function(email) {
                if(!found[email]) {
                    console.warn('[admin] No account yet for ' + email + ' — sign up once, then redeploy (or wait for next boot).');
                }
            });

            if(!rows.length) {
                conn.destroy();
                return callback(null, []);
            }

            var ids = rows.map(function(r) { return r.id; });
            var idPlaceholders = ids.map(function() { return '?'; }).join(',');

            conn.query('UPDATE `users` SET `rank` = 100 WHERE `id` IN (' + idPlaceholders + ')', ids, function(errUpdate) {
                conn.destroy();
                if(errUpdate) return callback(errUpdate);

                var settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                if(!settings.allowed) settings.allowed = {};
                if(!Array.isArray(settings.allowed.admin)) settings.allowed.admin = [];

                var changed = false;
                rows.forEach(function(r) {
                    if(settings.allowed.admin.indexOf(r.userid) === -1) {
                        settings.allowed.admin.push(r.userid);
                        changed = true;
                    }
                    console.log('[admin] Granted owner+whitelist → ' + r.email + ' (' + r.userid + ')');
                });

                if(changed) {
                    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4));
                    console.log('[admin] Updated settings.json allowed.admin');
                } else {
                    console.log('[admin] settings.json already contains these admins');
                }

                callback(null, rows.map(function(r) { return r.email; }));
            });
        });
    });
}

if(require.main === module) {
    grantAdmins(function(err, granted) {
        if(err) {
            console.error('[admin] Failed:', err.message || err);
            process.exit(1);
        }
        console.log('[admin] Done. Granted: ' + (granted && granted.length ? granted.join(', ') : '(none yet)'));
        process.exit(0);
    });
}

module.exports = { grantAdmins, parseEmails };
