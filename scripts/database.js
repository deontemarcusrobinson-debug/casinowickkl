require('dotenv').config();

var mysql = require('mysql2');
var fs = require('fs');
var path = require('path');

var { resolveDatabaseConfig } = require('../config/databaseEnv.js');

var db = resolveDatabaseConfig();
var migrateFolder = path.join(__dirname, '..', 'sql', 'migrate');
var insertFolder = path.join(__dirname, '..', 'sql', 'insert');

function makePool(withDatabase) {
    var opts = {
        host: db.host,
        port: db.port || 3306,
        user: db.user,
        password: db.password || '',
        multipleStatements: true,
        connectTimeout: 20000
    };
    if(withDatabase) opts.database = db.database;
    return mysql.createPool(opts);
}

var pool = makePool(false);

function checkDatabaseExists(callback) {
    pool.query('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ' + pool.escape(db.database), function (err1, row1) {
        if (err1) return callback(err1);
        callback(null, row1.length > 0);
    });
}

function checkTableExists(table, callback) {
    pool.query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ' + pool.escape(db.database) + ' AND TABLE_NAME = ' + pool.escape(table), function (err1, row1) {
        if (err1) return callback(err1);
        callback(null, row1.length > 0);
    });
}

function createDatabase(callback) {
    pool.query('CREATE DATABASE IF NOT EXISTS `' + db.database + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', function (err1) {
        if (err1) return callback(err1);
        callback(null);
    });
}

function useDatabase(callback) {
    pool.query('USE `' + db.database + '`', function (err1) {
        if (err1) return callback(err1);
        callback(null);
    });
}

function runSqlFile(tableName, filePath, kind, callback) {
    fs.readFile(filePath, 'utf8', function(err1, sql) {
        if(err1) return callback(err1);

        // Fresh installs only need CREATE TABLE (indexes are already inline).
        // Skipping ALTER/CREATE INDEX avoids MySQL 8 vs MariaDB syntax traps.
        var statements = String(sql)
            .split(';')
            .map(function(s) { return s.trim(); })
            .filter(function(s) {
                return s.length > 0 && /^\s*CREATE\s+TABLE\b/i.test(s);
            });

        if(statements.length === 0) {
            console.log('\x1b[33m[database] Table ' + tableName + ' — no CREATE TABLE found, skip');
            return callback(null);
        }

        var ignorable = {
            ER_TABLE_EXISTS_ERROR: true,
            ER_DUP_KEYNAME: true,
            ER_DUP_FIELDNAME: true,
            ER_CANT_DROP_FIELD_OR_KEY: true,
            ER_DUP_ENTRY: true
        };

        function runNext(i) {
            if(i >= statements.length) {
                console.log('\x1b[33m[database] Table ' + tableName + ' successfully ' + kind);
                return callback(null);
            }

            pool.query(statements[i], function(err2) {
                if(err2) {
                    if(ignorable[err2.code]) {
                        return runNext(i + 1);
                    }
                    console.error('[database] SQL failed in ' + path.basename(filePath) + ':', err2.code || '', err2.message || err2);
                    return callback(err2);
                }
                runNext(i + 1);
            });
        }

        runNext(0);
    });
}

function processMigrateTables(callback) {
    fs.readdir(migrateFolder, function (err1, files) {
        if (err1) return callback(err1);

        var sqlFiles = files.filter(function (file) {
            return file.endsWith('.sql');
        }).sort();

        function runNext(i) {
            if (i >= sqlFiles.length) return callback(null);

            var fileName = sqlFiles[i];
            var tableName = path.basename(fileName, '.sql');
            var filePath = path.join(migrateFolder, fileName);

            checkTableExists(tableName, function(err2, exists) {
                if(err2) return callback(err2);
                if(exists) {
                    console.log('\x1b[33m[database] Table ' + tableName + ' already exists — skip');
                    return runNext(i + 1);
                }

                runSqlFile(tableName, filePath, 'migrated', function (err3) {
                    if (err3) return callback(err3);
                    runNext(i + 1);
                });
            });
        }

        runNext(0);
    });
}

function processInsertTables(callback) {
    fs.readdir(insertFolder, function (err1, files) {
        if (err1) return callback(err1);

        var sqlFiles = files.filter(function (file) {
            return file.endsWith('.sql');
        }).sort();

        function runNext(i) {
            if (i >= sqlFiles.length) return callback(null);

            var fileName = sqlFiles[i];
            var tableName = path.basename(fileName, '.sql');
            var filePath = path.join(insertFolder, fileName);

            checkTableExists(tableName, function (err2, exists) {
                if (err2) return callback(err2);
                if (!exists) return callback(new Error('Table ' + tableName + ' does not exists'));

                runSqlFile(tableName, filePath, 'inserted', function (err3) {
                    if (err3) return callback(err3);
                    runNext(i + 1);
                });
            });
        }

        runNext(0);
    });
}

function initCreateDatabase(callback) {
    checkDatabaseExists(function (err1, exists) {
        if (err1) return callback(err1);

        if (exists) {
            console.log('\x1b[33m[database] Database already exists');
            return callback(null);
        }

        console.log('\x1b[33m[database] Creating ' + db.database + ' database');

        createDatabase(function (err2) {
            if (err2) return callback(err2);
            pool = makePool(true);
            callback(null);
        });
    });
}

function initMigrateTables(callback) {
    checkDatabaseExists(function (err1, exists) {
        if (err1) return callback(err1);
        if (!exists) return callback(new Error('Database does not exists'));

        pool = makePool(true);
        useDatabase(function (err2) {
            if (err2) return callback(err2);
            processMigrateTables(callback);
        });
    });
}

function initInsertTables(callback) {
    checkDatabaseExists(function (err1, exists) {
        if (err1) return callback(err1);
        if (!exists) return callback(new Error('Database does not exists'));

        pool = makePool(true);
        useDatabase(function (err2) {
            if (err2) return callback(err2);
            processInsertTables(callback);
        });
    });
}

if(process.argv[2] == '--create'){
    initCreateDatabase(function(err1){
        if (err1) {
            console.log('\x1b[31m[database] ' + err1);
            process.exit(1);
        }
        console.log('\x1B[32m[database] Database successfully created');
        process.exit(0);
    });
} else if(process.argv[2] == '--migrate'){
    initMigrateTables(function(err1){
        if (err1) {
            console.log('\x1b[31m[database] ' + err1);
            process.exit(1);
        }
        console.log('\x1B[32m[database] All tables successfully migrated');
        process.exit(0);
    });
} else if(process.argv[2] == '--insert'){
    initInsertTables(function(err1){
        if (err1) {
            console.log('\x1b[31m[database] ' + err1);
            process.exit(1);
        }
        console.log('\x1B[32m[database] All tables successfully inserted');
        process.exit(0);
    });
} else {
    console.log('\x1b[31m[database] No database option selected: --create, --migrate, --insert');
    process.exit(1);
}
