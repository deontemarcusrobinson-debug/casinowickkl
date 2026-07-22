var request = require('request');

var { pool } = require('@/lib/database.js');
var { loggerTrace, loggerDebug, loggerInfo, loggerError } = require('@/lib/logger.js');

var userService = require('@/services/userService.js');
var historyService = require('@/services/historyService.js');

var { time } = require('@/utils/formatDate.js');
var { getFormatAmount, getFormatAmountString, verifyFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser } = require('@/utils/socket.js');
var { haveRankPermission, isJsonString, getSlug } = require('@/utils/utils.js');

var config = require('@/config/config.js');

var token = null;

var updating = {
	value: true
};

// Provider codes that commonly work for US traffic (incl. Ohio visitors).
// Override with CASINO_ALLOWED_PROVIDERS or set CASINO_MARKET=all to disable.
var US_MARKET_PROVIDER_CODES = [
    'pragmatic', 'pragmatic-live', 'pragmatic-bj', 'pragmatic-bj2', 'pragmatic-virtual', 'pragmaticS',
    'hacksaw',
    'bgaming', 'bgamingP',
    'nolimitcity-A', 'nolimitcityWC',
    'booming',
    'evoplay',
    'spribe', 'aviator',
    'habanero',
    'only-play',
    'playson',
    'spinomenal',
    'yggdrasil-a',
    'endorphina',
    'bigtimegaming-a',
    'netent',
    'redtiger',
    'playngo',
    'push-gaming',
    'relax',
    'thunderkick',
    'quickspin',
    'blueprint',
    'print-studios',
    'fantasma',
    'nolimit',
    'slotmill',
    '4theplayer',
    'kalamba',
    'silverback',
    'avatarux',
    'bullshark',
    'backseat',
    'gaming-corps',
    'massive-studios',
    'octopus',
    'pgsoft',
    'jili',
    'tada',
    'kagaming',
    'cp-games',
    'smartsoft',
    'turbogames',
    'turbogames-a'
];

var providers = {};
var providerids = {};

var games = {};
var gameids = {};

var vendors = {};

var stats = {};
var favorites = {};
var blockedGames = {}; // games that failed launch (refused connect / launch url errors)

function getAllowedProviderCodes() {
    var configured = config.games.games.casino.allowed_providers;
    if(configured && configured.length) return configured;

    var market = config.games.games.casino.market || 'all';
    if(market === 'all' || !market) return null;
    if(market === 'us' || market === 'ohio') return US_MARKET_PROVIDER_CODES;
    return null;
}

function isProviderAllowed(providerCode) {
    var allowed = getAllowedProviderCodes();
    if(!allowed) return true;
    return allowed.indexOf(providerCode) !== -1;
}

function blockBrokenGame(id, reason) {
    if(!id || !games[id]) return;
    blockedGames[id] = {
        reason: reason || 'launch_failed',
        time: Date.now()
    };
    loggerInfo('[CASINO] Removed broken game from catalog: ' + id + ' (' + reason + ')');
}

function isLaunchFailureToRemove(err) {
    var msg = String((err && err.message) || err || '').toLowerCase();
    return msg.indexOf('getting launch url (2)') !== -1
        || msg.indexOf('refused to connect') !== -1
        || msg.indexOf('econnrefused') !== -1
        || msg.indexOf('enotfound') !== -1
        || msg.indexOf('gator.drakon.casino') !== -1 && msg.indexOf('refused') !== -1;
}

function isGameListed(game) {
    if(!game || !game.status) return false;
    if(blockedGames[game.id]) return false;
    if(!providers[game.provider.id] || !providers[game.provider.id].status) return false;
    if(!isProviderAllowed(game.provider.code)) return false;
    if(config.games.games.casino.real_money_only && game.onlyDemo) return false;
    return true;
}

function listedGames() {
    return Object.values(games).filter(isGameListed);
}

/** One playable game per provider (best by play count). */
function oneGamePerProvider(list) {
    if(!config.games.games.casino.one_per_provider) return list;

    var byProvider = {};
    list.forEach(function(game) {
        var key = game.provider.id;
        var score = (stats[game.id] && stats[game.id].games) || 0;
        if(!byProvider[key] || score > ((stats[byProvider[key].id] && stats[byProvider[key].id].games) || 0)) {
            byProvider[key] = game;
        }
    });
    return Object.values(byProvider);
}

function catalogGames(type) {
    var list = listedGames();
    if(type) list = list.filter(function(a) { return a.type == type; });
    return oneGamePerProvider(list);
}

