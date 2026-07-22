var { pool } = require('@/lib/database.js');

var casinoService = require('@/services/games/casinoService.js');
var activityService = require('@/services/activityService.js');

var { haveRankPermission } = require('@/utils/utils.js');

var config = require('@/config/config.js');

function withPlaying(list) {
    return activityService.attachPlaying(list);
}
exports.casinoUnset = async (req, res, next) => {
    res.redirect('/casino/lobby');
};

exports.casinoLobby = async (req, res, next) => {
    if(!config.settings.games.games.classic.casino.enable && !haveRankPermission('play_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    res.render('casinoLobby', {
        page: 'casino',
        name: config.app.pages['casino'],
        response: {
            casino: {
                games: {
                    hot: casinoService.getHotGamesList(res.locals.user ? res.locals.user.userid : null),
                    slots: casinoService.getSlotsGamesList(res.locals.user ? res.locals.user.userid : null),
                    live: casinoService.getLiveGamesList(res.locals.user ? res.locals.user.userid : null)
                }
            }
        }
    });
};

exports.casinoSlots = async (req, res, next) => {
    if(!config.settings.games.games.classic.casino.enable && !haveRankPermission('play_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    var listitems = Object.values(casinoService.games).filter(a => a.type == 'slots').map(a => ({
        id: a.id,
        name: a.game.name,
        games: casinoService.stats[a.id].games
    }));

    var providersNames = Object.values(listitems.map(a => casinoService.games[a.id].provider).reduce((acc, cur) => ({ ...acc, [cur.id]: ({
        id: cur.id,
        name: cur.name
    }) }), {})).sort((a, b) => a.name.localeCompare(b.name));

    var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_slots_games);

    listitems.sort((a, b) => b.games - a.games );

    var result = listitems.slice(0, config.app.pagination.items.casino_slots_games);

    res.render('casinoSlots', {
        page: 'casino',
        name: config.app.pages['casino'],
        response: {
            casino: {
                slots: {
                    list: withPlaying(result.map(a => ({
                        id: a.id,
                        enable: casinoService.providers[casinoService.games[a.id].provider.id] !== undefined ? casinoService.games[a.id].status && casinoService.providers[casinoService.games[a.id].provider.id].status : false,
                        name: casinoService.games[a.id].game.name,
                        image: casinoService.games[a.id].game.image,
                        provider: casinoService.games[a.id].provider.name,
                        rtp: casinoService.games[a.id].rtp,
                        favorite: res.locals.user && casinoService.favorites[res.locals.user.userid] !== undefined ? casinoService.favorites[res.locals.user.userid].some(b => b == a.id) : false
                    }))),
                    pages: pages,
                    page: 1
                },
                providers: providersNames
            }
        }
    });
};

exports.casinoLive = async (req, res, next) => {
    if(!config.settings.games.games.classic.casino.enable && !haveRankPermission('play_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    var listitems = Object.values(casinoService.games).filter(a => a.type == 'live').map(a => ({
        id: a.id,
        name: a.game.name,
        games: casinoService.stats[a.id].games
    }));

    var providersNames = Object.values(listitems.map(a => casinoService.games[a.id].provider).reduce((acc, cur) => ({ ...acc, [cur.id]: ({
        id: cur.id,
        name: cur.name
    }) }), {})).sort((a, b) => a.name.localeCompare(b.name));

    var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_live_games);

    listitems.sort((a, b) => b.games - a.games );

    var result = listitems.slice(0, config.app.pagination.items.casino_live_games);

    res.render('casinoLive', {
        page: 'casino',
        name: config.app.pages['casino'],
        response: {
            casino: {
                live: {
                    list: withPlaying(result.map(a => ({
                        id: a.id,
                        enable: casinoService.providers[casinoService.games[a.id].provider.id] !== undefined ? casinoService.games[a.id].status && casinoService.providers[casinoService.games[a.id].provider.id].status : false,
                        name: casinoService.games[a.id].game.name,
                        image: casinoService.games[a.id].game.image,
                        provider: casinoService.games[a.id].provider.name,
                        rtp: casinoService.games[a.id].rtp,
                        favorite: res.locals.user && casinoService.favorites[res.locals.user.userid] !== undefined ? casinoService.favorites[res.locals.user.userid].some(b => b == a.id) : false
                    }))),
                    pages: pages,
                    page: 1
                },
                providers: providersNames
            }
        }
    });
};

