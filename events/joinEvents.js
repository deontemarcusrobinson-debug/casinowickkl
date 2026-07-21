var sha256 = require('sha256');
var crypto = require('crypto');

var config = require('@/config/config.js');

var io = require('@/lib/socket.js');

var { loggerWarn } = require('@/lib/logger.js');

var { time } = require('@/utils/formatDate.js');
var { roundedToFixed, getFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser, emitSocketToAll } = require('@/utils/socket.js');
var { haveRankPermission, calculateLevel } = require('@/utils/utils.js');

var chatService = require('@/services/chatService.js');

var historyService = require('@/services/historyService.js');

var rainService = require('@/services/rainService.js');

var rouletteService = require('@/services/games/rouletteService.js');
var crashService = require('@/services/games/crashService.js');
var jackpotService = require('@/services/games/jackpotService.js');
var coinflipService = require('@/services/games/coinflipService.js');
var minesweeperService = require('@/services/games/minesweeperService.js');
var towerService = require('@/services/games/towerService.js');
var plinkoService = require('@/services/games/plinkoService.js');

var cryptoService = require('@/services/trading/cryptoService.js');

function dRain(user, socket){
	if(rainService.gameProperties.status == 'waiting') {
		emitSocketToUser(socket, 'rain', 'waiting', {
			last: rainService.lastGame.value,
			amount: rainService.gameProperties.amount
		});
	} else if(rainService.gameProperties.status == 'started'){
		emitSocketToUser(socket, 'rain', 'started', {
			time: config.app.rain.cooldown_start + rainService.gameProperties.roll - time(),
			cooldown: config.app.rain.cooldown_start,
			amount: rainService.gameProperties.amount,
			joined: user && rainService.userBets[user.userid] !== undefined && rainService.userBets[user.userid] >= 1
		});
	} else {
		emitSocketToUser(socket, 'rain', 'started', {
			time: 0,
			cooldown: config.app.rain.cooldown_start,
			amount: rainService.gameProperties.amount,
			joined: user && rainService.userBets[user.userid] !== undefined && rainService.userBets[user.userid] >= 1
		});
	}
}

function dJackpot(user, socket){
	if(jackpotService.gameProperties.status == 'rolling'){
		emitSocketToUser(socket, 'jackpot', 'roll', {
			avatars: jackpotService.gameSettings.avatars_rolling,
			cooldown: new Date().getTime() - jackpotService.gameSettings.start_time
		});

	} else if(jackpotService.gameProperties.status == 'picking'){
		emitSocketToUser(socket, 'jackpot', 'picking');
	}
}

function dRoulette(user, socket){
	if(rouletteService.gameProperties.status == 'rolling' || rouletteService.gameProperties.status == 'jackpot' || rouletteService.gameProperties.status == 'ended'){
		var colors = [];

		if(rouletteService.gameProperties.roll == 0) colors.push('green');
		else if(rouletteService.gameProperties.roll >= 1 && rouletteService.gameProperties.roll <= 7) colors.push('red');
		else if(rouletteService.gameProperties.roll >= 8 && rouletteService.gameProperties.roll <= 14) colors.push('black');

		if(rouletteService.gameProperties.roll == 4 || rouletteService.gameProperties.roll == 11) colors.push('bait');

		emitSocketToUser(socket, 'roulette', 'timer', {
			time: 0,
			cooldown: config.games.games.roulette.cooldown_rolling
		});

		emitSocketToUser(socket, 'roulette', 'roll', {
			roll: {
				id: rouletteService.gameProperties.id,
				roll: rouletteService.gameProperties.roll,
				colors: colors,
				progress: rouletteService.gameProperties.progress
			},
			greens: rouletteService.jackpotProperties.greens.actual,
			cooldown: config.games.games.roulette.cooldown_rolling - rouletteService.gameSettings.timer - 3
		});
	} else {
		if(rouletteService.gameSettings.timer - config.games.games.roulette.cooldown_rolling >= 0){
			emitSocketToUser(socket, 'roulette', 'timer', {
				time: rouletteService.gameSettings.timer - config.games.games.roulette.cooldown_rolling,
				cooldown: config.games.games.roulette.timer
			});
		}
	}
}

