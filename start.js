/**
 * Root entrypoint for Render / Railway / production.
 * Lives at project root so deploys don't depend on scripts/ being uploaded alone.
 *
 * 1) wait for MySQL
 * 2) create DB + migrate if scripts/database.js exists
 * 3) start app.js
 */
require('dotenv').config();

var { spawn } = require('child_process');
var path = require('path');
var fs = require('fs');
var mysql = require('mysql');

var ROOT = __dirname;
var dbHelperPath = path.join(ROOT, 'config', 'databaseEnv.js');
var migrateScript = path.join(ROOT, 'scripts', 'database.js');
var appScript = path.join(ROOT, 'app.js');

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

function ensureRuntimeDirs() {
    ['logs', 'errors'].forEach(function(dir) {
        var full = path.join(ROOT, dir);
        try {
            if(!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
        } catch(e) {}
    });
}

function setDefaults() {
    if(!process.env.APP_NAME) process.env.APP_NAME = 'GoldWitch.com';
    if(!process.env.APP_ABBREVIATION) process.env.APP_ABBREVIATION = 'GoldWitch';
    if(!process.env.APP_SECURE) process.env.APP_SECURE = 'false';
    if(!process.env.APP_ENV) process.env.APP_ENV = 'production';
    if(!process.env.SESSION_SECRET) {
        process.env.SESSION_SECRET = require('crypto').randomBytes(24).toString('hex');
        console.log('[boot] SESSION_SECRET was empty — generated one for this boot');
    }

    if(!process.env.APP_URL || String(process.env.APP_URL).indexOf('YOUR') !== -1) {
        var domain = process.env.RENDER_EXTERNAL_URL
            || process.env.RAILWAY_PUBLIC_DOMAIN
            || process.env.RAILWAY_STATIC_URL;
        if(domain) {
            if(domain.indexOf('http') !== 0) domain = 'https://' + domain;
            process.env.APP_URL = domain.replace(/\/$/, '');
            console.log('[boot] APP_URL set from host → ' + process.env.APP_URL);
        } else {
            process.env.APP_URL = 'http://localhost:' + (process.env.PORT || '3000');
            console.log('[boot] APP_URL fallback → ' + process.env.APP_URL);
        }
    }
}

function waitForMysql(attempts, callback) {
    var db = resolveDatabaseConfig();
    var left = attempts;

    console.log('[boot] MySQL target host=' + (db.host || '(missing)') +
        ' port=' + (db.port || 3306) +
        ' user=' + (db.user || '(missing)') +
        ' database=' + (db.database || '(missing)'));

    if(!db.host || !db.user) {
        return callback(new Error(
            'MySQL env vars missing. On Render: deploy MySQL (Blueprint) or set MYSQLHOST/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE.'
        ));
    }

    function tryOnce() {
        var conn = mysql.createConnection({
            host: db.host,
            port: db.port || 3306,
            user: db.user,
            password: db.password || '',
            connectTimeout: 8000
        });

        conn.connect(function(err) {
            if(!err) {
                conn.end();
                return callback(null);
            }

            conn.destroy();
            left--;
            if(left <= 0) return callback(err);

            console.log('[boot] Waiting for MySQL… (' + left + ' left) ' + (err.message || err.code));
            setTimeout(tryOnce, 5000);
        });
    }

    tryOnce();
}

function runNodeScript(relArgs, callback) {
    var child = spawn(process.execPath, relArgs, {
        cwd: ROOT,
        stdio: 'inherit',
        env: process.env
    });

    child.on('exit', function(code) {
        if(code !== 0) return callback(new Error(relArgs.join(' ') + ' exited with ' + code));
        callback(null);
    });
}

function startApp() {
    if(!fs.existsSync(appScript)) {
        console.error('[boot] FATAL: app.js is missing from the deploy. Upload the FULL project, not just a few root files.');
        process.exit(1);
    }

    // Verify a core table exists before serving traffic
    var db = resolveDatabaseConfig();
    var check = mysql.createConnection({
        host: db.host,
        port: db.port || 3306,
        user: db.user,
        password: db.password || '',
        database: db.database,
        connectTimeout: 8000
    });
    check.query('SELECT 1 FROM `bannedip` LIMIT 1', function(errCheck) {
        check.destroy();
        if(errCheck) {
            console.error('[boot] Post-migrate check failed:', errCheck.code || '', errCheck.message || errCheck);
            console.error('[boot] Tables may be missing. Fix MySQL env / migrate, then redeploy.');
            process.exit(1);
        }

        console.log('[boot] Starting GoldWitch on PORT=' + (process.env.PORT || process.env.APP_PORT || '3000'));
        var child = spawn(process.execPath, ['app.js'], {
            cwd: ROOT,
            stdio: 'inherit',
            env: process.env
        });

        child.on('exit', function(code) {
            console.error('[boot] App process exited with code ' + code);
            process.exit(code || 0);
        });
    });
}

function migrateThenStart() {
    if(!fs.existsSync(migrateScript)) {
        console.warn('[boot] scripts/database.js missing — starting without migrate. Upload full project for auto-migrate.');
        return startApp();
    }

    console.log('[boot] MySQL is up — ensuring database + tables…');

    runNodeScript(['scripts/database.js', '--create'], function(err2) {
        if(err2) {
            console.error('[boot] create failed:', err2.message || err2);
            process.exit(1);
        }

        runNodeScript(['scripts/database.js', '--migrate'], function(err3) {
            if(err3) {
                console.error('[boot] migrate failed:', err3.message || err3);
                process.exit(1);
            }

            startApp();
        });
    });
}

ensureRuntimeDirs();
setDefaults();

waitForMysql(120, function(err1) {
    if(err1) {
        console.error('[boot] MySQL not reachable:', err1.message || err1);
        console.error('[boot] Fix: Render needs MySQL private service (or external MySQL) linked, then Redeploy.');
        process.exit(1);
    }

    migrateThenStart();
});
