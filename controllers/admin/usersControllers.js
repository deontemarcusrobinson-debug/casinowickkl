var { pool } = require('@/lib/database.js');

var config = require('@/config/config.js');

var { getFormatAmountString } = require('@/utils/formatAmount.js');
var { makeDate, time } = require('@/utils/formatDate.js');
var { getUserInfo } = require('@/utils/user.js');
var { capitalizeText } = require('@/utils/utils.js');

exports.adminUsers = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    var response = {
        admin: {
            users: {
                list: [],
                pages: 1,
                page: 1
            }
        }
    };

    if(!res.locals.user.authorized.admin){
        return res.render('admin/adminUsers', {
            layout: 'layouts/admin',
            page: 'admin',
            name: config.app.pages['admin'],
            breadcrumb: [{
                page: 'users',
                name: 'Users'
            }],
            response: response
        });
    }

    pool.query('SELECT COUNT(*) AS `count` FROM `users` WHERE `bot` = 0', function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin users page (1)' });

        pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `balance`, `rank`, `time_create` FROM `users` WHERE `bot` = 0 ORDER BY `id` ASC LIMIT 10', function(err2, row2) {
            if(err2) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin users page (2)' });

            var pages = Math.ceil(row1[0].count / 10);

            response.admin.users.list = row2.map(a => ({
                user: getUserInfo({
                    userid: a.userid,
                    name: a.name,
                    avatar: a.avatar,
                    xp: parseInt(a.xp),
                    anonymous: 0
                }),
                balance: getFormatAmountString(a.balance),
                rank: config.app.ranks[a.rank],
                created: makeDate(new Date(a.time_create * 1000))
            }));

            if(pages > 0) {
                response.admin.users.pages = pages;
            }

            res.render('admin/adminUsers', {
                layout: 'layouts/admin',
                page: 'admin',
                name: config.app.pages['admin'],
                breadcrumb: [{
                    page: 'users',
                    name: 'Users'
                }],
                response: response
            });
        });
    });
};

