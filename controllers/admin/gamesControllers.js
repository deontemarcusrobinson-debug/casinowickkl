var { pool } = require('@/lib/database.js');

var config = require('@/config/config.js');

var { getFormatAmountString } = require('@/utils/formatAmount.js');
var { makeDate } = require('@/utils/formatDate.js');
var { getUserInfo } = require('@/utils/user.js');

exports.adminGames = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    var response = {
        admin: {
            games: {
                status: false,
                original: Object.keys(config.settings.games.games.original).map(a => ({
                    game: a,
                    name: config.settings.games.games.original[a].name,
                    enable: false,
                    house_edge: {
                        value: 0,
                        fixed: false
                    }
                })),
                classic: Object.keys(config.settings.games.games.classic).map(a => ({
                    game: a,
                    name: config.settings.games.games.classic[a].name,
                    enable: false
                })),
                casino: {
                    real: false
                }
            }
        }
    };

    if(!res.locals.user.authorized.admin){
        return res.render('admin/adminGames', {
            layout: 'layouts/admin',
            page: 'admin',
            name: config.app.pages['admin'],
            breadcrumb: [{
                page: 'games',
                name: 'Games'
            }],
            response: response
        });
    }

    response.admin.games.status = config.settings.games.status;

    response.admin.games.original = Object.keys(config.settings.games.games.original).map(a => ({
        game: a,
        name: config.settings.games.games.original[a].name,
        enable: config.settings.games.games.original[a].enable,
        house_edge: config.settings.games.games.original[a].house_edge
    }));

    response.admin.games.classic = Object.keys(config.settings.games.games.classic).map(a => ({
        game: a,
        name: config.settings.games.games.classic[a].name,
        enable: config.settings.games.games.classic[a].enable
    }));

    response.admin.games.casino.real = config.settings.games.casino.real;

    res.render('admin/adminGames', {
        layout: 'layouts/admin',
        page: 'admin',
        name: config.app.pages['admin'],
        breadcrumb: [{
            page: 'games',
            name: 'Games'
        }],
        response: response
    });
};

exports.adminGamebots = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    var response = {
        admin: {
            gamebots: {
                bots: {
                    list: [],
                    pages: 1,
                    page: 1
                },
                games: Object.keys(config.settings.games.bots.enable).map(a => ({
                    game: a,
                    name: config.settings.games.games.original[a].name,
                    enable: false
                }))
            }
        }
    };

    if(!res.locals.user.authorized.admin){
        return res.render('admin/adminGamebots', {
            layout: 'layouts/admin',
            page: 'admin',
            name: config.app.pages['admin'],
            breadcrumb: [{
                page: 'gamebots',
                name: 'Game Bots'
            }],
            response: response
        });
    }

    pool.query('SELECT COUNT(*) AS `count` FROM `users` WHERE `bot` = 1', function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin game bots page (1)' });

        pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `balance`, `time_create` FROM `users` WHERE `bot` = 1 ORDER BY `id` ASC LIMIT 10', function(err2, row2) {
            if(err2) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin game bots page (2)' });

            var pages = Math.ceil(row1[0].count / 10);

            response.admin.gamebots.bots.list = row2.map(a => ({
                user: getUserInfo({
                    userid: a.userid,
                    name: a.name,
                    avatar: a.avatar,
                    xp: parseInt(a.xp),
                    anonymous: 0
                }),
                balance: getFormatAmountString(a.balance),
				created: makeDate(new Date(a.time_create * 1000))
            }));

            if(pages > 0) {
                response.admin.gamebots.bots.pages = pages;
            }

            response.admin.gamebots.games = Object.keys(config.settings.games.bots.enable).map(a => ({
                game: a,
                name: config.settings.games.games.original[a].name,
                enable: config.settings.games.bots.enable[a]
            }));

            res.render('admin/adminGamebots', {
                layout: 'layouts/admin',
                page: 'admin',
                name: config.app.pages['admin'],
                breadcrumb: [{
                    page: 'gamebots',
                    name: 'Game Bots'
                }],
                response: response
            });
        });
    });
};