var providersMapping = {
    'iconix': 'Iconix International',
    'pateplay': 'Pateplay',
    'pateplay-live': 'Pateplay',
    'iconic21': 'Iconic21',
    'iconic21-slots': 'Iconic21',
    'elagames-a': 'ELA Games',
    'vivo': 'Vivo Gaming',
    'nolimitcity-A': 'Nolimit City',
    'nolimitcityWC': 'Nolimit City',
    'macaw': 'Macaw Gaming',
    'booming': 'Booming Games',
    'fancyshoes': 'Fancy Shoes Studio',
    'bigpot': 'Bigpot Gaming',
    'airdice': 'Air Dice',
    'armadillostudios': 'Armadillo Studios',
    'betsoft-a': 'Betsoft',
    'onegame': 'OneGame',
    '1x2gaming': '1X2gaming',
    'bigtimegaming-a': 'Big Time Gaming',
    'prospectgaming': 'Prospect Gaming',
    'jvl': 'JVL',
    'irondogPP': 'Iron Dog Studio',
    'irondogP': 'Iron Dog Studio',
    'irondog': 'Iron Dog Studio',
    'only-play': 'Onlyplay',
    'espressogames-a': 'Espresso Games',
    'sagaming': 'SA Gaming',
    'egtdigital': 'EGT Digital',
    'fazi': 'Fazi',
    'redstone': 'Red Stone Gaming',
    'tiptop': 'Tiptop Games',
    'amigogaming': 'Amigo Gaming',
    'tada': 'TaDa Gaming',
    'apparat': 'Apparat Gaming',
    'barbara-bang': 'Barbara Bang',
    'kagaming': 'KA Gaming',
    'netgame': 'NetGame',
    'netgameP': 'NetGame',
    'bitville': 'Bitville Gaming',
    'bgaming': 'BGaming',
    'bgamingP': 'BGaming',
    'rubyplay': 'RubyPlay',
    'spribe': 'Spribe',
    'aviator': 'Spribe',
    'yggdrasil-a': 'Yggdrasil',
    'yoloplay-a': 'Yoloplay',
    'evoplay': 'Evoplay',
    'slotopia': 'Slotopia',
    'creedz-vgs': 'CreedRoomz',
    'creedz': 'CreedRoomz',
    'creedz-bj': 'CreedRoomz',
    'creedroomz-b': 'CreedRoomz',
    'creedroomz': 'CreedRoomz',
    'creedroomzP': 'CreedRoomz',
    'vision': 'CreedRoomz',
    'visionP': 'CreedRoomz',
    'vision-b': 'CreedRoomz',
    'amusnet': 'Amusnet Interactive',
    'amusnet-live': 'Amusnet Interactive',
    'livegames': 'LiveGames',
    'habanero': 'Habanero',
    'pragmatic': 'Pragmatic Play',
    'pragmatic-live': 'Pragmatic Play',
    'pragmatic-bj': 'Pragmatic Play',
    'pragmatic-bj2': 'Pragmatic Play',
    'pragmatic-virtual': 'Pragmatic Play',
    'pragmaticS': 'Pragmatic Play',
    'endorphina': 'Endorphina',
    'skywind': 'Skywind Group',
    'skywind-live': 'Skywind Group',
    'skywind-bj': 'Skywind Group',
    'caletagaming': 'Caleta Gaming',
    'absolute': 'Absolute Live Gaming',
    '7-mojos': '7Mojos',
    '7mojos': '7Mojos',
    '7-mojos-slots': '7Mojos',
    '7mojos-slots': '7Mojos',
    'altente': 'Altente Gaming',
    'religa': 'Religa',
    'wazdan-a': 'Wazdan',
    'bfgames': 'BF Games',
    'hacksaw': 'Hacksaw Gaming',
    'hacksaw-OpenRGS': 'Hacksaw Gaming',
    'backseat': 'Backseat Gaming',
    'bullshark': 'Bullshark Games',
    'popok': 'PopOK Gaming',
    'popok-live': 'PopOK Gaming',
    'platipus': 'Platipus Gaming',
    'mancala': 'Mancala Gaming',
    'retrogames': 'Retro Gaming',
    'spinomenal': 'Spinomenal',
    'fils': 'Fils Game',
    'liw': 'Liw Games',
    'tvbet': 'TVBet',
    'smartsoft': 'SmartSoft Gaming',
    'onetouch': 'OneTouch',
    'onetouch-live': 'OneTouch',
    'onetouch-bj': 'OneTouch',
    'spearhead': 'Spearhead Studios',
    'spearheadP': 'Spearhead Studios',
    'pgsoft': 'PG Soft',
    'platingaming': 'Platin Gaming',
    '7777': '7777 Gaming',
    'micro-gaming': 'Microgaming',
    'micro-gaming-live': 'Microgaming',
    'gamzix': 'Gamzix',
    'redrake': 'Red Rake Gaming',
    'galaxsys': 'Galaxsys',
    'galaxsysP': 'Galaxsys',
    'ctinteractive': 'CT Interactive',
    '3oaks': '3 Oaks Gaming',
    '3oaksP': '3 Oaks Gaming',
    'novo-matic': 'Novomatic',
    'play-son': 'Playson',
    'play-sonP': 'Playson',
    'turbo-games': 'Turbo Games',
    'evolutionWC': 'Evolution',
    'evolutionWCX': 'Evolution',
    'evolutionWCY': 'Evolution',
    'evolutionWCHS': 'Evolution',
    'evolutionWCLS': 'Evolution',
    'netentWC': 'NetEnt',
    'netentEZp': 'NetEnt',
    'netentEZ': 'NetEnt',
    'redtigerWC': 'Red Tiger',
    'redtigerEZ': 'Red Tiger',
    'redtigerEZp': 'Red Tiger',
    'imagine live': 'Imagine Live',
    'imagineliveLS': 'Imagine Live',
    'imagineliveHS': 'Imagine Live',
    'formulaspin': 'Formula Spin',
    'popiplay': 'Popiplay',
    'dreamplay': 'Dream Play',
    'pixmove-games': 'Pixmove Games',
    '100hp': '100HP Gaming',
    'adlunam': 'AdLunam',
    'aviatrix': 'Aviatrix',
    'goldenrace': 'GoldenRace',
    'jetx': 'JetX',
    'ftv': 'FashionTV',
    'ftv-b': 'FashionTV',
    'ftvP': 'FashionTV',
    'eclipse': 'Eclipse',
    'eclipse-b': 'Eclipse',
    'eclipseP': 'Eclipse',
    'pigaboom': 'X UP',
    'jacktop': 'JackTop',
    'jacktop-slots': 'JackTop',
    'vimplay': 'Vimplay',
    'vimplay-live': 'Vimplay',
    'ezugi': 'Ezugi',
    'ezugiX': 'Ezugi',
    'ezugiZ': 'Ezugi',
    'yoriginal-games': 'YOriginal Games',
    'beon': 'BeOn',
    'clawbuster': 'ClawBuster',
    'jacks': '777 Jacks',
    'hotdog': 'Hotdog Gaming',
    'scatterkings': 'ScatterKings',
    'in-out': 'InOut Games',
    'in-outP': 'InOut Games',
    'expanse-studios': 'Expanse Studio',
    'mascot': 'Mascot Gaming',
    'advant-play': 'AdvantPlay',
    'phoenix7': 'PHOENIX 7',
    'funkygames': 'Funky Games',
    'abracadabra': 'AbraCadabra',
    'playnetic': 'Playnetic',
    'eagaming': 'EURASIAN Gaming',
    'avatarux': 'AvatarUX',
    'cpgames': 'CP GAMES',
    'simpleplay': 'SimplePlay',
    'bwgaming': 'BW Gaming',
    'maracash-games': 'Maracash Games',
    'wickedgames': 'Wicked Games',
    'eezecasino': 'Eeze',
    'pascalgaming': 'Pascal Gaming',
    'yeebet-live': 'YeeBet',
    'spinlogic': 'SpinLogic Gaming',
    'elcasino': 'ElCasino',
    'winfinity': 'Winfinity',
    'winfinityX': 'Winfinity',
    'thehood': 'The Hood',
    'winspinity': 'Winspinity',
    'splitthepot-a': 'SplitThePot',
    'shadylady': 'Shady Lady',
    'foxy': 'Foxy Games',
    'fat-panda': 'Fat Panda',
    'avigroup': 'Aviator Studio'
};

function initializeCasino(){
    var agent = config.games.games.casino.drakon.agent || {};
    if(!agent.token || !agent.secret_key || !agent.code) {
        loggerError('[CASINO] Drakon credentials missing. Set DRAKON_AGENT_CODE, DRAKON_AGENT_TOKEN, DRAKON_AGENT_SECRET_KEY on Render Environment, then redeploy.');
        return;
    }

    generateToken(function(err1){
        if(err1) {
            loggerError('[CASINO] Auth failed — slots will stay empty until Drakon login works: ' + (err1.message || err1));
            return setTimeout(initializeCasino, 30000);
        }

        loggerDebug('[CASINO] Casino Authenticated');

        updating.value = true;

        initializeGames(function(err2){
            if(err2) {
                loggerError('[CASINO] Load games/providers failed: ' + (err2.message || err2));
                updating.value = false;
                return setTimeout(function(){ initializeCasino(); }, 30000);
            }

            updating.value = false;

            loggerInfo('[CASINO] Loaded providers=' + Object.keys(providers).length + ' games=' + Object.keys(games).length);

            loadGamesStats();
            loadFavoritesGames();

            initializeCampaigns(function(err3){
                if(err3) return;
            });
        });

        setInterval(function(){
            generateToken(function(err2){
                if(err2) {
                    loggerError('[CASINO] Reauth failed: ' + (err2.message || err2));
                    return;
                }

                loggerDebug('[CASINO] Casino Reauthenticated');
            });
        }, config.games.games.casino.access_token.cooldown_load * 1000);

        setInterval(function(){
            updating.value = true;

            initializeGames(function(err2){
                if(err2) {
                    loggerError('[CASINO] Refresh games failed: ' + (err2.message || err2));
                    updating.value = false;
                    return;
                }

                updating.value = false;

                loadGamesStats();
            });
        }, config.games.games.casino.games.cooldown_load * 1000);
    });
}

function initializeGames(callback){
    loadProviders(function(err1){
        if(err1) return callback(err1);

        loggerDebug('[CASINO] Providers Loaded');

        loadGames(function(err2){
            if(err2) return callback(err2);

            loggerDebug('[CASINO] Games Loaded');

            callback(null);
        });
    });
}

/* ----- INTERNAL USAGE ----- */
function loadGamesStats(){
    loggerDebug('[CASINO] Loading Games Stats');

    pool.query('SELECT casino_bets.game AS `id`, COUNT(*) AS `games`, SUM(casino_bets.amount) AS `bets`, SUM(casino_winnings.amount) AS `winnings` FROM `casino_bets` LEFT JOIN `casino_winnings` ON casino_bets.id = casino_winnings.betid GROUP BY casino_bets.game', function(err1, row1) {
        if(err1) {
            loggerInfo('[CASINO] Error In Loading Games Stats');

            return setTimeout(function(){
                loadGamesStats();
            }, 1000);
        }

        Object.assign(stats, row1.filter(a => games[a.id] !== undefined).reduce((acc, cur) => ({ ...acc, [cur.id]: {
            id: cur.id,
            games: parseInt(cur.games),
            bets: getFormatAmount(cur.bets),
            winnings: getFormatAmount(cur.winnings)
        } }), {}));
    });
}

/* ----- INTERNAL USAGE ----- */
function loadFavoritesGames(){
    loggerDebug('[CASINO] Loading Favorites Games');

    pool.query('SELECT `userid`, `game` FROM `casino_favorites` WHERE `removed` = 0', function(err1, row1) {
        if(err1) {
            loggerInfo('[CASINO] Error In Loading Favorites Games');

            return setTimeout(function(){
                loadFavoritesGames();
            }, 1000);
        }

        if(row1.length <= 0) return;

        Object.assign(favorites, row1.filter(a => games[a.game] !== undefined).reduce(function(acc, cur) {
            if(!acc[cur.userid]) acc[cur.userid] = [];

            acc[cur.userid].push(cur.game);

            return acc;
        }, {}));
    });
}