exports.casinoRecent = async (req, res, next) => {
    if(!config.settings.games.games.classic.casino.enable && !haveRankPermission('play_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    var response = {
        casino: {
            recent: {
                list: [],
                pages: 1,
                page: 1
            },
            providers: []
        }
    };

    if(!res.locals.user){
        return res.render('casinoRecent', {
            page: 'casino',
            name: config.app.pages['casino'],
            response: response
        });
    }

    pool.query('SELECT `game`, MAX(`time`) AS `time` FROM `casino_bets` WHERE `userid` = ' + pool.escape(res.locals.user.userid) + ' GROUP BY `game` ORDER BY `time` DESC', function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering casino recent page (1)' });

        var listitems = row1.filter(a => casinoService.games[a.game] !== undefined).map(a => ({
            id: casinoService.games[a.game].id,
            name: casinoService.games[a.game].game.name,
            games: casinoService.stats[casinoService.games[a.game].id].games
        }));

        var providersNames = Object.values(listitems.map(a => casinoService.games[a.id].provider).reduce((acc, cur) => ({ ...acc, [cur.id]: ({
            id: cur.id,
            name: cur.name
        }) }), {})).sort((a, b) => a.name.localeCompare(b.name));

        var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_recent_games);

        listitems.sort((a, b) => b.games - a.games );

        var result = listitems.slice(0, config.app.pagination.items.casino_recent_games);

        response.casino.recent.list = withPlaying(result.map(a => ({
            id: a.id,
            enable: casinoService.providers[casinoService.games[a.id].provider.id] !== undefined ? casinoService.games[a.id].status && casinoService.providers[casinoService.games[a.id].provider.id].status : false,
            name: casinoService.games[a.id].game.name,
            image: casinoService.games[a.id].game.image,
            provider: casinoService.games[a.id].provider.name,
            rtp: casinoService.games[a.id].rtp,
            favorite: res.locals.user && casinoService.favorites[res.locals.user.userid] !== undefined ? casinoService.favorites[res.locals.user.userid].some(b => b == a.id) : false
        })));

        response.casino.recent.pages = pages;

        response.casino.providers = providersNames;

        res.render('casinoRecent', {
            page: 'casino',
            name: config.app.pages['casino'],
            response: response
        });
    });
};

exports.casinoFavorites = async (req, res, next) => {
    if(!config.settings.games.games.classic.casino.enable && !haveRankPermission('play_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    var listitems = res.locals.user && casinoService.favorites[res.locals.user.userid] !== undefined ? Object.values(casinoService.games).filter(a => casinoService.favorites[res.locals.user.userid].some(b => b == a.id)).map(a => ({
        id: a.id,
        name: a.game.name,
        games: casinoService.stats[a.id].games
    })) : [];

    var providersNames = Object.values(listitems.map(a => casinoService.games[a.id].provider).reduce((acc, cur) => ({ ...acc, [cur.id]: ({
        id: cur.id,
        name: cur.name
    }) }), {})).sort((a, b) => a.name.localeCompare(b.name));

    var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_favorites_games);

    listitems.sort((a, b) => b.games - a.games );

    var result = listitems.slice(0, config.app.pagination.items.casino_favorites_games);

    res.render('casinoFavorites', {
        page: 'casino',
        name: config.app.pages['casino'],
        response: {
            casino: {
                favorites: {
                    list: withPlaying(result.map(a => ({
                        id: a.id,
                        enable: casinoService.providers[casinoService.games[a.id].provider.id] !== undefined ? casinoService.games[a.id].status && casinoService.providers[casinoService.games[a.id].provider.id].status : false,
                        name: casinoService.games[a.id].game.name,
                        image: casinoService.games[a.id].game.image,
                        provider: casinoService.games[a.id].provider.name,
                        rtp: casinoService.games[a.id].rtp,
                        favorite: true
                    }))),
                    pages: pages,
                    page: 1
                },
                providers: providersNames
            }
        }
    });
};