function dCrash(user, socket){
	if(crashService.gameProperties.status == 'started'){
		emitSocketToUser(socket, 'crash', 'starting', {
			time: crashService.gameSettings.start_time > 0 ? Math.floor(config.games.games.crash.timer * 1000 - new Date().getTime() + crashService.gameSettings.start_time) : Math.floor(config.games.games.crash.timer * 1000),
			total: user && crashService.userBets[user.userid] !== undefined ? crashService.userBets[user.userid]['amount'] : 0,
			profit: 0
		});
	} else if(crashService.gameProperties.status == 'counting'){
		emitSocketToUser(socket, 'crash', 'started', {
			difference: new Date().getTime() - crashService.gameSettings.progress_time
		});

		if(user && crashService.userBets[user.userid] !== undefined){
			if(crashService.userBets[user.userid]['cashedout'] == true){
				var winning = getFormatAmount(crashService.userBets[user.userid]['amount'] * crashService.userBets[user.userid]['point'] / 100);

				emitSocketToUser(socket, 'crash', 'cashed_out', {
					total: winning,
					profit: getFormatAmount(winning - crashService.userBets[user.userid]['amount'])
				});
			}
		}
	} else if(crashService.gameProperties.status == 'ended'){
		var winners = [];
		for(var bet of crashService.totalBets) {
			if(crashService.userBets[bet.user.userid]['cashedout']) {
				winners.push(bet.user);
			}
		}

		if(user && crashService.userBets[user.userid] !== undefined){
			if(crashService.userBets[user.userid]['cashedout'] == true){
				var winning = getFormatAmount(crashService.userBets[user.userid]['amount'] * crashService.userBets[user.userid]['point'] / 100);

				emitSocketToUser(socket, 'crash', 'cashed_out', {
					total: winning,
					profit: getFormatAmount(winning - crashService.userBets[user.userid]['amount'])
				});
			}
		}

		emitSocketToUser(socket, 'crash', 'crashed', {
			number: crashService.gameProperties.roll,
			time: crashService.gameSettings.end_time,
			loaded: true,
			winners: winners.map(a => a.userid)
		});

		if(user && crashService.userBets[user.userid] !== undefined){
			if(crashService.userBets[user.userid]['cashedout'] == true){
				var winning = getFormatAmount(crashService.userBets[user.userid]['amount'] * crashService.userBets[user.userid]['point'] / 100);

				emitSocketToUser(socket, 'crash', 'cashed_out', {
					amount: winning,
					loaded: true
				});
			}
		}
	}
}

