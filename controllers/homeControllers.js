var { pool } = require('@/lib/database.js');

var { calculateLevel } = require('@/utils/utils.js');
var { roundedToFixed } = require('@/utils/formatAmount.js');

var casinoService = require('@/services/games/casinoService.js');

var config = require('@/config/config.js');

exports.home = async (req, res) => {
    var response = {
        home: {
            user: null,
            games: {
                recent: [],
                slots: casinoService.getPopularSlotsGames(res.locals.user ? res.locals.user.userid : null),
                live: casinoService.getPopularLiveGames(res.locals.user ? res.locals.user.userid : null),
                original: Object.keys(config.settings.games.games.original).map(a => ({
                    id: a,
                    enable: config.settings.games.games.original[a].enable,
                    name: config.settings.games.games.original[a].name,
                    image: '/img/games/original/' + a + '.jpg',
                    provider: config.app.abbreviation,
                    description: config.settings.games.games.original[a].description,
                    rtp: 100 - config.settings.games.games.original[a].house_edge.value
                }))
            },
            providers: casinoService.getPopularPrividers(),
            affiliates: {
                earnings: Object.keys(config.app.affiliates.earnings).reduce((acc, cur) => ({ ...acc, [cur]: roundedToFixed(config.app.affiliates.earnings[cur].slice(-1)[0], 2).toFixed(2) }), {})
            }
        }
    };

    if(!res.locals.user) {
        return res.render('home', {
            page: 'home',
            name: config.app.pages['home'],
            response: response
        });
    }

    pool.query('SELECT `category`, `gameid`, MAX(`time`) AS `time` FROM `games_history` WHERE `userid` = ' + pool.escape(res.locals.user.userid) + ' GROUP BY `category`, `game` ORDER BY `time` DESC LIMIT 20', function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering hone page (1)' });

        var level = calculateLevel(res.locals.user.xp);

        response.home.user = {
            userid: res.locals.user.userid,
            name: res.locals.user.name,
            avatar: res.locals.user.avatar,
            level: {
                ...level,
                ...{
                    tier: [ 'steel', 'bronze', 'silver', 'gold', 'diamond' ][Math.floor(level.level / 25)],
                    progress: roundedToFixed((level.have - level.start) / (level.next - level.start) * 100, 2).toFixed(2)
                }
            }
        };

        response.home.games.recent = row1.filter(function(a) {
            if(a.category == 'casino') return casinoService.games[a.gameid] !== undefined;

            return true;
        }).map(function(a) {
            if(a.category == 'casino') {
                return ({
                    id: a.gameid,
                    category: a.category,
                    enable: casinoService.providers[casinoService.games[a.gameid].provider.id] !== undefined ? casinoService.games[a.gameid].status && casinoService.providers[casinoService.games[a.gameid].provider.id].status : false,
                    name: casinoService.games[a.gameid].game.name,
                    image: casinoService.games[a.gameid].game.image,
                    provider: casinoService.games[a.gameid].provider.name,
                    rtp: casinoService.games[a.gameid].rtp
                });
            }

            return ({
                id: a.gameid,
                category: a.category,
                enable: config.settings.games.games.original[a.gameid].enable,
                name: config.settings.games.games.original[a.gameid].name,
                image: '/img/games/original/' + a.gameid + '.jpg',
                provider: config.app.abbreviation,
                description: config.settings.games.games.original[a.gameid].description,
                rtp: 100 - config.settings.games.games.original[a.gameid].house_edge.value
            });
        });

        res.render('home', {
            page: 'home',
            name: config.app.pages['home'],
            response: response
        });
    });
};