exports.casinoProviders = async (req, res, next) => {
    if(!config.settings.games.games.classic.casino.enable && !haveRankPermission('play_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    var listitems = Object.values(casinoService.providers).filter(a => a.games.length > 0).map(a => ({
        id: a.id,
        name: a.name
    }));

    var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_providers);

    listitems.sort((a, b) => a.name.localeCompare(b.name));

    var result = listitems.slice(0, config.app.pagination.items.casino_providers);

    res.render('casinoProviders', {
        page: 'casino',
        name: config.app.pages['casino'],
        response: {
            casino: {
                providers: {
                    list: result.map(a => ({
                        id: a.id,
                        image: casinoService.providers[a.id].image,
                        games: casinoService.providers[a.id].games.sort((b, c) => casinoService.stats[c].games - casinoService.stats[b].games ).slice(0, 20).map(b => ({
                            id: b,
                            enable: casinoService.games[b].status && casinoService.providers[a.id].status,
                            name: casinoService.games[b].game.name,
                            image: casinoService.games[b].game.image,
                            provider: casinoService.games[b].provider.name,
                            rtp: casinoService.games[b].rtp,
                            favorite: res.locals.user && casinoService.favorites[res.locals.user.userid] !== undefined ? casinoService.favorites[res.locals.user.userid].some(c => c == b) : false,
                            playing: activityService.getPlaying(b)
                        }))
                    })),
                    pages: pages,
                    page: 1
                }
            }
        }
    });
};

exports.casinoGame = async (req, res, next) => {
    if(!config.settings.games.games.classic.casino.enable && !haveRankPermission('play_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    var { id } = req.params;

    if(casinoService.games[id] === undefined) return res.redirect('/slots');

    var listitems = casinoService.providers[casinoService.games[id].provider.id].games.map(a => ({
        id: a,
        games: casinoService.stats[a].games
    }));

    listitems.sort((a, b) => b.games - a.games );

    var result = listitems.slice(0, 20);

    res.render('casinoGame', {
        page: 'casino',
        name: config.app.pages['casino'],
        response: {
            casino: {
                game: {
                    name: casinoService.games[id].game.name,
                    image: casinoService.games[id].game.image,
                    provider: casinoService.providers[casinoService.games[id].provider.id].name,
                    rtp: casinoService.games[id].rtp,
                    demo: casinoService.games[id].demo
                },
                provider: {
                    id: casinoService.games[id].provider.id,
                    name: casinoService.providers[casinoService.games[id].provider.id].name,
                    games: withPlaying(result.map(a => ({
                        id: a.id,
                        enable: casinoService.games[a.id].status && casinoService.providers[casinoService.games[id].provider.id].status,
                        name: casinoService.games[a.id].game.name,
                        image: casinoService.games[a.id].game.image,
                        provider: casinoService.games[a.id].provider.name,
                        rtp: casinoService.games[a.id].rtp,
                        favorite: res.locals.user && casinoService.favorites[res.locals.user.userid] !== undefined ? casinoService.favorites[res.locals.user.userid].some(b => b == a.id) : false
                    })))
                },
                providers: casinoService.getPopularPrividers()
            }
        }
    });
};

exports.casinoProvider = async (req, res, next) => {
    if(!config.settings.games.games.classic.casino.enable && !haveRankPermission('play_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    var { id } = req.params;

    if(casinoService.providers[id] === undefined) return res.redirect('/providers');

    var listitems = casinoService.providers[id].games.map(a => ({
        id: a,
        games: casinoService.stats[a].games
    }));

    var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_providers_games);

    listitems.sort((a, b) => b.games - a.games );

    var result = listitems.slice(0, config.app.pagination.items.casino_providers_games);

    res.render('casinoProvider', {
        page: 'casino',
        name: config.app.pages['casino'],
        response: {
            casino: {
                provider: {
                    name: casinoService.providers[id].name,
                    image: casinoService.providers[id].image,
                    games: {
                        list: withPlaying(result.map(a => ({
                            id: a.id,
                            enable: casinoService.games[a.id].status && casinoService.providers[id].status,
                            name: casinoService.games[a.id].game.name,
                            image: casinoService.games[a.id].game.image,
                            provider: casinoService.games[a.id].provider.name,
                            rtp: casinoService.games[a.id].rtp,
                            favorite: res.locals.user && casinoService.favorites[res.locals.user.userid] !== undefined ? casinoService.favorites[res.locals.user.userid].some(b => b == a.id) : false
                        }))),
                        pages: pages,
                        page: 1
                    },
                    count: listitems.length
                }
            }
        }
    });
};