/* ----- INTERNAL USAGE ----- */
function generateToken(callback){
	var options = {
		'method': 'POST',
		'url': 'https://gator.drakon.casino/api/v1/auth/authentication',
		'headers': {
			'Authorization': 'Bearer ' + Buffer.from(config.games.games.casino.drakon.agent.token + ':' + config.games.games.casino.drakon.agent.secret_key).toString('base64')
		},
        timeout: 60000,
        gzip: true
	};

    request(options, function(err1, response1, body1) {
		if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while generating token (1)'));
        }

        if(!response1 || response1.statusCode != 200) {
            loggerError('[CASINO] Auth HTTP ' + (response1 && response1.statusCode) + ' body=' + String(body1 || '').slice(0, 300));
            return callback(new Error('An error occurred while generating token (2)'));
        }
		if(!isJsonString(body1)) return callback(new Error('An error occurred while generating token (2)'));

        var body = JSON.parse(body1);

        token = body.access_token;
        if(!token) return callback(new Error('An error occurred while generating token (3): no access_token'));

        callback(null);
	});
}

/* ----- INTERNAL USAGE ----- */
function loadProviders(callback){
    var options = {
		'method': 'GET',
		'url': 'https://gator.drakon.casino/api/v1/games/provider',
		'headers': {
			'Authorization': 'Bearer ' + token
		},
        timeout: 120000,
        gzip: true
	};

    request(options, function(err1, response1, body1) {
		if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while loading providers (1)'));
        }

        if(!response1 || response1.statusCode != 200) {
            loggerError('[CASINO] Providers HTTP ' + (response1 && response1.statusCode) + ' body=' + String(body1 || '').slice(0, 300));
            return callback(new Error('An error occurred while loading providers (2)'));
        }
		if(!isJsonString(body1)) return callback(new Error('An error occurred while loading providers (3)'));

        var body = JSON.parse(body1);

        var providersNew = [];
        var provideridsNew = [];

        body.providers.forEach(function(item){
            if(providersMapping[item.code] === undefined) {
                loggerError('[CASINO] Provider ' + item.code + ' in not included and must be included manually');
            } else if(!isProviderAllowed(item.code)) {
                // Skip providers not allowed for configured market (us/ohio/etc.)
            } else {
                var id = getSlug(providersMapping[item.code]);

                providers[id] = {
                    id: id,
                    status: item.status == 1,
                    name: providersMapping[item.code],
                    image: '/img/providers/' + id + '.png',
                    games:[],
                    rtp: item.rtp,
                    code: item.code
                };

                providerids[item.code] = id;

                providersNew.push(id);
                provideridsNew.push(item.code);
            }
        });

        Object.keys(providers).filter(a => !providersNew.some(b => b == a)).forEach(function(id){
            delete providers[id];
        });

        Object.keys(providerids).filter(a => !provideridsNew.some(b => b == a)).forEach(function(id){
            delete providerids[id];
        });

        callback(null);
    });
}

/* ----- INTERNAL USAGE ----- */
function loadGames(callback){
    loggerInfo('[CASINO] Downloading games catalog from Drakon (can take 30–90s)…');

	var options = {
		'method': 'GET',
		'url': 'https://gator.drakon.casino/api/v1/games/all',
		'headers': {
			'Authorization': 'Bearer ' + token
		},
        timeout: 180000,
        gzip: true
	};

    request(options, function(err1, response1, body1) {
		if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while loading games (1): ' + (err1.message || err1.code || err1)));
        }

        if(!response1 || response1.statusCode != 200) {
            loggerError('[CASINO] Games HTTP ' + (response1 && response1.statusCode) + ' body=' + String(body1 || '').slice(0, 300));
            return callback(new Error('An error occurred while loading games (2)'));
        }
		if(!isJsonString(body1)) return callback(new Error('An error occurred while loading games (3)'));

        loggerInfo('[CASINO] Games catalog downloaded (' + String(body1).length + ' bytes), parsing…');

        var body = JSON.parse(body1);

        var allowedTypes = {
            'andarbahar': 'live',
            'baccarat': 'live',
            'blackjack': 'live',
            'dragontiger': 'live',
            'gameshow': 'live',
            'lobby': 'live',
            'lottery': 'live',
            'poker': 'live',
            'roulette': 'live',
            'slot': 'slots',
            'slots': 'slots',
            'tablegames': 'live',
            'crashgame': 'slots',

            //'bingo': 'live',
            //'dice': 'live',
            //'cards': 'live',
            //'instantgame': 'live',
            //'sicbo': 'live',
            //'keno': 'live',
            //'interactivegame': 'live',
            //'scratchcards': 'live',
            //'virtual': 'live',
            //'shooting': 'live',
            //'lotto': 'live',
            //'other': 'live',
            //'betonnumbers': 'live',
            //'topcard': 'live',
            //'casual': 'live',
            //'plinko': 'live'
        };

        var real = [];

        var gamesNew = [];
        var gameidsNew = [];
        var skippedDemoOnly = 0;
        var skippedProvider = 0;

        body.games.filter(a => Object.keys(allowedTypes).includes(a.game_type)).forEach(function(item){
            if(!isProviderAllowed(item.provider_game)) {
                skippedProvider++;
                return;
            }

            var onlyDemo = item.only_demo == 1;
            if(config.games.games.casino.real_money_only && onlyDemo) {
                skippedDemoOnly++;
                return;
            }

            if(providerids[item.provider_game] !== undefined) {
                var id = getSlug(providerids[item.provider_game] + ' ' + item.game_name);

                games[id] = {
                    id: id,
                    type: allowedTypes[item.game_type],
                    status: item.status == 1,
                    onlyDemo: onlyDemo,
                    demo: onlyDemo && !real.includes(providerids[item.provider_game]),
                    mobile: item.is_mobile == 1,
                    game: {
                        id: item.game_id,
                        name: item.game_name,
                        image: item.banner
                    },
                    provider: {
                        id: providerids[item.provider_game],
                        name: providers[providerids[item.provider_game]].name,
                        code: item.provider_game
                    },
                    rtp: providers[providerids[item.provider_game]].rtp
                };

                gameids[item.game_id] = id;

                stats[id] = {
                    id: id,
                    games: 0,
                    bets: 0,
                    winnings: 0
                };

                gamesNew.push(id);
                gameidsNew.push(item.game_id);

                providers[providerids[item.provider_game]].games.push(id);
            } else if(providersMapping[item.provider_game] !== undefined) {
                var mappedId = getSlug(providersMapping[item.provider_game]);
                var id = getSlug(providersMapping[item.provider_game] + ' ' + item.game_name);

                games[id] = {
                    id: id,
                    type: allowedTypes[item.game_type],
                    status: item.status == 1,
                    onlyDemo: onlyDemo,
                    demo: onlyDemo && !real.includes(mappedId),
                    mobile: item.is_mobile == 1,
                    game: {
                        id: item.game_id,
                        name: item.game_name,
                        image: item.banner
                    },
                    provider: {
                        id: mappedId,
                        name: providersMapping[item.provider_game],
                        code: item.provider_game
                    },
                    rtp: item.rtp
                };

                gameids[item.game_id] = id;

                stats[id] = {
                    id: id,
                    games: 0,
                    bets: 0,
                    winnings: 0
                };

                gamesNew.push(id);
                gameidsNew.push(item.game_id);

                if(providers[mappedId]) providers[mappedId].games.push(id);
            } else loggerError('[CASINO] Provider ' + item.provider_game + ' in not included and must be included manually');
        });

        Object.keys(games).filter(a => !gamesNew.some(b => b == a)).forEach(function(id){
            delete games[id];
            delete stats[id];
        });

        Object.keys(gameids).filter(a => !gameidsNew.some(b => b == a)).forEach(function(id){
            delete gameids[id];
        });

        loggerInfo('[CASINO] Catalog filter market=' + (config.games.games.casino.market || 'us') +
            ' kept=' + gamesNew.length +
            ' skippedProvider=' + skippedProvider +
            ' skippedDemoOnly=' + skippedDemoOnly);

        callback(null);
	});
}

