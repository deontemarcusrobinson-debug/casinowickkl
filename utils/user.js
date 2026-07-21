var { pool } = require('@/lib/database.js');

var { roundedToFixed } = require('@/utils/formatAmount.js');
var { time } = require('@/utils/formatDate.js');
var { calculateLevel } = require('@/utils/utils.js');

var config = require('@/config/config.js');

function getUserBySession(session, device, callback){
    pool.query('SELECT users.userid, users.name, users.avatar, users.xp, users.rank, users.email, users.password, users.balance, users.rollover, users.anonymous, users.private, users.exclusion, users.time_create' +
        ' FROM `users` INNER JOIN `users_sessions` ON users.userid = users_sessions.userid' +
        ' WHERE users_sessions.session = ' + pool.escape(session) + ' AND users_sessions.device = ' + pool.escape(device) + ' AND users_sessions.removed = 0 AND users_sessions.expire > ' + pool.escape(time()), function(err1, row1) {

        if(err1) return callback(new Error('An error occurred while getting user by session (1)'));
        if(row1.length <= 0) return callback(null, null);

        pool.query('SELECT `id` FROM `users_security_requests` WHERE `userid` = ' + pool.escape(row1[0].userid) + ' AND `device` = ' + pool.escape(device) + ' AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err2, row2) {
            if(err2) return callback(new Error('An error occurred while getting user by session (2)'));

            pool.query('SELECT `id` FROM `admin_requests` WHERE `userid` = ' + pool.escape(row1[0].userid) + ' AND `device` = ' + pool.escape(device) + ' AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err3, row3) {
                if(err3) return callback(new Error('An error occurred while getting user by session (3)'));

                callback(null, {
                    userid: row1[0].userid,
                    name: row1[0].name,
                    avatar: row1[0].avatar,
                    xp: parseInt(row1[0].xp),
                    rank: parseInt(row1[0].rank),
                    balance: roundedToFixed(row1[0].balance, 2),
                    email: row1[0].email,
                    password: row1[0].password,
                    rollover: roundedToFixed(row1[0].rollover, 2),
                    anonymous: parseInt(row1[0].anonymous),
                    private: parseInt(row1[0].private),
                    exclusion: parseInt(row1[0].exclusion),
                    time_create: row1[0].time_create,
                    authorized: {
                        account: row2.length > 0,
                        admin: row3.length > 0
                    }
                });
            });
        });
    });
}

function getSocketUserBySession(session, device, callback){
    pool.query('SELECT users.userid, users.name, users.avatar, users.xp, users.rank, users.email, users.balance, users.rollover, users.anonymous, users.private, users.exclusion, users_sessions.session, users_client_seeds.seed AS `client_seed`, users_server_seeds.seed AS `server_seed`, users_server_seeds.nonce AS `nonce`' +
        ' FROM `users` INNER JOIN `users_sessions` ON users.userid = users_sessions.userid INNER JOIN `users_client_seeds` ON users_client_seeds.userid = users.userid INNER JOIN `users_server_seeds` ON users_server_seeds.userid = users.userid' +
        ' WHERE users_sessions.session = ' + pool.escape(session) + ' AND users_sessions.device = ' + pool.escape(device) + ' AND users_sessions.removed = 0 AND users_sessions.expire > ' + pool.escape(time()) + ' AND users_client_seeds.removed = 0 AND users_server_seeds.removed = 0', function(err1, row1) {

        if(err1) return callback(new Error('An error occurred while getting socket user by session (1)'));
        if(row1.length <= 0) return callback(null, null);

        pool.query('SELECT `restriction`, `expire` FROM `users_restrictions` WHERE `userid` = ' + pool.escape(row1[0].userid) + ' AND `restriction` IN ("play", "trade", "site", "mute") AND `removed` = 0 AND (`expire` = -1 OR `expire` > ' + pool.escape(time()) + ')', function(err2, row2){
            if(err2) return callback(new Error('An error occurred while getting socket user by session (2)'));

            pool.query('SELECT `provider`, `providerid` FROM `users_links` WHERE `userid` = ' + pool.escape(row1[0].userid) + ' AND `provider` IN (' + Object.keys(config.settings.server.auth).map(a => '"' + a + '"').join(', ') + ') AND `removed` = 0', function(err3, row3) {
                if(err3) return callback(new Error('An error occurred while getting socket user by session (3)'));

                pool.query('SELECT `id` FROM `users_security_requests` WHERE `userid` = ' + pool.escape(row1[0].userid) + ' AND `device` = ' + pool.escape(device) + ' AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err4, row4) {
                    if(err4) return callback(new Error('An error occurred while getting socket user by session (4)'));

                    pool.query('SELECT `id` FROM `admin_requests` WHERE `userid` = ' + pool.escape(row1[0].userid) + ' AND `device` = ' + pool.escape(device) + ' AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err5, row5) {
                        if(err5) return callback(new Error('An error occurred while getting socket user by session (5)'));

                        callback(null, {
                            bot: 0,
                            guest: 0,
                            userid: row1[0].userid,
                            name: row1[0].name,
                            avatar: row1[0].avatar,
                            xp: parseInt(row1[0].xp),
                            rank: parseInt(row1[0].rank),
                            balance: roundedToFixed(row1[0].balance, 2),
                            email: row1[0].email,
                            rollover: roundedToFixed(row1[0].rollover, 2),
                            anonymous: parseInt(row1[0].anonymous),
                            private: parseInt(row1[0].private),
                            exclusion: parseInt(row1[0].exclusion),
                            links: {
                                ...Object.keys(config.settings.server.auth).reduce((acc, cur) => ({ ...acc, [cur]: null }), {}),
                                ...row3.reduce((acc, cur) => ({ ...acc, [cur.provider]: cur.providerid }), {})
                            },
                            restrictions: {
                                ...{
                                    play: 0,
                                    trade: 0,
                                    site: 0,
                                    mute: 0
                                },
                                ...row2.reduce((acc, cur) => ({ ...acc, [cur.restriction]: parseInt(cur.expire) }), {})
                            },
                            authorized: {
                                account: row4.length > 0,
                                admin: row5.length > 0
                            },
                            fair: {
                                client_seed: row1[0].client_seed,
                                server_seed: row1[0].server_seed,
                                nonce: row1[0].nonce
                            }
                        });
                    });
                });
            });
        });
    });
}

function getUserInfo(user){
    return {
        userid: user.userid,
        name: user.anonymous == 1 ? 'Hidden' : user.name,
        avatar: user.anonymous == 1 ? config.app.url + '/img/anonymous.jpg' : user.avatar,
        level: calculateLevel(user.xp).level,
        anonymous: user.anonymous
    };
}

module.exports = {
    getUserBySession, getSocketUserBySession, getUserInfo
};