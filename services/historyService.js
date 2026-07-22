var { pool } = require('@/lib/database.js');
var { loggerInfo } = require('@/lib/logger.js');

var { roundedToFixed, getFormatAmount } = require('@/utils/formatAmount.js');
var { time } = require('@/utils/formatDate.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');
var { getUserInfo } = require('@/utils/user.js');

var config = require('@/config/config.js');

var histories = {
	'all_bets': [],
	'big_bets': [],
	'game_bets': {}
};

var rooms = {};

function initializeHistory(){
	loadAllBets();
    loadBigBets();
    loadGameBets();
}

/* ----- INTERNAL USAGE ----- */
function loadAllBets(){
    loggerInfo('[HISTORY] Loading All Bets History');

    pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `anonymous`, `category`, `gameid`, `game`, `amount`, `multiplier`, `winning`, `time` FROM `games_history` WHERE `visible` = 1 ORDER BY `id` DESC LIMIT 10', function(err1, row1) {
		if(err1) {
            loggerInfo('[HISTORY] Error In Loading All Bets History');

            return setTimeout(function(){
                loadAllBets();
            }, 1000);
        }

		row1.reverse();

		row1.forEach(function(item){
			var history = {
				user: getUserInfo({
					userid: item.userid,
					name: item.name,
					avatar: item.avatar,
					xp: parseInt(item.xp),
					anonymous: parseInt(item.anonymous)
				}),
				category: item.category,
				game: {
					id: item.gameid,
					name: item.game
				},
				amount: getFormatAmount(item.amount),
				multiplier: roundedToFixed(item.multiplier, 2),
				winning: getFormatAmount(item.winning),
				time: parseInt(item.time)
			}

			histories['all_bets'].push(history);
		});
    });
}

/* ----- INTERNAL USAGE ----- */
function loadBigBets(){
    loggerInfo('[HISTORY] Loading Big Bets History');

    pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `anonymous`, `category`, `gameid`, `game`, `amount`, `multiplier`, `winning`, `time` FROM `games_history` WHERE `visible` = 1 AND `winning` >= ' + config.games.history.big_bets + ' ORDER BY `id` DESC LIMIT 10', function(err1, row1) {
        if(err1) {
            loggerInfo('[HISTORY] Error In Loading Big Bets History');

            return setTimeout(function(){
                loadBigBets();
            }, 1000);
        }

        row1.reverse();

        row1.forEach(function(item){
            var history = {
				user: getUserInfo({
					userid: item.userid,
					name: item.name,
					avatar: item.avatar,
					xp: parseInt(item.xp),
					anonymous: parseInt(item.anonymous)
				}),
				category: item.category,
				game: {
					id: item.gameid,
					name: item.game
				},
                amount: getFormatAmount(item.amount),
                multiplier: roundedToFixed(item.multiplier, 2),
                winning: getFormatAmount(item.winning),
                time: parseInt(item.time)
            }

            histories['big_bets'].push(history);
        });
    });
}

/* ----- INTERNAL USAGE ----- */
function loadGameBets(){
    loggerInfo('[HISTORY] Loading Game Bets History');

    pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `anonymous`, `category`, `gameid`, `game`, `amount`, `multiplier`, `winning`, `time` FROM `games_history` AS `main` WHERE (SELECT COUNT(*) FROM `games_history` AS `sub` WHERE sub.visible = 1 AND sub.game = main.game AND sub.id >= main.id) <= 10 AND `visible` = 1 ORDER BY `id` DESC', function(err1, row1) {
        if(err1) {
            loggerInfo('[HISTORY] Error In Loading Game Bets History');

            return setTimeout(function(){
                loadGameBets();
            }, 1000);
        }

        row1.reverse();

        row1.forEach(function(item){
            var history = {
				user: getUserInfo({
					userid: item.userid,
					name: item.name,
					avatar: item.avatar,
					xp: parseInt(item.xp),
					anonymous: parseInt(item.anonymous)
				}),
				category: item.category,
				game: {
					id: item.gameid,
					name: item.game
				},
                amount: getFormatAmount(item.amount),
                multiplier: roundedToFixed(item.multiplier, 2),
                winning: getFormatAmount(item.winning),
                time: parseInt(item.time)
            }

			var page = {
				'casino': item.category,
				'original': item.gameid
			}[item.category];

            if(histories['game_bets'][page] === undefined) histories['game_bets'][page] = [];
            histories['game_bets'][page].push(history);
        });
    });
}