/* ----- INTERNAL USAGE ----- */
function getLaunchUrl(userid, name, id, demo, device, callback){
    var options = {
		'method': 'GET',
		'url': 'https://gator.drakon.casino/api/v1/games/game_launch',
		'headers': {
			'Authorization': 'Bearer ' + token
		},
		'qs': {
            'agent_code': config.games.games.casino.drakon.agent.code,
            'agent_token': config.games.games.casino.drakon.agent.token,
			'game_id': games[id].game.id,
			'user_id': userid,
			'user_name': name,
			'type': demo ? 'TRY' : 'CHARGED',
			'mode': demo ? 'fun' : 'real',
			'device': device,
			'currency': config.games.games.casino.drakon.agent.currency,
			'lang': config.games.games.casino.drakon.language
        },
        timeout: 60000,
        gzip: true
	};

    request(options, function(err1, response1, body1) {
		if(err1) {
            loggerError(err1);
            var errConn = new Error('An error occurred while getting launch url (1)');
            if(isLaunchFailureToRemove(err1) || isLaunchFailureToRemove(err1.code)) {
                blockBrokenGame(id, err1.code || err1.message || 'connect_failed');
            }
            return callback(errConn);
        }

        if(!response1 || response1.statusCode != 200) {
            var errHttp = new Error('An error occurred while getting launch url (2)');
            blockBrokenGame(id, 'launch_http_' + (response1 && response1.statusCode));
            return callback(errHttp);
        }
		if(!isJsonString(body1)) {
            var errJson = new Error('An error occurred while getting launch url (3)');
            blockBrokenGame(id, 'launch_bad_json');
            return callback(errJson);
        }

        var body = JSON.parse(body1);
        if(!body || !body.game_url) {
            var errUrl = new Error('An error occurred while getting launch url (2)');
            blockBrokenGame(id, 'launch_missing_url');
            return callback(errUrl);
        }

        callback(null, body.game_url);
	});
}

/* ----- CLIENT USAGE ----- */
function setFavoriteGame(user, socket, id, cooldown){
    cooldown(true, true);

    if(games[id] === undefined) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid gameid!'
        });

        return cooldown(false, true);
    }

    pool.query('SELECT `id` FROM `casino_favorites` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `game` = ' + pool.escape(id) + ' AND `removed` = 0', function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while setting favorite game (1)'
            });

            return cooldown(false, true);
        }

        if(row1.length > 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'This game is already on your favorite games!'
            });

            return cooldown(false, true);
        }

        pool.query('INSERT INTO `casino_favorites` SET `userid` = ' + pool.escape(user.userid) + ', `game` = ' + pool.escape(id) + ', `time` = ' + pool.escape(time()), function(err2) {
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while setting favorite game (2)'
                });

                return cooldown(false, true);
            }

            if(favorites[user.userid] === undefined) favorites[user.userid] = [];
            favorites[user.userid].push(id);

            emitSocketToUser(socket, 'casino', 'add_favorite', { id });

            cooldown(false, false);
        });
    });
}

/* ----- CLIENT USAGE ----- */
function unsetFavoriteGame(user, socket, id, cooldown){
    cooldown(true, true);

    if(games[id] === undefined) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid gameid!'
        });

        return cooldown(false, true);
    }

    pool.query('SELECT `id` FROM `casino_favorites` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `game` = ' + pool.escape(id) + ' AND `removed` = 0', function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while unsetting favorite game (1)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'This game is not on your favorite games!'
            });

            return cooldown(false, true);
        }

        pool.query('UPDATE `casino_favorites` SET `removed` = 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND  `game` = ' + pool.escape(id) + ' AND `removed` = 0', function(err2) {
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while unsetting favorite game (2)'
                });

                return cooldown(false, true);
            }

            if(favorites[user.userid] !== undefined){
                var index = favorites[user.userid].findIndex(a => a == id);

                if(index >= 0) favorites[user.userid].splice(index, 1);

                if(favorites[user.userid].length <= 0) delete favorites[user.userid];
            }

            emitSocketToUser(socket, 'casino', 'remove_favorite', { id });

            cooldown(false, false);
        });
    });
}

/* ----- CLIENT USAGE ----- */
function getSlotsGames(user, socket, page, order, provider, search, cooldown){
    cooldown(true, true);

    var order_allowed = [ 0, 1, 2, 3 ];
	if(!order_allowed.includes(order)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid order!'
		});

		return cooldown(false, true);
	}

    var provider_allowed = [ ...[ 'all' ], ...Object.values(games).map(a => a.provider.id).filter((value, index, array) => array.indexOf(value) === index) ];
	if(!provider_allowed.includes(provider)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid provider!'
		});

		return cooldown(false, true);
	}

    if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);
	search = search.trim();

    var listitems = catalogGames('slots').map(a => ({
        id: a.id,
        name: a.game.name,
        provider: {
            id: a.provider.id,
            name: a.provider.name
        },
        games: stats[a.id].games,
        winnings: stats[a.id].winnings
    }));

    var providersNames = Object.values(listitems.map(a => games[a.id].provider).reduce((acc, cur) => ({ ...acc, [cur.id]: ({
        id: cur.id,
        name: cur.name
    }) }), {})).sort((a, b) => a.name.localeCompare(b.name));

    listitems = listitems.filter(a => a.name.toLowerCase().indexOf(search.toLowerCase()) >= 0 || a.provider.name.toLowerCase().indexOf(search.toLowerCase()) >= 0);

    if(provider != 'all') listitems = listitems.filter(a => a.provider.id == provider);

    var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_slots_games);

    if(pages <= 0){
        emitSocketToUser(socket, 'pagination', 'casino_slots_games', {
            list: [],
            providers: [],
            pages: 1,
            page: 1
        });

        return cooldown(false, false);
    }

    if(page <= 0 || page > pages) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid page!'
        });

        return cooldown(false, true);
    }

    if(order == 0) listitems.sort((a, b) => b.games - a.games );
    else if(order == 1) listitems.sort((a, b) => b.winnings - a.winnings );
    else if(order == 2) listitems.sort((a, b) => a.name.localeCompare(b.name));
    else if(order == 3) listitems.sort((a, b) => b.name.localeCompare(a.name));

    var result = listitems.slice((page - 1) * config.app.pagination.items.casino_slots_games, page * config.app.pagination.items.casino_slots_games);

    var list = result.map(a => ({
        id: a.id,
        enable: true,
        name: games[a.id].game.name,
        image: games[a.id].game.image,
        provider: games[a.id].provider.name,
        rtp: games[a.id].rtp,
        favorite: user && favorites[user.userid] !== undefined ? favorites[user.userid].some(b => b == a.id) : false
    }));

    emitSocketToUser(socket, 'pagination', 'casino_slots_games', {
        list: list,
        providers: providersNames,
        pages: pages,
        page: page
    });

    cooldown(false, false);
}

/* ----- CLIENT USAGE ----- */
function getLiveGames(user, socket, page, order, provider, search, cooldown){
    cooldown(true, true);

    var order_allowed = [ 0, 1, 2, 3 ];
	if(!order_allowed.includes(order)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid order!'
		});

		return cooldown(false, true);
	}

    var provider_allowed = [ ...[ 'all' ], ...Object.values(games).map(a => a.provider.id).filter((value, index, array) => array.indexOf(value) === index) ];
	if(!provider_allowed.includes(provider)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid provider!'
		});

		return cooldown(false, true);
	}

    if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);
	search = search.trim();

    var listitems = catalogGames('live').map(a => ({
        id: a.id,
        name: a.game.name,
        provider: {
            id: a.provider.id,
            name: a.provider.name
        },
        games: stats[a.id].games,
        winnings: stats[a.id].winnings
    }));

    var providersNames = Object.values(listitems.map(a => games[a.id].provider).reduce((acc, cur) => ({ ...acc, [cur.id]: ({
        id: cur.id,
        name: cur.name
    }) }), {})).sort((a, b) => a.name.localeCompare(b.name));

    listitems = listitems.filter(a => a.name.toLowerCase().indexOf(search.toLowerCase()) >= 0 || a.provider.name.toLowerCase().indexOf(search.toLowerCase()) >= 0);

    if(provider != 'all') listitems = listitems.filter(a => a.provider.id == provider);

    var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_live_games);

    if(pages <= 0){
        emitSocketToUser(socket, 'pagination', 'casino_live_games', {
            list: [],
            providers: [],
            pages: 1,
            page: 1
        });

        return cooldown(false, false);
    }

    if(page <= 0 || page > pages) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid page!'
        });

        return cooldown(false, true);
    }

    if(order == 0) listitems.sort((a, b) => b.games - a.games );
    else if(order == 1) listitems.sort((a, b) => b.winnings - a.winnings );
    else if(order == 2) listitems.sort((a, b) => a.name.localeCompare(b.name));
    else if(order == 3) listitems.sort((a, b) => b.name.localeCompare(a.name));

    var result = listitems.slice((page - 1) * config.app.pagination.items.casino_live_games, page * config.app.pagination.items.casino_live_games);

    var list = result.map(a => ({
        id: a.id,
        enable: providers[games[a.id].provider.id] !== undefined ? games[a.id].status && providers[games[a.id].provider.id].status : false,
        name: games[a.id].game.name,
        image: games[a.id].game.image,
        provider: games[a.id].provider.name,
        rtp: games[a.id].rtp,
        favorite: user && favorites[user.userid] !== undefined ? favorites[user.userid].some(b => b == a.id) : false
    }));

    emitSocketToUser(socket, 'pagination', 'casino_live_games', {
        list: list,
        providers: providersNames,
        pages: pages,
        page: page
    });

    cooldown(false, false);
}