module.exports = (socket) => {
    return (data, callback) => {
        var agent = socket.handshake.headers['user-agent'];
        var device = crypto.createHash('sha256').update(agent).digest('hex');

        if(typeof callback !== 'function') return emitSocketToUser(socket, 'message', 'error', {
            message: 'Your page is now inactive. Please force refresh the page!'
        });

		if(socket.data.channel === undefined || socket.data.history === undefined || socket.data.paths === undefined) return callback({
            success: false,
            error: 'Your page is now inactive. Please force refresh the page!'
        });

		if(socket.data.paths.length <= 0) return callback({
            success: false,
            error: 'Your page is now inactive. Please force refresh the page!'
        });

		if(!Object.keys(config.app.chat.channels).includes(socket.data.channel)) return callback({
            success: false,
            error: 'Your page is now inactive. Please force refresh the page!'
        });

        //USER ROOM
        socket.join(socket.data.user ? socket.data.user.userid : socket.id);

        //DEVICE ROOM
        socket.join(device);

        //PAGE ROOM
        if([
            'account', 'user', 'admin'
        ].includes(socket.data.paths[0])) socket.join(socket.data.paths[0]);
        else {

            //PAGE PATHS ROOM
            socket.join(socket.data.paths.join('/'));
        }

        if(socket.data.user) loggerWarn('[SERVER] User with userid ' + socket.data.user.userid + ' is connected on page /' + socket.data.paths.join('/'));
        else loggerWarn('[SERVER] Guest with socketid ' + socket.id + ' is connected on page /' + socket.data.paths.join('/'));

        //CHAT ROOM
        socket.join('chat_channel_' + socket.data.channel);

        //GAMES AMOUNTS
        var games_intervalAmounts = {};

        Object.keys(config.settings.games.games.original).forEach(function(item){
            if(config.app.intervals.amounts[item] !== undefined) games_intervalAmounts[item] = config.app.intervals.amounts[item];
        });

        games_intervalAmounts.deposit_manual = config.app.intervals.amounts.deposit_manual;
        games_intervalAmounts.withdraw_manual = config.app.intervals.amounts.withdraw_manual;

        games_intervalAmounts.tip_player = config.app.intervals.amounts.tip_player;
        games_intervalAmounts.tip_rain = config.app.intervals.amounts.tip_rain;
        games_intervalAmounts.deposit_crypto = config.app.intervals.amounts.deposit_crypto;
        games_intervalAmounts.withdraw_crypto = config.app.intervals.amounts.withdraw_crypto;

        //GAMES HOUSE EDGE
        var games_houseEdges = {};

        games_houseEdges.dice = config.settings.games.games.original.dice.house_edge.value;

        var banned = socket.data.user ? (socket.data.user.restrictions.site >= time() || socket.data.user.restrictions.site == -1) && !haveRankPermission('exclude_ban_play', socket.data.user.rank) : false;

        var socket_return = {
            maintenance: socket.data.maintenance,
            banned: banned
        };

        if(!socket.data.maintenance){
            socket_return.amounts = games_intervalAmounts;
            socket_return.house_edges = games_houseEdges;

            socket_return.user = {
                userid: socket.data.user ? socket.data.user.userid : socket.id,
                balances: [
                    { type: 'main', balance: socket.data.user ? getFormatAmount(socket.data.user.balance) : 0 }
                ],
                settings: {
                    anonymous: socket.data.user ? socket.data.user.anonymous : 0,
                    private: socket.data.user ? socket.data.user.private : 0
                },
                level: calculateLevel(socket.data.user ? socket.data.user.xp : 0),
                authorized: socket.data.user ? socket.data.user.authorized : {
                    account: false,
                    admin: false
                }
            };

            socket_return.chat = {
                messages: [ ...(chatService.messages[socket.data.channel] || []), ...[{
                    type: 'system',
                    message: config.app.chat.greeting.message,
                    time: time()
                }] ],
                listignore: socket.data.user && chatService.ignoreList[socket.data.user.userid] !== undefined ? Object.keys(chatService.ignoreList[socket.data.user.userid]) : []
            };

            socket_return.offers = {
            };

            if(!banned){
                var game_enabled = false;

                if(config.settings.games.games.original[socket.data.paths[0]] !== undefined) {
                    if(config.settings.games.games.original[socket.data.paths[0]].enable) game_enabled = true;
                } else if(config.settings.games.games.classic[socket.data.paths[0]] !== undefined) {
                    if(config.settings.games.games.classic[socket.data.paths[0]].enable) game_enabled = true;
                }

                if(haveRankPermission('play_disabled', socket.data.user ? socket.data.user.rank : 0)) game_enabled = true;

                if(socket.data.paths[0] == 'roulette' && game_enabled) {
                    socket_return.roulette = {
                        bets: rouletteService.totalBets,
                        totals: Object.keys(config.games.games.roulette.multipliers).reduce((acc, cur) => ({
                            ...acc, [cur]: {
                                amount: rouletteService.totalBets.filter(a => a.color == cur).reduce((acc, cur) => getFormatAmount(acc + cur.amount), 0),
                                count: rouletteService.totalBets.filter(a => a.color == cur).length
                            }
                        }), {}),
                        last: rouletteService.lastRoll,
                        history: rouletteService.lastGames,
                        hundred: Object.keys(config.games.games.roulette.multipliers).reduce((acc, cur) => ({
                            ...acc, [cur]: rouletteService.last100Games.filter(a => a.color == cur).length
                        }), {}),
                        fair: {
                            id: rouletteService.gameProperties.id,
                            public_seed: rouletteService.gameProperties.public_seed
                        },
                        jackpot: {
                            total: rouletteService.jackpotProperties.amount,
                            greens: rouletteService.jackpotProperties.greens.last
                        }
                    };
                }

                if(socket.data.paths[0] == 'crash' && game_enabled) {
                    socket_return.crash = {
                        history: crashService.lastGames,
                        bets: crashService.totalBets.map(a => ({
                            id: a.id,
                            user: a.user,
                            amount: a.amount,
                            cashedout: crashService.userBets[a.user.userid].cashedout,
                            ended: crashService.gameProperties.status == 'ended',
                            at: crashService.userBets[a.user.userid].cashedout ? roundedToFixed(crashService.userBets[a.user.userid].point / 100, 2) : null,
                            profit: crashService.userBets[a.user.userid].cashedout ? getFormatAmount(crashService.userBets[a.user.userid].amount * crashService.userBets[a.user.userid].point / 100 - crashService.userBets[a.user.userid].amount) : null
                        })),
                        fair: {
                            id: crashService.gameProperties.id,
                            public_seed: crashService.gameProperties.public_seed
                        }
                    };
                }

                if(socket.data.paths[0] == 'jackpot' && game_enabled) {
                    socket_return.jackpot = {
                        fair: {
                            server_seed_hashed: sha256(jackpotService.gameProperties.server_seed),
                            nonce: jackpotService.gameProperties.id,
                            server_seed: jackpotService.gameProperties.status == 'rolling' ? jackpotService.gameProperties.server_seed : null,
                            public_seed: jackpotService.gameProperties.status == 'rolling' ? jackpotService.gameProperties.public_seed : null,
                            block: jackpotService.gameProperties.status == 'eos' || jackpotService.gameProperties.status == 'rolling' ? jackpotService.gameProperties.block : null
                        },
                        avatars: jackpotService.gameAvatars,
                        bets: jackpotService.totalBets,
                        total: getFormatAmount(jackpotService.totalBets.reduce((acc, cur) => acc + cur.amount, 0)),
                        chance: socket.data.user && jackpotService.userBets[socket.data.user.userid] !== undefined && jackpotService.userBets[socket.data.user.userid].total > 0 ? roundedToFixed(jackpotService.userBets[socket.data.user.userid].amount / getFormatAmount(jackpotService.totalBets.reduce((acc, cur) => acc + cur.amount, 0)) * 100, 2) : 0,
                        history: jackpotService.lastGames
                    };
                }

                if(socket.data.paths[0] == 'coinflip' && game_enabled) {
                    socket_return.coinflip = {
                        bets: Object.keys(coinflipService.games).map((bet) => ({
                            id: bet,
                            status: coinflipService.games[bet].status,
                            players: coinflipService.games[bet].players,
				            creator: coinflipService.games[bet].creator,
                            amount: coinflipService.games[bet].amount,
                            ...(function() {
                                var coinflip = {};

                                coinflip.fair = {
                                    server_seed_hashed: sha256(coinflipService.games[bet].fair.server_seed),
                                    nonce: bet
                                };

                                if(coinflipService.games[bet].status == 1) {
                                    coinflip.time = config.games.games.coinflip.timer_wait_start - time() + coinflipService.games[bet].time
                                } else if(coinflipService.games[bet].status == 2) {
                                    coinflip.fair.block = coinflipService.games[bet].fair.block;
                                } else if(coinflipService.games[bet].status == 3) {
                                    coinflip.fair.block = coinflipService.games[bet].fair.block;

                                    coinflip.winner = coinflipService.getWinner(bet);
                                } else if(coinflipService.games[bet].status == 4) {
                                    coinflip.fair.server_seed = coinflipService.games[bet].fair.server_seed;
                                    coinflip.fair.public_seed = coinflipService.games[bet].fair.public_seed;
                                    coinflip.fair.block = coinflipService.games[bet].fair.block;

                                    coinflip.winner = coinflipService.getWinner(bet);
                                }

                                return { data: coinflip };
                            }())
                        }))
                    };
                }

                if(socket.data.paths[0] == 'dice' && game_enabled) {
                    socket_return.dice = {};
                }

                if(socket.data.paths[0] == 'minesweeper' && game_enabled) {
                    socket_return.minesweeper = {
                        game: socket.data.user && minesweeperService.games[socket.data.user.userid] !== undefined ? {
                            total: minesweeperService.games[socket.data.user.userid].route.length == 0 ? minesweeperService.games[socket.data.user.userid].amount : getFormatAmount(minesweeperService.games[socket.data.user.userid].amount * minesweeperService.generateMultipliers(minesweeperService.games[socket.data.user.userid].bombs)[minesweeperService.games[socket.data.user.userid].route.length - 1]),
                            profit: minesweeperService.games[socket.data.user.userid].route.length == 0 ? 0 : getFormatAmount(getFormatAmount(minesweeperService.games[socket.data.user.userid].amount * minesweeperService.generateMultipliers(minesweeperService.games[socket.data.user.userid].bombs)[minesweeperService.games[socket.data.user.userid].route.length - 1]) - minesweeperService.games[socket.data.user.userid].amount),
                            route: minesweeperService.games[socket.data.user.userid].route,
                            amount: minesweeperService.games[socket.data.user.userid].amount,
                            multipliers: minesweeperService.generateMultipliers(minesweeperService.games[socket.data.user.userid].bombs).slice(0, minesweeperService.games[socket.data.user.userid].route.length)
                        } : null
                    };
                }

                if(socket.data.paths[0] == 'tower' && game_enabled) {
                    socket_return.tower = {
                        game: socket.data.user && towerService.games[socket.data.user.userid] !== undefined ? {
                            difficulty: towerService.games[socket.data.user.userid].difficulty,
                            total: towerService.games[socket.data.user.userid].route.length == 0 ? towerService.games[socket.data.user.userid].amount : getFormatAmount(towerService.games[socket.data.user.userid].amount * towerService.generateMultipliers(towerService.games[socket.data.user.userid].difficulty)[towerService.games[socket.data.user.userid].route.length - 1]),
                            profit: towerService.games[socket.data.user.userid].route.length == 0 ? 0 : getFormatAmount(getFormatAmount(towerService.games[socket.data.user.userid].amount * towerService.generateMultipliers(towerService.games[socket.data.user.userid].difficulty)[towerService.games[socket.data.user.userid].route.length - 1]) - towerService.games[socket.data.user.userid].amount),
                            route: towerService.games[socket.data.user.userid].route,
                            amount: towerService.games[socket.data.user.userid].amount
                        } : null,
                        multipliers: Object.keys(config.games.games.tower.tiles).reduce((acc, cur) => ({ ...acc, [cur]: towerService.generateMultipliers(cur) }), {})
                    };
                }

                if(socket.data.paths[0] == 'plinko' && game_enabled) {
                    socket_return.plinko = {
                        multipliers: plinkoService.generateAmounts()
                    };
                }

                if(socket.data.paths[0] == 'casino' && game_enabled) {
                    socket_return.casino = {};
                }

                if(socket.data.paths[0] == 'deposit' || socket.data.paths[0] == 'withdraw') {
                    if(socket.data.paths[1] == 'crypto') {
                        socket_return.offers.crypto = {
                            amounts: cryptoService.amounts,
                            fees: cryptoService.fees
                        };
                    }

                }
            }
        }

        //FIRST DATES
        callback({
            success: true,
            data: socket_return
        });

        if(!socket.data.maintenance){
            if(socket.data.paths[0] == 'roulette') dRoulette(socket.data.user, socket);
            if(socket.data.paths[0] == 'crash') dCrash(socket.data.user, socket);
            if(socket.data.paths[0] == 'jackpot') dJackpot(socket.data.user, socket);

            dRain(socket.data.user, socket);

            historyService.getUserHistory(socket.data.user, socket);

            //USERS ONLINE
            emitSocketToAll('site', 'online', {
                online: Object.keys(config.app.chat.channels).reduce((acc, cur) => ({ ...acc, [cur]: Array.from(io.of('/').sockets.values()).filter(a => a.data.channel == cur).filter(a => a.data.user).filter((value, index, self) => self.findIndex(a => a.data.user.userid == value.data.user.userid) == index).length + Array.from(io.of('/').sockets.values()).filter(a => a.data.channel == cur).filter(a => !a.data.user).length }), {})
            });
        }
    };
};