function registerHistory(userid, category, gameid, game, betid, amount, winning, multiplier, visible, countdown, callback){
	pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `anonymous` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while registering history (1)'));

		if(row1.length <= 0) return callback(new Error('Unknown user!'));

		var time_history = time();

		pool.query('INSERT INTO `games_history` SET `visible` = ' + (visible ? 1 : 0) + ', `userid` = ' + pool.escape(row1[0].userid) + ', `name` = ' + pool.escape(row1[0].name) + ', `avatar` = ' + pool.escape(row1[0].avatar) + ', `xp` = ' + parseInt(row1[0].xp) + ', `anonymous` = ' + parseInt(row1[0].anonymous) + ', `category` = ' + pool.escape(category) + ', `gameid` = ' + pool.escape(gameid) + ', `game` = ' + pool.escape(game) + ', `amount` = ' + amount + ', `winning` = ' + winning + ', `multiplier` = ' + multiplier + ', `betid` = ' + parseInt(betid) + ', `time` = ' + pool.escape(time_history), function(err2){
			if(err2) return callback(new Error('An error occurred while registering history (2)'));

			var history = {
				user: getUserInfo({
					userid: row1[0].userid,
					name: row1[0].name,
					avatar: row1[0].avatar,
					xp: parseInt(row1[0].xp),
					anonymous: parseInt(row1[0].anonymous)
				}),
				category: category,
				game: {
					id: gameid,
					name: game
				},
				amount: amount,
				multiplier: multiplier,
				winning: winning,
				time: time_history
			};

			setTimeout(function(){
				var page = {
					'casino': category,
					'original': gameid
				}[category];

				emitSocketToRoom('history_my_bets_' + page, 'history', 'history', {
					history: {
						type: 'my_bets',
						page, history
					}
				});

				emitSocketToRoom('history_my_bets', 'history', 'history', {
					history: {
						type: 'my_bets',
						page, history
					}
				});
			}, countdown);

			if(!visible) return callback(null);

			Object.keys(histories).forEach(function(type){
				if(type != 'big_bets' || winning >= config.games.history.big_bets){
					setTimeout(function(){
						var page = {
							'casino': category,
							'original': gameid
						}[category];

						if(type == 'game_bets'){
							if(histories[type][page] === undefined) histories[type][page] = [];

							histories[type][page].push(history);
							if(histories[type][page].length > 10) histories[type][page].shift();
						} else {
							histories[type].push(history);
							if(histories[type].length > 10) histories[type].shift();
						}

						emitSocketToRoom('history_' + type, 'history', 'history', {
							history: {
								type, page, history
							}
						});

						if([ 'game_bets' ].includes(type)) {
							emitSocketToRoom('history_' + type + '_' + page, 'history', 'history', {
								history: {
									type, page, history
								}
							});
						}
					}, countdown);
				}
			});

			callback(null);
		});
	});
}

function getHistory(user, socket, history, cooldown){
	cooldown(true, true);

	var allowed_histories = [ 'all_bets', 'big_bets', 'game_bets', 'my_bets' ];
	if(!allowed_histories.includes(history)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid history type!'
		});

		return cooldown(false, true);
	}

    //[ 'home' ]
	if(![ ...Object.keys(config.settings.games.games.original), ...Object.keys(config.settings.games.games.classic), ...[ '' ] ].includes(socket.data.paths[0])){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid history page!'
		});

		return cooldown(false, true);
	}

    //[ 'home' ]
	// leave history room
	if(rooms[user ? user.userid : socket.id] !== undefined) {
		if(![ '' ].includes(socket.data.paths[0]) && [ 'game_bets', 'my_bets' ].includes(rooms[user ? user.userid : socket.id])) socket.leave('history_' + rooms[user ? user.userid : socket.id] + '_' + socket.data.paths[0]);
		else socket.leave('history_' + rooms[user ? user.userid : socket.id]);
	}

	//[ 'home' ]
	if([ '' ].includes(socket.data.paths[0]) && [ 'game_bets' ].includes(history)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid history page!'
		});

		return cooldown(false, true);
	}

	//[ 'home' ]
	// join history room
	if(![ '' ].includes(socket.data.paths[0]) && [ 'game_bets', 'my_bets' ].includes(history)) socket.join('history_' + history + '_' + socket.data.paths[0]);
	else socket.join('history_' + history);

	socket.data.history = history;

	rooms[user ? user.userid : socket.id] = history;

	loadHistory(user, history, socket.data.paths[0], [ '' ].includes(socket.data.paths[0]), function(err1, list){
		if(err1) {
			emitSocketToUser(socket, 'message', 'error', {
                message: err1.message
            });

			return cooldown(false, true);
		}

		emitSocketToUser(socket, 'history', 'list', {
			list: list
		});

		cooldown(false, false);
	});
}