/* ----- CLIENT USAGE ----- */
function getRecentGames(user, socket, page, order, provider, search, cooldown){
    cooldown(true, true);

    var order_allowed = [ 0, 1, 2, 3 ];
	if(!order_allowed.includes(order)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid order!'
		});

		return cooldown(false, true);
	}

    var provider_allowed = [ ...[ 'all' ], ...Object.values(games).map(a => a.provider.id).filter((value, index, array) => array.indexOf(value) === index) ];
	if(!provider_allowed.includes(provider)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid provider!'
		});

		return cooldown(false, true);
	}

    if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);
	search = search.trim();

    if(!user) {
        emitSocketToUser(socket, 'pagination', 'casino_recent_games', {
            list: [],
            providers: [],
            pages: 1,
            page: 1
        });

        return cooldown(false, false);
    }

    pool.query('SELECT `game`, MAX(`time`) AS `time` FROM `casino_bets` WHERE `userid` = ' + pool.escape(user.userid) + ' GROUP BY `game` ORDER BY `time` DESC', function(err1, row1) {
        if(err1){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting recent games (1)'
            });

            return cooldown(false, true);
        }

        var listitems = row1.filter(a => games[a.game] !== undefined).map(a => ({
            id: games[a.game].id,
            name: games[a.game].game.name,
            provider: {
                id: games[a.game].provider.id,
                name: games[a.game].provider.name
            },
            games: stats[games[a.game].id].games,
            winnings: stats[games[a.game].id].winnings
        }));

        var providersNames = Object.values(listitems.map(a => games[a.id].provider).reduce((acc, cur) => ({ ...acc, [cur.id]: ({
            id: cur.id,
            name: cur.name
        }) }), {})).sort((a, b) => a.name.localeCompare(b.name));

        listitems = listitems.filter(a => a.name.toLowerCase().indexOf(search.toLowerCase()) >= 0 || a.provider.name.toLowerCase().indexOf(search.toLowerCase()) >= 0);

        if(provider != 'all') listitems = listitems.filter(a => a.provider.id == provider);

        var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_recent_games);

        if(pages <= 0){
            emitSocketToUser(socket, 'pagination', 'casino_recent_games', {
                list: [],
                providers: [],
                pages: 1,
                page: 1
            });

            return cooldown(false, false);
        }

        if(page <= 0 || page > pages) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid page!'
            });

            return cooldown(false, true);
        }

        if(order == 0) listitems.sort((a, b) => b.games - a.games );
        else if(order == 1) listitems.sort((a, b) => b.winnings - a.winnings );
        else if(order == 2) listitems.sort((a, b) => a.name.localeCompare(b.name));
        else if(order == 3) listitems.sort((a, b) => b.name.localeCompare(a.name));

        var result = listitems.slice((page - 1) * config.app.pagination.items.casino_recent_games, page * config.app.pagination.items.casino_recent_games);

        var list = result.map(a => ({
            id: a.id,
            enable: providers[games[a.id].provider.id] !== undefined ? games[a.id].status && providers[games[a.id].provider.id].status : false,
            name: games[a.id].game.name,
            image: games[a.id].game.image,
            provider: games[a.id].provider.name,
            rtp: games[a.id].rtp,
            favorite: user && favorites[user.userid] !== undefined ? favorites[user.userid].some(b => b == a.id) : false
        }));

        emitSocketToUser(socket, 'pagination', 'casino_recent_games', {
            list: list,
            providers: providersNames,
            pages: pages,
            page: page
        });

        cooldown(false, false);
    });
}

/* ----- CLIENT USAGE ----- */
function getFavoritesGames(user, socket, page, order, provider, search, cooldown){
    cooldown(true, true);

    var order_allowed = [ 0, 1, 2, 3 ];
	if(!order_allowed.includes(order)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid order!'
		});

		return cooldown(false, true);
	}

    var provider_allowed = [ ...[ 'all' ], ...Object.values(games).map(a => a.provider.id).filter((value, index, array) => array.indexOf(value) === index) ];
	if(!provider_allowed.includes(provider)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid provider!'
		});

		return cooldown(false, true);
	}

    if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);
	search = search.trim();

    if(!user) {
        emitSocketToUser(socket, 'pagination', 'casino_favorites_games', {
            list: [],
            providers: [],
            pages: 1,
            page: 1
        });

        return cooldown(false, false);
    }

    var listitems = Object.values(games).map(a => ({
        id: a.id,
        name: a.game.name,
        provider: {
            id: a.provider.id,
            name: a.provider.name
        },
        games: stats[a.id].games,
        winnings: stats[a.id].winnings
    }));

    var providersNames = Object.values(listitems.map(a => games[a.id].provider).reduce((acc, cur) => ({ ...acc, [cur.id]: ({
        id: cur.id,
        name: cur.name
    }) }), {})).sort((a, b) => a.name.localeCompare(b.name));

    listitems = listitems.filter(a => a.name.toLowerCase().indexOf(search.toLowerCase()) >= 0 || a.provider.name.toLowerCase().indexOf(search.toLowerCase()) >= 0);

    if(provider != 'all') listitems = listitems.filter(a => a.provider.id == provider);

    listitems = favorites[user.userid] !== undefined ? listitems.filter(a => favorites[user.userid].some(b => b == a.id)) : [];

    var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_favorites_games);

    if(pages <= 0){
        emitSocketToUser(socket, 'pagination', 'casino_favorites_games', {
            list: [],
            providers: [],
            pages: 1,
            page: 1
        });

        return cooldown(false, false);
    }

    if(page <= 0 || page > pages) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid page!'
        });

        return cooldown(false, true);
    }

    if(order == 0) listitems.sort((a, b) => b.games - a.games );
    else if(order == 1) listitems.sort((a, b) => b.winnings - a.winnings );
    else if(order == 2) listitems.sort((a, b) => a.name.localeCompare(b.name));
    else if(order == 3) listitems.sort((a, b) => b.name.localeCompare(a.name));

    var result = listitems.slice((page - 1) * config.app.pagination.items.casino_favorites_games, page * config.app.pagination.items.casino_favorites_games);

    var list = result.map(a => ({
        id: a.id,
        enable: providers[games[a.id].provider.id] !== undefined ? games[a.id].status && providers[games[a.id].provider.id].status : false,
        name: games[a.id].game.name,
        image: games[a.id].game.image,
        provider: games[a.id].provider.name,
        rtp: games[a.id].rtp,
        favorite: true
    }));

    emitSocketToUser(socket, 'pagination', 'casino_favorites_games', {
        list: list,
        providers: providersNames,
        pages: pages,
        page: page
    });

    cooldown(false, false);
}