exports.adminUser = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    if(!res.locals.user.authorized.admin) return res.redirect('/admin/users');

    var { userid } = req.params;

    pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `balance`, `rollover`, `rank`, `exclusion`, `anonymous`, `private`, `time_create`' +
        ' FROM `users` WHERE `bot` = 0 AND `userid` = ' + pool.escape(userid), function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin user page (1)' });

        if(row1.length <= 0) return next();

        var response = {
            admin: {
                user: {
                    profile: {
                        user: getUserInfo({
                            userid: row1[0].userid,
                            name: row1[0].name,
                            avatar: row1[0].avatar,
                            xp: parseInt(row1[0].xp),
                            anonymous: 0
                        }),
                        balance: getFormatAmountString(row1[0].balance),
                        rollover: getFormatAmountString(row1[0].rollover),
                        rank: {
                            value: parseInt(row1[0].rank),
                            name: config.app.ranks[row1[0].rank]
                        },
                        exclusion: parseInt(row1[0].exclusion) > time() ? makeDate(new Date(row1[0].exclusion * 1000)) : null,
                        anonymous: parseInt(row1[0].anonymous) == 1 ? true : false,
                        private: parseInt(row1[0].private) == 1 ? true : false,
                        created: makeDate(new Date(row1[0].time_create * 1000))
                    },
                    twofactor_authentication: {
                        primary: null,
                        authenticator_app: false,
                        email_verification: false
                    },
                    links: {
                        ...Object.keys(config.settings.server.auth).reduce((acc, cur) => ({ ...acc, [cur]: null }), {})
                    },
                    restrictions: {
                        ...[ 'play', 'trade', 'site', 'mute' ].reduce((acc, cur) => ({ ...acc, [cur]: { active: false } }), {})
                    },
                    devices: 0,
                    ips: [],
                    bannedips: [],
                    referred: null,
                    ranks: Object.keys(config.app.ranks).filter(a => !isNaN(Number(a))).map(a => ({
                        rank: parseInt(a),
                        name: capitalizeText(config.app.ranks[a])
                    }))
                }
            }
        };

        //TWO FACTOR AUTHENTICATION
        pool.query('SELECT `id` FROM `authenticator_app` WHERE `userid` = ' + pool.escape(userid) + ' AND `activated` = 1 AND `removed` = 0', function(err2, row2) {
            if(err2) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin user page (2)' });

            pool.query('SELECT `id` FROM `email_verification` WHERE `userid` = ' + pool.escape(userid) + ' AND `removed` = 0', function(err3, row3) {
                if(err3) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin user page (3)' });

                pool.query('SELECT `method` FROM `twofactor_authentication` WHERE `userid` = ' + pool.escape(userid) + ' AND `removed` = 0', function(err4, row4) {
                    if(err4) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin user page (4)' });

                    //LINKS
                    pool.query('SELECT `provider`, `providerid` FROM `users_links` WHERE `userid` = ' + pool.escape(userid) + ' AND `provider` IN (' + Object.keys(config.settings.server.auth).map(a => '"' + a + '"').join(', ') + ') AND `removed` = 0', function(err5, row5) {
                        if(err5) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin user page (5)' });

                        //DEVICES
                        pool.query('SELECT COUNT(*) AS `count` FROM `users_sessions` WHERE `userid` = ' + pool.escape(userid) + ' AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err6, row6) {
                            if(err6) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin user page (6)' });

                            //RESTRICTIONS
                            pool.query('SELECT `restriction`, `expire` FROM `users_restrictions` WHERE `userid` = ' + pool.escape(userid) + ' AND (`expire` = -1 OR `expire` > ' + pool.escape(time()) + ') AND `removed` = 0', function(err7, row7) {
                                if(err7) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin user page (7)' });

                                //IPS
                                pool.query('SELECT DISTINCT users_logins.ip FROM `users_sessions` INNER JOIN `users_logins` ON users_sessions.userid = users_logins.userid AND users_sessions.id = users_logins.sessionid WHERE users_logins.id = (SELECT users_logins_test.id FROM `users_logins` `users_logins_test` WHERE users_logins.sessionid = users_logins_test.sessionid ORDER BY users_logins_test.time DESC LIMIT 1) AND users_sessions.userid = ' + pool.escape(userid) + ' AND users_sessions.removed = 0 AND users_sessions.expire > ' + pool.escape(time()), function(err8, row8) {
                                    if(err8) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin user page (8)' });

                                    //BANNED IPS
                                    pool.query('SELECT DISTINCT bannedip.ip FROM `bannedip` INNER JOIN `users_logins` ON bannedip.ip = users_logins.ip WHERE users_logins.userid = ' + pool.escape(userid) + ' AND bannedip.removed = 0', function(err9, row9) {
                                        if(err9) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin user page (9)' });

                                        //REFERRED BY
                                        pool.query('SELECT tracking_links.name FROM `tracking_links` INNER JOIN `tracking_joins` ON tracking_links.referral = tracking_joins.referral INNER JOIN `users_logins` ON tracking_joins.ip = users_logins.ip WHERE users_logins.userid = ' + pool.escape(userid) + ' AND tracking_links.removed = 0 AND (tracking_links.expire > ' + pool.escape(time()) + ' OR tracking_links.expire = -1) ORDER BY tracking_joins.id DESC LIMIT 1', function(err10, row10) {
                                            if(err10) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin user page (10)' });

                                            if(row4.length > 0) response.admin.user.twofactor_authentication.primary = row4[0].method;
                                            if(row2.length > 0) response.admin.user.twofactor_authentication.authenticator_app = true;
                                            if(row3.length > 0) response.admin.user.twofactor_authentication.email_verification = true;

                                            response.admin.user.links = {
                                                ...response.admin.user.links,
                                                ...row5.reduce((acc, cur) => ({ ...acc, [cur.provider]: cur.providerid }), {})
                                            };

                                            response.admin.user.restrictions = {
                                                ...[ 'play', 'trade', 'site', 'mute' ].reduce((acc, cur) => ({ ...acc, [cur]: { active: false } }), {}),
                                                ...row7.reduce((acc, cur) => ({ ...acc, [cur.restriction]: { active: true, expire: parseInt(cur.expire) == -1 ? 'never' : makeDate(new Date(cur.expire * 1000)) } }), {})
                                            };

                                            response.admin.user.devices = parseInt(row6[0].count);
                                            response.admin.user.ips = row8.map(a => a.ip);
                                            response.admin.user.bannedips = row9.map(a => a.ip);

                                            if(row10.length > 0) response.admin.user.referred = row10[0].name;

                                            res.render('admin/adminUser', {
                                                layout: 'layouts/admin',
                                                page: 'admin',
                                                name: config.app.pages['admin'],
                                                breadcrumb: [{
                                                    page: 'users',
                                                    name: 'Users'
                                                }, {
                                                    page: row1[0].userid,
                                                    name: row1[0].name
                                                }],
                                                response: response
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};