function getUserHistory(user, socket){
	var allowed_histories = [ 'all_bets', 'big_bets', 'game_bets', 'my_bets' ];
	if(!allowed_histories.includes(socket.data.history)) return;

    //[ 'home' ]
	if(![ ...Object.keys(config.settings.games.games.original), ...Object.keys(config.settings.games.games.classic), ...[ '' ] ].includes(socket.data.paths[0])) return;

	//[ 'home' ]
	if([ '' ].includes(socket.data.paths[0]) && [ 'game_bets' ].includes(socket.data.history)) return;

    //[ 'home' ]
	// join history room
	if(![ '' ].includes(socket.data.paths[0]) && [ 'game_bets', 'my_bets' ].includes(socket.data.history)) socket.join('history_' + socket.data.history + '_' + socket.data.paths[0]);
	else socket.join('history_' + socket.data.history);

	rooms[user ? user.userid : socket.id] = socket.data.history;

	loadHistory(user, socket.data.history, socket.data.paths[0], [ '' ].includes(socket.data.paths[0]), function(err1, list){
		if(err1) {
            return emitSocketToUser(socket, 'message', 'error', {
                message: err1.message
            });
        }

		emitSocketToUser(socket, 'history', 'list', {
			list: list
		});
	});
}

/* ----- INTERNAL USAGE ----- */
function loadHistory(user, history, game, all_games, callback){
	var activityService = require('@/services/activityService.js');

	if(history == 'game_bets') {
		if(all_games) {
			var combined = Object.keys(histories[history]).map(a => histories[history][a]).reduce((acc, arr) => { return [ ...acc, ...arr ] }, []).sort(function(a, b){ return b.time - a.time }).slice(0, 10).reverse();
			return callback(null, activityService.mergeWithFakeBets(combined, 'all_bets'));
		}

		var pageList = histories[history][game] !== undefined ? histories[history][game] : [];
		return callback(null, activityService.mergeWithFakeBets(pageList, game === 'casino' ? 'all_bets' : history));
	} else if(history == 'my_bets') {
		var query = '';
		if(!all_games) {
			if(game == 'casino') query = ' AND `category` = ' + pool.escape(game);
			else
			query = ' AND `game` = ' + pool.escape(game);
		}

		if(!user) return callback(null, []);

		pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `anonymous`, `category`, `gameid`, `game`, `amount`, `multiplier`, `winning`, `time` FROM `games_history` WHERE `userid` = ' + pool.escape(user.userid) + '' + query + ' ORDER BY `id` DESC LIMIT 10', function(err1, row1) {
			if(err1) return callback(new Error('An error occurred while loading history (1)'));

			var list = [];

			row1.reverse();

			row1.forEach(function(item){
				var history = {
					user: getUserInfo({
						userid: item.userid,
						name: item.name,
						avatar: item.avatar,
						xp: parseInt(item.xp),
						anonymous: parseInt(item.anonymous)
					}),
					category: item.category,
					game: {
						id: item.gameid,
						name: item.game
					},
					amount: getFormatAmount(item.amount),
					multiplier: roundedToFixed(item.multiplier, 2),
					winning: getFormatAmount(item.winning)
				}

				list.push(history);
			});

			return callback(null, list);
		});
	} else {
		var activityService = require('@/services/activityService.js');
		return callback(null, activityService.mergeWithFakeBets(histories[history], history));
	}
}

module.exports = {
	rooms,
	initializeHistory, registerHistory, getHistory, getUserHistory
};