/* ----- CLIENT USAGE ----- */
function getAllGames(user, socket, page, search, cooldown){
    cooldown(true, true);

    if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);
	search = search.trim();

    var listitems = catalogGames().map(a => ({
        id: a.id,
        name: a.game.name,
        provider: {
            name: a.provider.name
        },
        games: stats[a.id].games,
        winnings: stats[a.id].winnings
    }));

    listitems = listitems.filter(a => a.name.toLowerCase().indexOf(search.toLowerCase()) >= 0 || a.provider.name.toLowerCase().indexOf(search.toLowerCase()) >= 0);

    var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_all_games);

    if(pages <= 0){
        emitSocketToUser(socket, 'pagination', 'casino_all_games', {
            list: [],
            pages: 1,
            page: 1
        });

        return cooldown(false, false);
    }

    if(page <= 0 || page > pages) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid page!'
        });

        return cooldown(false, true);
    }

    listitems.sort((a, b) => b.games - a.games );

    var result = listitems.slice((page - 1) * config.app.pagination.items.casino_all_games, page * config.app.pagination.items.casino_all_games);

    var list = result.map(a => ({
        id: a.id,
        enable: providers[games[a.id].provider.id] !== undefined ? games[a.id].status && providers[games[a.id].provider.id].status : false,
        name: games[a.id].game.name,
        image: games[a.id].game.image,
        provider: games[a.id].provider.name,
        rtp: games[a.id].rtp,
        favorite: user && favorites[user.userid] !== undefined ? favorites[user.userid].some(b => b == a.id) : false
    }));

    emitSocketToUser(socket, 'pagination', 'casino_all_games', {
        list: list,
        pages: pages,
        page: page
    });

    cooldown(false, false);
}

/* ----- CLIENT USAGE ----- */
function getProviders(user, socket, page, order, search, cooldown){
    cooldown(true, true);

    var order_allowed = [ 0, 1 ];
	if(!order_allowed.includes(order)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid order!'
		});

		return cooldown(false, true);
	}

    if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);
	search = search.trim();

    var listitems = Object.values(providers).filter(a => a.games.length > 0).map(a => ({
        id: a.id,
        name: a.name
    }));

    listitems = listitems.filter(a => a.name.toLowerCase().indexOf(search.toLowerCase()) >= 0);

    var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_providers);

    if(pages <= 0){
        emitSocketToUser(socket, 'pagination', 'casino_providers', {
            list: [],
            providers: [],
            pages: 1,
            page: 1
        });

        return cooldown(false, false);
    }

    if(page <= 0 || page > pages) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid page!'
        });

        return cooldown(false, true);
    }

    if(order == 0) listitems.sort((a, b) => a.name.localeCompare(b.name));
    else if(order == 1) listitems.sort((a, b) => b.name.localeCompare(a.name));

    var result = listitems.slice((page - 1) * config.app.pagination.items.casino_providers, page * config.app.pagination.items.casino_providers);

    var list = result.map(a => ({
        id: a.id,
        image: providers[a.id].image,
        games: providers[a.id].games.sort((b, c) => stats[c].games - stats[b].games ).slice(0, 20).map(b => ({
            id: b,
            enable: games[b].status && providers[a.id].status,
            name: games[b].game.name,
            image: games[b].game.image,
            provider: games[b].provider.name,
            rtp: games[b].rtp,
            favorite: user && favorites[user.userid] !== undefined ? favorites[user.userid].some(c => c == b) : false
        }))
    }));

    emitSocketToUser(socket, 'pagination', 'casino_providers', {
        list: list,
        pages: pages,
        page: page
    });

    cooldown(false, false);
}

/* ----- CLIENT USAGE ----- */
function getProvidersProviderGames(user, socket, page, id, order, search, cooldown){
    cooldown(true, true);

    var order_allowed = [ 0, 1, 2, 3 ];
	if(!order_allowed.includes(order)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid order!'
		});

		return cooldown(false, true);
	}

    if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);
	search = search.trim();

    if(providers[id] === undefined){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid provider!'
		});

		return cooldown(false, true);
	}

    var listitems = providers[id].games.map(a => ({
        id: a,
        name: games[a].game.name,
        provider: {
            name: games[a].provider.name
        },
        games: stats[a].games,
        winnings: stats[a].winnings
    }));

    listitems = listitems.filter(a => a.name.toLowerCase().indexOf(search.toLowerCase()) >= 0 || a.provider.name.toLowerCase().indexOf(search.toLowerCase()) >= 0);

    var pages = Math.ceil(listitems.length / config.app.pagination.items.casino_providers_games);

    if(pages <= 0){
        emitSocketToUser(socket, 'pagination', 'casino_providers_provider_games', {
            list: [],
            providers: [],
            pages: 1,
            page: 1
        });

        return cooldown(false, false);
    }

    if(page <= 0 || page > pages) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid page!'
        });

        return cooldown(false, true);
    }

    if(order == 0) listitems.sort((a, b) => b.games - a.games );
    else if(order == 1) listitems.sort((a, b) => b.winnings - a.winnings );
    else if(order == 2) listitems.sort((a, b) => a.name.localeCompare(b.name));
    else if(order == 3) listitems.sort((a, b) => b.name.localeCompare(a.name));

    var result = listitems.slice((page - 1) * config.app.pagination.items.casino_providers_games, page * config.app.pagination.items.casino_providers_games);

    var list = result.map(a => ({
        id: a.id,
        enable: games[a.id].status && providers[games[a.id].provider.id].status,
        name: games[a.id].game.name,
        image: games[a.id].game.image,
        provider: games[a.id].provider.name,
        rtp: games[a.id].rtp,
        favorite: user && favorites[user.userid] !== undefined ? favorites[user.userid].some(b => b == a.id) : false
    }));

    emitSocketToUser(socket, 'pagination', 'casino_providers_provider_games', {
        list: list,
        pages: pages,
        page: page
    });

    cooldown(false, false);
}

/* ----- CLIENT USAGE ----- */
function getLaunchGameDemo(user, socket, id, device, cooldown){
    cooldown(true, true);

    /* CHECK DATA */

    var allowed_device = [ 'mobile', 'desktop' ];
	if(!allowed_device.includes(device)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid device!'
		});

		return cooldown(false, true);
	}

    /* END CHECK DATA */

    if(games[id] === undefined) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid gameid!'
        });

        return cooldown(false, true);
    }

    if(!games[id].status) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'This game is disabled!'
        });

        return cooldown(false, true);
    }

    if(!games[id].demo) {
        emitSocketToUser(socket, 'message', 'error', {
			message: 'This game is not available in demo mode!'
		});

		return cooldown(false, true);
    }

    getLaunchUrl(0, 'Guest', id, true, device, function(err1, url){
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: blockedGames[id]
                    ? 'This game is unavailable and was removed from the lobby.'
                    : err1.message
            });

            return cooldown(false, true);
        }

        emitSocketToUser(socket, 'casino', 'launch', {
            id: id,
            game: games[id].game.name,
            provider: games[id].provider.name,
            url: url,
            favorite: user && favorites[user.userid] !== undefined ? favorites[user.userid].some(a => a == id) : false
        });

        cooldown(false, false);
    });
}

/* ----- CLIENT USAGE ----- */
function getLaunchGameReal(user, socket, id, device, cooldown){
    cooldown(true, true);

    /* CHECK DATA */

    var allowed_device = [ 'mobile', 'desktop' ];
	if(!allowed_device.includes(device)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid device!'
		});

		return cooldown(false, true);
	}

    /* END CHECK DATA */

    if(games[id] === undefined) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid gameid!'
        });

        return cooldown(false, true);
    }

    if(!games[id].status) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'This game is disabled!'
        });

        return cooldown(false, true);
    }

    if(!config.settings.games.casino.real && !haveRankPermission('play_casino_real', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Real mode temporary disabled!'
        });

        return cooldown(false, true);
    }

    pool.query('SELECT `id` FROM `users` WHERE `userid` = ' + pool.escape(user.userid), function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting launch game real (1)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Unknown user!'
            });

            return cooldown(false, true);
        }

        getLaunchUrl(row1[0].id, user.name, id, false, device, function(err2, url){
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: blockedGames[id]
                        ? 'This game is unavailable and was removed from the lobby.'
                        : err2.message
                });

                return cooldown(false, true);
            }

            emitSocketToUser(socket, 'casino', 'launch', {
                id: id,
                game: games[id].game.name,
                provider: games[id].provider.name,
                url: url,
                favorite: favorites[user.userid] !== undefined ? favorites[user.userid].some(a => a == id) : false
            });

            cooldown(false, false);
        });
    });
}

function getPopularPrividers(){
    // One tile per provider that still has a listed game
    var seen = {};
    return catalogGames().filter(function(game) {
        if(seen[game.provider.id]) return false;
        seen[game.provider.id] = true;
        return providers[game.provider.id] !== undefined;
    }).slice(0, 40).map(function(game) {
        return {
            id: game.provider.id,
            image: providers[game.provider.id].image
        };
    });
}

function getPopularSlotsGames(userid){
    return catalogGames('slots').slice(0, 40).map(mapGameCard);
}

function mapGameCard(a) {
    return ({
        id: a.id,
        enable: true,
        name: a.game.name,
        image: a.game.image,
        provider: a.provider.name,
        rtp: a.rtp
    });
}

function getCasinoStatus(){
    var agent = config.games.games.casino.drakon.agent || {};
    var listed = catalogGames();
    return {
        configured: !!(agent.code && agent.token && agent.secret_key),
        authenticated: !!token,
        market: config.games.games.casino.market || 'all',
        realMoneyOnly: !!config.games.games.casino.real_money_only,
        onePerProvider: !!config.games.games.casino.one_per_provider,
        providers: Object.keys(providers).length,
        games: listed.length,
        slots: catalogGames('slots').length,
        live: catalogGames('live').length,
        blocked: Object.keys(blockedGames).length,
        updating: !!updating.value
    };
}

function getPopularLiveGames(userid){
    return catalogGames('live').slice(0, 40).map(mapGameCard);
}

function getHotGamesList(userid){
    return Object.values(stats).sort((a, b) => b.games - a.games ).slice(0, 20).map(a => ({
        id: a.id,
        enable: providers[games[a.id].provider.id] !== undefined ? games[a.id].status && providers[games[a.id].provider.id].status : false,
        name: games[a.id].game.name,
        image: games[a.id].game.image,
        provider: games[a.id].provider.name,
        rtp: games[a.id].rtp,
        favorite: userid ? favorites[userid] !== undefined ? favorites[userid].some(b => b == a.id) : false : false
    }));
}

function getSlotsGamesList(userid){
    return Object.values(stats).sort((a, b) => b.games - a.games ).filter(a => games[a.id].type == 'slots').slice(0, 20).map(a => ({
        id: a.id,
        enable: providers[games[a.id].provider.id] !== undefined ? games[a.id].status && providers[games[a.id].provider.id].status : false,
        name: games[a.id].game.name,
        image: games[a.id].game.image,
        provider: games[a.id].provider.name,
        rtp: games[a.id].rtp,
        favorite: userid ? favorites[userid] !== undefined ? favorites[userid].some(b => b == a.id) : false : false
    }));
}

function getLiveGamesList(userid){
    return Object.values(stats).sort((a, b) => b.games - a.games ).filter(a => games[a.id].type == 'live').slice(0, 20).map(a => ({
        id: a.id,
        enable: providers[games[a.id].provider.id] !== undefined ? games[a.id].status && providers[games[a.id].provider.id].status : false,
        name: games[a.id].game.name,
        image: games[a.id].game.image,
        provider: games[a.id].provider.name,
        rtp: games[a.id].rtp,
        favorite: userid ? favorites[userid] !== undefined ? favorites[userid].some(b => b == a.id) : false : false
    }));
}

/* ----- INTERNAL USAGE ----- */
function registerLastLostBet(userid, game, callback){
    pool.query('SELECT `id`, `amount` FROM (SELECT casino_bets.id, casino_bets.amount, casino_winnings.betid FROM `casino_bets` LEFT JOIN `casino_winnings` ON casino_bets.id = casino_winnings.betid WHERE casino_bets.userid = ' + pool.escape(userid) + ' AND casino_bets.game = ' + pool.escape(game) + ' ORDER BY casino_bets.id DESC LIMIT 1) `main` WHERE `betid` IS NULL', function(err1, row1) {
        if(err1) return callback(err1);

        if(row1.length <= 0) return callback(null);

        historyService.registerHistory(userid, 'casino', game, games[game].game.name, row1[0].id, getFormatAmount(row1[0].amount), 0, 0, true, 0, function(err2){
            if(err2) return callback(err2);

            callback(null);
        });
    });
}

/* ----- API USAGE ----- */
function getUserDetails(id, callback){
    pool.query('SELECT `email`, `name` FROM `users` WHERE `id` = ' + pool.escape(id), function(err1, row1) {
        if(err1) return callback('INVALID_USER');

        if(row1.length <= 0) return callback('INVALID_USER');

        return callback(null, {
            email: row1[0].email,
            player_name: row1[0].name,
            date: new Date().toISOString()
        });
    });
}

/* ----- API USAGE ----- */
function getUserBalance(id, callback){
    pool.query('SELECT `balance` FROM `users` WHERE `id` = ' + pool.escape(id), function(err1, row1) {
        if(err1) return callback('INVALID_USER');

        if(row1.length <= 0) return callback('INVALID_USER');

        return callback(null, getFormatAmount(row1[0].balance));
    });
}

/* ----- API USAGE ----- */
function placeBet(id, amount, transactionid, roundid, game, callback){
    if(gameids[game] === undefined) return callback('INVALID_USER');

    pool.query('SELECT `userid`, `name`, `avatar`, `xp` FROM `users` WHERE `id` = ' + pool.escape(id), function(err1, row1) {
        if(err1) return callback('INVALID_USER');

        if(row1.length <= 0) return callback('INVALID_USER');

        registerLastLostBet(row1[0].userid, gameids[game], function(err2){
            if(err2) return callback('INVALID_USER');

            pool.query('SELECT `id` FROM `casino_bets` WHERE `roundid` = ' + pool.escape(roundid), function(err3, row3) {
                if(err3) return callback('INVALID_USER');

                if(row3.length > 0) return callback('DOUBLED_BET');

                amount = getFormatAmount(amount);

                //CHECK BALANCE
                userService.getBalance(row1[0].userid, function(err4, balance){
                    if(err4) return callback('INVALID_USER');

                    if(balance < amount) return callback('NO_BALANCE');

                    //REGISTER BET
                    userService.registerClassicBet(row1[0].userid, amount, 'casino', function(err5, newxp, newbalance){
                        if(err5) return callback('INVALID_USER');

                        pool.query('INSERT INTO `casino_bets` SET `userid` = ' + pool.escape(row1[0].userid) + ', `name` = ' + pool.escape(row1[0].name) + ', `avatar` = ' + pool.escape(row1[0].avatar) + ', `xp` = ' + parseInt(row1[0].xp) + ', `amount` = ' + amount + ', `game` = ' + pool.escape(gameids[game]) + ', `transactionid` = ' + pool.escape(transactionid) + ', `roundid` = ' + pool.escape(roundid) + ', `time` = ' + pool.escape(time()), function(err6) {
                            if(err6) return callback('INVALID_USER');

                            stats[gameids[game]].games++;
                            stats[gameids[game]].bets = getFormatAmount(stats[gameids[game]] + amount);

                            userService.updateLevel(row1[0].userid, newxp);

                            loggerTrace('[CASINO] Bet registed. ' + row1[0].name + ' did bet $' + getFormatAmountString(amount));

                            callback(null, newbalance);
                        });
                    });
                });
            });
        });
	});
}

/* ----- API USAGE ----- */
function finishBet(id, winning, roundid, callback){
    //VERIFY FORMAT AMOUNT
	verifyFormatAmount(winning, function(err1, winning){
		if(err1) return callback('NO_AMOUNT');

        if(winning <= 0) return callback('NO_AMOUNT');

        pool.query('SELECT `userid`, `name`, `avatar`, `xp` FROM `users` WHERE `id` = ' + pool.escape(id), function(err2, row2) {
            if(err2) return callback('INVALID_USER');

            if(row2.length <= 0) return callback('INVALID_USER');

            pool.query('SELECT `id`, `game`, `amount` FROM `casino_bets` WHERE `roundid` = ' + pool.escape(roundid) + ' AND `userid` = ' + pool.escape(row2[0].userid) + ' AND `refunded` = 0', function(err3, row3) {
                if(err3) return callback('INVALID_USER');

                if(row3.length <= 0) return callback('INVALID_TRANSACTION');

                //FINISH BET
                userService.finishClassicBet(row2[0].userid, getFormatAmount(row3[0].amount), winning, 'casino', row3[0].game, games[row3[0].game].game.name, {
                    active: true,
                    visible: true,
                    betid: row3[0].id,
                    countdown: 1000
                }, function(err4, newbalance){
                    if(err4) return callback('INVALID_USER');

                    pool.query('INSERT INTO `casino_winnings` SET `betid` = ' + pool.escape(row3[0].id) + ', `amount` = ' + winning + ', `time` = ' + pool.escape(time()), function(err5) {
                        if(err5) return callback('INVALID_USER');

                        stats[row3[0].game].winnings = getFormatAmount(stats[row3[0].game] + winning);

                        loggerTrace('[CASINO] Win registed. ' + row2[0].name + ' did win $' + getFormatAmountString(winning));

                        callback(null, newbalance);
                    });
                });
            });
        });
    });
}

/* ----- API USAGE ----- */
function refundBet(id, amount, roundid, callback){
    //VERIFY FORMAT AMOUNT
	verifyFormatAmount(amount, function(err1, amount){
		if(err1) return callback('NO_AMOUNT');

        if(amount <= 0) return callback('NO_AMOUNT');

        pool.query('SELECT `userid`, `name`, `avatar`, `xp` FROM `users` WHERE `id` = ' + pool.escape(id), function(err2, row2) {
            if(err2) return callback('NO_AMOUNT');

            if(row2.length <= 0) return callback('NO_AMOUNT');

            pool.query('SELECT `id` FROM `casino_bets` WHERE `roundid` = ' + pool.escape(roundid) + ' AND `userid` = ' + pool.escape(row2[0].userid) + ' AND `refunded` = 0', function(err3, row3) {
                if(err3) return callback('NO_AMOUNT');

                if(row3.length <= 0) return callback('NO_AMOUNT');

                //REFUND BET
                userService.refundClassicBet(row2[0].userid, amount, 'casino', function(err4, newbalance){
                    if(err4) return callback('NO_AMOUNT');

                    pool.query('UPDATE `casino_bets` SET `refunded` = 1 WHERE `roundid` = ' + pool.escape(roundid) + ' AND `userid` = ' + pool.escape(row2[0].userid) + ' AND `refunded` = 0', function(err5) {
                        if(err5) return callback('NO_AMOUNT');

                        pool.query('INSERT INTO `casino_refunds` SET `betid` = ' + pool.escape(row3[0].id) + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err6) {
                            if(err6) return callback('NO_AMOUNT');

                            loggerTrace('[CASINO] Refund registed. ' + row2[0].name + ' did refund $' + getFormatAmountString(amount));

                            callback(null, newbalance);
                        });
                    });
                });
            });
        });
    });
}

/*

Fetch campaign data (providers & games bonus options)

1. Get the available providers list for campaigns
GET: https://gator.drakon.casino/api/v1/campaigns/vendors
Authorization: Bearer YOUR_ACCESS_TOKEN
Response:
{
    "status": true,
    "data": [ "pragmatic", "evolution", "vendor_x" ]
}

2. Get the provider campaign bonus options list for all games (cost bonus & amount free spins)
GET: https://gator.drakon.casino/api/v1/campaigns/vendors/limits?vendors=pragmatic&games=17000,17003
Where vendors = provider, games = the list of games
Authorization: Bearer YOUR_ACCESS_TOKEN
Response:
{
    "status": true,
    "data": [
        {
            "vendor": "pragmatic",
            "game_id": 17000,
            "currency_code": "BRL",
            "limits": [ "0.50", "1.25", "2.50" ],
            "freespins_per_player": [ 5, 10, 20 ]
        }
    ]
}

Create campaign

1. New Admin Panel Route (/casino)
/casino - settings to enable/disable casino games, real mode, demo mode, providers, games
/casino/campaigns/create - load all available providers for campaigns > load all games available for the selected provider > load all bonus options
/casino/campaigns/list - load all active campaigns, option to View Campaign, Add User, Remove User, Delete Campaign
/casino/campaigns/:id - view the campaign, list of users

POST: https://gator.drakon.casino/api/v1/campaigns/create
Authorization: Bearer YOUR_ACCESS_TOKEN
Idempotency-Key: create-cmp_brl_0001
Request:
{
    "campaign_code": "cmp_brl_0001",
    "vendor": "pragmatic",
    "freespins_per_player": 10,
    "begins_at": 1774300800,
    "expires_at": 1774387200,
    "games": [
        {
            "game_id": 17000,
            "total_bet": "0.50"
        }
    ],
    "players": [ "12345", "56789" ]
}
Where campaign_code = Unique campaign code in your system
      vendor = provider
      freespins_per_player = Number of free spins granted per player
      begins_at = Campaign start time
      expires_at = Campaign end time
      games = One or more objects with game_id and total_bet
      players = Remote user IDs assigned at creation time - is not required
Create campaign not no players, then Add Players
Response:
{
    "status": true,
    "message": "Campaign created successfully.",
    "data": {
        "campaign_code": "cmp_brl_0001",
        "vendor": "pragmatic",
        "currency_code": "BRL",
        "freespins_per_player": 10,
        "games_meta": [
            {
                "game_id": 17000,
                "total_bet": "0.50"
            }
        ],
        "players": [ "12345", "56789" ],
        "active": true,
        "status": "active"
    }
}

Cancel campaign
POST: https://gator.drakon.casino/api/v1/campaigns/cmp_brl_0001/cancel
Authorization: Bearer YOUR_ACCESS_TOKEN
Idempotency-Key: cancel-cmp_brl_0001

Add players to a campaign
POST: https://gator.drakon.casino/api/v1/campaigns/cmp_brl_0001/players/add
Authorization: Bearer YOUR_ACCESS_TOKEN
Idempotency-Key: cancel-cmp_brl_0001
Request:
{
    "players": [ "12345", "56789" ]
}
Response:
{
    "status": true,
    "data": {
        "campaign_code": "cmp_brl_0001",
        "players": ["12345", "56789"]
    }
}

Remove players from a campaign
POST: https://gator.drakon.casino/api/v1/campaigns/cmp_brl_0001/players/remove
Request:
{
    "players": [ "12345", "56789" ]
}

Recommended pattern: keep campaigns pre-created and add eligible players as they qualify. This is
operationally simpler and reduces timing risks at the moment of game launch.

*/

function initializeCampaigns(callback){
    loadVendors(function(err1){
        if(err1) return callback(err1);

        loggerDebug('[CASINO] Vendors Loaded');

        callback(null);
    });
}

function loadVendors(callback) {
    var options = {
		'method': 'GET',
		'url': 'https://gator.drakon.casino/api/v1/campaigns/vendors/limits',
		'headers': {
			'Authorization': 'Bearer ' + token
		}
	};

    request(options, function(err1, response1, body1) {
		if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while loading vendors (1)'));
        }

        if(!response1 || response1.statusCode != 200) return callback(new Error('An error occurred while loading vendors (2)'));
		if(!isJsonString(body1)) return callback(new Error('An error occurred while loading vendors (3)'));

        var body = JSON.parse(body1);

        var vendorsNew = [];

        //bet_factors
        //bet_levels
        //freespins_per_player

        body.data.filter(a => a.limits !== undefined && Array.isArray(a.limits) && a.limits.length > 0).filter(a => a.freespins_per_player !== undefined && Array.isArray(a.freespins_per_player) && a.freespins_per_player.length > 0).forEach(function(item){
            if(providerids[item.vendor] !== undefined) {
                if(gameids[item.game_id] !== undefined) {
                    vendors[gameids[item.game_id]] = {
                        id: gameids[item.game_id],
                        provider: providerids[item.vendor],
                        amounts: item.limits,
                        spins: item.freespins_per_player
                    };

                    vendorsNew.push(gameids[item.game_id]);
                }
            }
        });

        Object.keys(vendors).filter(a => !vendorsNew.some(b => b == a)).forEach(function(id){
            delete vendors[id];
        });

        callback(null);
    });
}

module.exports = {
    providers, games, stats, favorites,
    initializeCasino,
    getPopularPrividers, getPopularSlotsGames, getPopularLiveGames, getSlotsGames, getLiveGames, getRecentGames, getFavoritesGames, getAllGames, getProviders, getProvidersProviderGames, getCasinoStatus,
    setFavoriteGame, unsetFavoriteGame,
    getLaunchGameDemo, getLaunchGameReal,
    getHotGamesList, getSlotsGamesList, getLiveGamesList,
    getUserDetails, getUserBalance, placeBet, finishBet, refundBet
};