var { pool } = require('@/lib/database.js');
var { loggerInfo, loggerDebug, loggerTrace } = require('@/lib/logger.js');

var chatService = require('@/services/chatService.js');
var userService = require('@/services/userService.js');
var fairService = require('@/services/fairService.js');

var { makeDate, time } = require('@/utils/formatDate.js');
var { roundedToFixed, getFormatAmount, getFormatAmountString, verifyFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');
var { getUserInfo } = require('@/utils/user.js');

var config = require('@/config/config.js');

var lastGames = [];
var last100Games = [];

var lastRoll = {
	roll: 0,
	progress: 0.5
};

var gameSeed = {
	id: null,
	server_seed: null,
	public_seed: null,
	uses: 0
};

var gameSettings = {
	timer: 0
}

var totalBets = [];
var countBets = {};
var amountBets = {};

var gameProperties = {
	status: 'ended',
	id: null,
	roll: null,
	progress: null,
	public_seed: null,
	nonce: null
}

var jackpotProperties = {
	id: null,
	greens: {
		last: 0,
		actual: 0
	},
	bets: [],
	amount: 0
}

function initializeGame(){
	loadHistory();
    loadHundredHistory();
	checkSeed(true);
	checkJackpot();
}

/* ----- INTERNAL USAGE ----- */
function loadHistory(){
	loggerDebug('[ROULETTE] Loading History');

	pool.query('SELECT `roll`, `progress` FROM `roulette_rolls` WHERE `ended` = 1 ORDER BY `id` DESC LIMIT 10', function(err1, row1) {
		if(err1) {
            loggerInfo('[ROULETTE] Error In Loading History');

            return setTimeout(function(){
                loadHistory();
            }, 1000);
        }

		if(row1.length <= 0) return;

		Object.assign(lastRoll, {
			roll: row1[0].roll,
			progress: row1[0].progress
		});

		row1.reverse();

		row1.forEach(function(roll){
			var colors = [];

			if(roll.roll == 0) colors.push('green');
			else if(roll.roll >= 1 && roll.roll <= 7) colors.push('red');
			else if(roll.roll >= 8 && roll.roll <= 14) colors.push('black');

			if(roll.roll == 4 || roll.roll == 11) colors.push('bait');

			lastGames.push({ roll: roll.roll, colors: colors });
		});
	});
}

/* ----- INTERNAL USAGE ----- */
function loadHundredHistory(){
    loggerDebug('[ROULETTE] Loading Hundred History');

	pool.query('SELECT `roll` FROM `roulette_rolls` WHERE `ended` = 1 ORDER BY `id` DESC LIMIT 100', function(err1, row1) {
		if(err1) {
            loggerInfo('[ROULETTE] Error In Loading Hundred History');

            return setTimeout(function(){
                loadHundredHistory();
            }, 1000);
        }

		if(row1.length <= 0) return;

		row1.reverse();

		row1.forEach(function(roll){
			var colors = [];

			if(roll.roll == 0) colors.push('green');
			else if(roll.roll >= 1 && roll.roll <= 7) colors.push('red');
			else if(roll.roll >= 8 && roll.roll <= 14) colors.push('black');

			if(roll.roll == 4 || roll.roll == 11) colors.push('bait');

			last100Games.push({ roll: roll.roll, color: colors.slice(-1)[0] });
		});
	});
}

/* ----- INTERNAL USAGE ----- */
function checkSeed(start){
	pool.query('SELECT `id`, `server_seed`, `public_seed`, `uses` FROM `roulette_seeds` WHERE `removed` = 0 AND `time` > ' + pool.escape(time() - (24 * 60 * 60)) + ' ORDER BY `id` DESC LIMIT 1', function(err1, row1) {
		if(err1) return;

		if(row1.length <= 0) createSeed(start);
		else {
			Object.assign(gameSeed, {
				id: parseInt(row1[0].id),
				server_seed: row1[0].server_seed,
				public_seed: row1[0].public_seed,
				uses: parseInt(row1[0].uses)
			});

			if(start) checkRound();
			else generateRound();
		}
	});
}

/* ----- INTERNAL USAGE ----- */
function createSeed(start){
	loggerInfo('[ROULETTE] Creating New Seed');

	var server_seed = fairService.generateServerSeed();
	var public_seed = fairService.generatePublicSeed();

	pool.query('INSERT INTO `roulette_seeds` SET `server_seed` = ' + pool.escape(server_seed) + ', `public_seed` = ' + pool.escape(public_seed) + ', `time` = ' + pool.escape(time()), function(err1, row1) {
		if(err1) return;

		Object.assign(gameSeed, {
			id: row1.insertId,
			server_seed: server_seed,
			public_seed: public_seed,
			uses: 0
		});

		if(start) checkRound();
		else generateRound();
	});
}

/* ----- INTERNAL USAGE ----- */
function checkRound(){
	loggerDebug('[ROULETTE] Loading Game');

	pool.query('SELECT roulette_rolls.id, roulette_rolls.roll, roulette_rolls.progress, roulette_seeds.public_seed, roulette_rolls.nonce FROM `roulette_rolls` INNER JOIN `roulette_seeds` ON roulette_rolls.seedid = roulette_seeds.id WHERE roulette_rolls.ended = 0 ORDER BY roulette_rolls.id DESC LIMIT 1', function(err1, row1){
		if(err1) return;

		if(row1.length > 0){
			loggerInfo('[ROULETTE] Loaded Last Round');

			Object.assign(gameProperties, {
				status: 'ended',
				id: parseInt(row1[0].id),
				roll: parseInt(row1[0].roll),
				progress: parseFloat(row1[0].progress),
				public_seed: row1[0].public_seed,
				nonce: parseFloat(row1[0].nonce)
			});

			pool.query('SELECT `id`, `userid`, `name`, `avatar`, `xp`, `anonymous`, `amount`, `color` FROM `roulette_bets` WHERE `gameid` = ' + parseInt(gameProperties.id), function(err2, row2){
				if(err2) return;

				row2.forEach(function(item){
					var amount = getFormatAmount(item.amount);

					if(countBets[item.userid] === undefined) countBets[item.userid] = 0;
					countBets[item.userid]++;

					if(amountBets[item.userid] === undefined) {
						amountBets[item.userid] = {
							'red': 0,
							'black': 0,
							'green': 0,
							'bait': 0
						};
					}

					amountBets[item.userid][item.color] += amount;

					totalBets.push({
						id: item.id,
						user: getUserInfo({
							userid: item.userid,
							name: item.name,
							avatar: item.avatar,
							xp: parseInt(item.xp),
							anonymous: parseInt(item.anonymous)
						}),
						amount: amount,
						color: item.color
					});

					loggerTrace('[ROULETTE] Bet registed. ' + item.name + ' did bet $' + getFormatAmountString(amount));
				});
			});

			startGame();
		} else generateRound();
	});
}

/* ----- INTERNAL USAGE ----- */
function generateRound(){
	pool.query('SELECT `id` FROM `roulette_rolls` ORDER BY `id` DESC LIMIT 1', function(err1, row1){
		if(err1) return;

		var seedid = gameSeed.id;

		var server_seed = gameSeed.server_seed;
		var public_seed = gameSeed.public_seed;

		var nonce = 1;
		if(row1.length > 0) nonce = parseInt(row1[0].id) + 1;

		var seed = fairService.getCombinedSeed(server_seed, public_seed, nonce);
		var salt = fairService.generateSaltHash(seed);

		var roll = fairService.getRoll(salt, 15);

		var progress = roundedToFixed(Math.random(), 5);

		pool.query('INSERT INTO `roulette_rolls` SET `roll` = ' + pool.escape(roll) + ', `progress` = ' + pool.escape(progress) + ', `seedid` = ' + pool.escape(seedid) + ', `nonce` = ' + pool.escape(nonce) + ', `time` = ' + pool.escape(time()), function(err2, row2){
			if(err2) return;

			pool.query('UPDATE `roulette_seeds` SET `uses` = `uses` + 1 WHERE `id` = ' + pool.escape(seedid), function(err3){
				if(err3) return;

				gameSeed.uses++;

				gameProperties.id = row2.insertId;
				gameProperties.roll = roll;
				gameProperties.progress = progress;
				gameProperties.public_seed = public_seed;
				gameProperties.nonce = nonce;

				startGame();
			});
		});
	});
}

/* ----- INTERNAL USAGE ----- */
function checkJackpot(){
	loggerDebug('[ROULETTE] Loading Jackpot');

	pool.query('SELECT `id`, `amount` FROM `roulette_jackpot_games` WHERE `ended` = 0', function(err1, row1) {
		if(err1) return;

		if(row1.length <= 0) createJackpot();
		else {
			pool.query('SELECT `id` FROM `roulette_rolls` WHERE `ended` = 1 ORDER BY `id` DESC LIMIT 3', function(err2, row2) {
				if(err2) return;

				var greens = 0;

				for(var roll of row2){
					if(roll.roll == 0) greens++;
					else {
						greens = 0;

						break;
					}
				}

				var ids = row2.map(a => a.id).slice(0, greens).join(',') || 'null';

				pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `anonymous`, `amount` FROM `roulette_bets` WHERE `gameid` IN (' + ids + ')', function(err3, row3){
					if(err3) return;

					var bets = [];

					row3.forEach(function(item){
						bets.push({
							user: getUserInfo({
								userid: item.userid,
								name: item.name,
								avatar: item.avatar,
								xp: parseInt(item.xp),
								anonymous: parseInt(item.anonymous)
							}),
							amount: getFormatAmount(item.amount)
						});
					});

					Object.assign(jackpotProperties, {
						id: row1[0].id,
						greens: {
							last: greens,
							actual: greens
						},
						bets: bets,
						amount: roundedToFixed(row1[0].amount, 5)
					});

					emitSocketToRoom('roulette', 'roulette', 'jackpot', {
						method: 'greens',
						greens: jackpotProperties.greens.last
					});

					emitSocketToRoom('roulette', 'roulette', 'jackpot', {
						method: 'total',
						total: jackpotProperties.amount
					});

					loggerInfo('[ROULETTE] Last Jackpot Loaded');
				});
			});
		}
	});
}

/* ----- INTERNAL USAGE ----- */
function createJackpot(){
	pool.query('INSERT INTO `roulette_jackpot_games` SET `time` = ' + pool.escape(time()), function(err1, row1) {
		if(err1) return;

		Object.assign(jackpotProperties, {
			id: row1.insertId,
			greens: {
				last: 0,
				actual: 0
			},
			bets: [],
			amount: 0
		});

		emitSocketToRoom('roulette', 'roulette', 'jackpot', {
			method: 'greens',
			greens: jackpotProperties.greens.last
		});

		emitSocketToRoom('roulette', 'roulette', 'jackpot', {
			method: 'total',
			total: jackpotProperties.amount
		});

		loggerInfo('[ROULETTE] New Jackpot Created');
	});
}

/* ----- INTERNAL USAGE ----- */
function rollJackpot(){
	loggerInfo('[ROULETTE] Jackpot Rolling');

	var bets = jackpotProperties.bets.slice().sort((a, b) => Math.floor(b.user.level) - Math.floor(a.user.level));
	var amount = getFormatAmount(jackpotProperties.amount);
	var winnings = {};

	while(bets.length > 0){
		var tickets = bets.reduce((acc, cur) => acc + Math.floor(cur.user.level), 0);

		var winning = getFormatAmount(amount * Math.floor(bets[0].user.level) / tickets);

		if(winnings[bets[0].user.userid] === undefined) {
			winnings[bets[0].user.userid] = {
				bets: 0,
				winnings: 0
			};
		}

		winnings[bets[0].user.userid].bets += bets[0].amount;
		winnings[bets[0].user.userid].winnings += winning;

		amount = getFormatAmount(amount - winning);

		bets.shift();
	}

	finishRollJackpot(0, winnings, function(err1){
        if(err1) return;

		pool.query('UPDATE `roulette_jackpot_games` SET `ended` = 1 WHERE `id` = ' + pool.escape(jackpotProperties.id), function(err2) {
			if(err2) return;

			checkJackpot();

			gameProperties.status == 'ended';

			loggerInfo('[ROULETTE] Jackpot Finished. ' + Object.keys(winnings).length + ' winners in total.');
		});
	});
}

/* ----- INTERNAL USAGE ----- */
function finishRollJackpot(index, winnings, callback){
	if(index >= Object.keys(winnings).length) return callback(null);

	var amount = getFormatAmount(winnings[Object.keys(winnings)[index]].winnings);

	//EDIT BALANCE
	userService.editBalance(Object.keys(winnings)[index], amount, 'roulette_jackpot', function(err1, newbalance){
		if(err1) return callback(err1);

		userService.updateBalance(Object.keys(winnings)[index], 'main', newbalance);

		pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `anonymous` FROM `users` WHERE `userid` = ' + pool.escape(Object.keys(winnings)[index]), function(err2, row2) {
			if(err2) return callback(new Error('An error occurred while finishing roll jackpot (1)'));

			if(row2.length <= 0) return callback(new Error('Unknown user!'));

			pool.query('INSERT INTO `roulette_jackpot_winnings` SET `userid` = ' + pool.escape(row2[0].userid) + ', `name` = ' + pool.escape(row2[0].name) + ', `avatar` = ' + pool.escape(row2[0].avatar) + ', `xp` = ' + parseInt(row2[0].xp) + ', `anonymous` = ' + parseInt(row2[0].anonymous) + ', `bets` = ' + winnings[Object.keys(winnings)[index]].bets + ', `amount` = ' + amount + ', `jackpotid` = ' + parseInt(jackpotProperties.id) + ', `time` = ' + pool.escape(time()), function(err3){
				if(err3) return callback(new Error('An error occurred while finishing roll jackpot (2)'));

				finishRollJackpot(index + 1, winnings, callback);
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function placeBet(user, socket, amount, color, cooldown) {
	cooldown(true, true);

	if(countBets[user.userid] !== undefined && countBets[user.userid] >= config.games.games.roulette.total_bets) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You have entered too many times in roulette!'
		});

		return cooldown(false, true);
	}

	if(gameProperties.status != 'started') {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Betting for this round is closed!'
		});

		return cooldown(false, true);
	}

	/* CHECK DATA */

	var allowed_colors = [ 'red', 'black', 'green', 'bait' ];
	if(!allowed_colors.includes(color)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid color [red, green, black or bait]!'
		});

		return cooldown(false, true);
	}

	var dismiss_opposite = { 'red': 'black', 'black': 'red' };
	if(amountBets[user.userid] !== undefined){
		if(amountBets[user.userid][dismiss_opposite[color]] > 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'You can\'t place bets on both colors [red or black]!'
			});

			return cooldown(false, true);
		}
	}

	/* END CHECK DATA */

	//VERIFY FORMAT AMOUNT
	verifyFormatAmount(amount, function(err1, amount){
		if(err1) {
			emitSocketToUser(socket, 'message', 'error', {
				message: err1.message
			});

			return cooldown(false, true);
		}

        if(amount < config.app.intervals.amounts['roulette'].min || amount > config.app.intervals.amounts['roulette'].max) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid bet amount [' + getFormatAmountString(config.app.intervals.amounts['roulette'].min) + '-' + getFormatAmountString(config.app.intervals.amounts['roulette'].max) + ']'
            });

            return cooldown(false, true);
        }

        //CHECK BALANCE
        userService.getBalance(user.userid, function(err2, balance){
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: err2.message
                });

                return cooldown(false, true);
            }

            if(balance < amount) {
                emitSocketToRoom(user.userid, 'modal', 'insufficient_balance', {
                    amount: getFormatAmount(amount - balance)
                });

                emitSocketToUser(socket, 'message', 'error', {
                    message: 'You don\'t have enough money'
                });

                return cooldown(false, true);
            }

            //REGISTER BET
            userService.registerOriginalBet(user.userid, amount, [], 'roulette', function(err3, newbalance){
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: err3.message
                    });

                    return cooldown(false, true);
                }

                pool.query('INSERT INTO `roulette_bets` SET `userid` = ' + pool.escape(user.userid) + ', `name` = ' + pool.escape(user.name) + ', `avatar` = ' + pool.escape(user.avatar) + ', `xp` = ' + parseInt(user.xp) + ', `anonymous` = ' + parseInt(user.anonymous) + ', `amount` = ' + amount + ', `color` = ' + pool.escape(color) + ', `gameid` = ' + parseInt(gameProperties.id) + ', `time` = ' + pool.escape(time()), function(err4, row4) {
                    if(err4) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while placing bet (1)'
                        });

                        return cooldown(false, true);
                    }

                    var amount_jackpot = roundedToFixed(amount * config.games.games.roulette.jackpot_commission / 100, 5);

                    pool.query('UPDATE `roulette_jackpot_games` SET `amount` = `amount` + ' + amount_jackpot + ' WHERE `id` = ' + pool.escape(jackpotProperties.id), function(err5) {
                        if(err5) {
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while placing bet (2)'
                            });

                            return cooldown(false, true);
                        }

                        pool.query('INSERT INTO `roulette_jackpot_bets` SET `userid` = ' + pool.escape(user.userid) + ', `amount` = ' + amount_jackpot + ', `jackpotid` = ' + parseInt(jackpotProperties.id) + ', `time` = ' + pool.escape(time()), function(err6) {
                            if(err6) {
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: 'An error occurred while placing bet (3)'
                                });

                                return cooldown(false, true);
                            }

                            jackpotProperties.amount += amount_jackpot;

                            emitSocketToRoom('roulette', 'roulette', 'jackpot', {
                                method: 'total',
                                total: jackpotProperties.amount
                            });

                            if(countBets[user.userid] === undefined) countBets[user.userid] = 0;
                            countBets[user.userid]++;

                            if(amountBets[user.userid] === undefined) {
                                amountBets[user.userid] = {
                                    'red': 0,
                                    'black': 0,
                                    'green': 0,
                                    'bait': 0
                                };
                            }

                            amountBets[user.userid][color] += amount;

                            totalBets.push({
                                id: row4.insertId,
                                user: getUserInfo({
									userid: user.userid,
									name: user.name,
									avatar: user.avatar,
									xp: user.xp,
									anonymous: user.anonymous
								}),
                                amount: amount,
                                color: color
                            });

                            emitSocketToUser(socket, 'roulette', 'bet_confirmed');

                            emitSocketToRoom('roulette', 'roulette', 'bet', {
                                bet: {
                                    id: row4.insertId,
                                    user: getUserInfo({
										userid: user.userid,
										name: user.name,
										avatar: user.avatar,
										xp: user.xp,
										anonymous: user.anonymous
									}),
                                    amount: amount,
                                    color: color
                                }
                            });

                            emitSocketToRoom('roulette', 'roulette', 'total', {
                                color: color,
                                total: {
                                    amount: totalBets.filter(a => a.color == color).reduce((acc, cur) => getFormatAmount(acc + cur.amount), 0),
                                    count: totalBets.filter(a => a.color == color).length
                                }
                            });

                            userService.updateBalance(user.userid, 'main', newbalance);

                            loggerTrace('[ROULETTE] Bet registed. ' + user.name + ' did bet $' + getFormatAmountString(amount));

                            cooldown(false, false);
                        });
                    });
                });
            });
        });
	});
}

/* ----- CLIENT USAGE ----- */
function getJackpotHistory(user, socket, cooldown){
	cooldown(true, true);

	pool.query('SELECT roulette_jackpot_games.id, roulette_jackpot_games.amount, COALESCE(COUNT(roulette_jackpot_winnings.id), 0) AS `winners`, roulette_jackpot_games.time FROM `roulette_jackpot_games` LEFT JOIN `roulette_jackpot_winnings` ON roulette_jackpot_games.id = roulette_jackpot_winnings.jackpotid WHERE roulette_jackpot_games.ended = 1 GROUP BY roulette_jackpot_games.id ORDER BY roulette_jackpot_games.id DESC LIMIT 10', function(err1, row1) {
		if(err1) {
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting jackpot history (1)'
            });

			return cooldown(false, true);
		}

		var list = [];

		row1.forEach(function(item){
			list.push({
				id: item.id,
				amount: getFormatAmountString(item.amount),
				winners: parseInt(item.winners),
				time: makeDate(new Date(item.time * 1000))
			});
		});

		emitSocketToUser(socket, 'roulette', 'jackpot', {
			method: 'history',
			history: list
		});

		cooldown(false, false);
	});
}

/* ----- CLIENT USAGE ----- */
function getJackpotWinners(user, socket, id, cooldown){
	cooldown(true, true);

	pool.query('SELECT `id` FROM `roulette_jackpot_games` WHERE `id` = ' + pool.escape(id) + ' AND `ended` = 1', function(err1, row1) {
		if(err1) {
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting jackpot winnings (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid roulette jackpot id!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id`, `userid`, `name`, `avatar`, `xp`, `anonymous`, `bets`, `amount` FROM `roulette_jackpot_winnings` WHERE `jackpotid` = ' + pool.escape(id), function(err2, row2) {
			if(err2) {
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting jackpot winnings (2)'
                });

				return cooldown(false, true);
			}

			var list = [];

			row2.forEach(function(item){
				list.push({
					id: item.id,
					user: getUserInfo({
						userid: item.userid,
						name: item.name,
						avatar: item.avatar,
						xp: parseInt(item.xp),
						anonymous: parseInt(item.anonymous)
					}),
					bets: getFormatAmountString(item.bets),
					winnings: getFormatAmountString(item.amount)
				});
			});

			emitSocketToUser(socket, 'roulette', 'jackpot', {
				method: 'winners',
				winners: list
			});

			cooldown(false, false);
		});
	});
}

/* ----- INTERNAL USAGE ----- */
function startGame() {
	loggerInfo('[ROULETTE] New Round. Public Seed: ' + gameProperties.public_seed + ', Nonce: ' + gameProperties.nonce);

	gameProperties.status = 'started';

	emitSocketToRoom('roulette', 'roulette', 'fair', {
		id: gameProperties.id,
		public_seed: gameProperties.public_seed
	});

	if(gameSettings.timer == 0) {
		loggerInfo('[ROULETTE] Starting');

		gameSettings.timer = config.games.games.roulette.timer + config.games.games.roulette.cooldown_rolling;

		emitSocketToRoom('roulette', 'roulette', 'timer', {
			time: gameSettings.timer - config.games.games.roulette.cooldown_rolling,
			cooldown: config.games.games.roulette.timer
		});

		var interval = setInterval(function() {
			if(gameSettings.timer == config.games.games.roulette.cooldown_rolling) {
				loggerInfo('[ROULETTE] Rolling');

				gameProperties.status = 'rolling';

				rollingGame();
			}

			if(gameSettings.timer == 0 && gameProperties.status == 'jackpot') {
				jackpotProperties.greens.last = jackpotProperties.greens.actual;

				if(jackpotProperties.greens.actual >= 3) rollJackpot();
				else gameProperties.status = 'ended';
			}

			if(gameSettings.timer == 0 && gameProperties.status == 'ended') {
				clearInterval(interval);

				loggerInfo('[ROULETTE] Ended. Rolled: ' + gameProperties.roll);

				pool.query('UPDATE `roulette_rolls` SET `ended` = 1 WHERE `id` = ' + parseInt(gameProperties.id), function(err1){
					if(err1) return;

					var colors = [];

					if(gameProperties.roll == 0) colors.push('green');
					else if(gameProperties.roll >= 1 && gameProperties.roll <= 7) colors.push('red');
					else if(gameProperties.roll >= 8 && gameProperties.roll <= 14) colors.push('black');

					if(gameProperties.roll == 4 || gameProperties.roll == 11) colors.push('bait');

					lastGames.push({ roll: gameProperties.roll, colors: colors });
					last100Games.push({ roll: gameProperties.roll, color: colors.slice(-1)[0] });

					while(lastGames.length > 10) lastGames.shift();
					while(last100Games.length > 100) last100Games.shift();

					Object.assign(lastRoll, {
						roll: gameProperties.roll,
						progress: gameProperties.progress
					});

					totalBets.splice(0);
					countBets = {};
					amountBets = {};

                    emitSocketToRoom('roulette', 'roulette', 'hundred', {
                        red: last100Games.filter(a => a.color == 'red').length,
                        green: last100Games.filter(a => a.color == 'green').length,
                        black: last100Games.filter(a => a.color == 'black').length,
                        bait: last100Games.filter(a => a.color == 'bait').length
                    });

					checkSeed(false);
				});
			}

			if(gameSettings.timer > 0) gameSettings.timer--;
		}, 1000);
	}
}

/* ----- INTERNAL USAGE ----- */
function rollingGame() {
	var colors = [];

	if(gameProperties.roll == 0) colors.push('green');
	else if(gameProperties.roll >= 1 && gameProperties.roll <= 7) colors.push('red');
	else if(gameProperties.roll >= 8 && gameProperties.roll <= 14) colors.push('black');

	if(gameProperties.roll == 4 || gameProperties.roll == 11) colors.push('bait');

	if(gameProperties.roll == 0) {
		jackpotProperties.greens.actual++;

		jackpotProperties.bets.push(...(totalBets.map(a => ({ user: a.user, amount: a.amount }))));
	} else {
		jackpotProperties.greens.actual = 0;

		jackpotProperties.bets.splice(0);
	}

	emitSocketToRoom('roulette', 'roulette', 'roll', {
		roll: {
			id: gameProperties.id,
			roll: gameProperties.roll,
			colors: colors,
			progress: gameProperties.progress
		},
		greens: jackpotProperties.greens.actual,
		cooldown: 0
	});

	var total_winnings = {};
	var winnings = [];

	totalBets.forEach(function(item) {
		if(colors.includes(item.color)) {
			var multiplier = 0;

			if(item.color == 'green') multiplier = config.games.games.roulette.multipliers.green;
			else if(item.color == 'red') multiplier = config.games.games.roulette.multipliers.red;
			else if(item.color == 'black') multiplier = config.games.games.roulette.multipliers.black;
			else if(item.color == 'bait') multiplier = config.games.games.roulette.multipliers.bait;

			var winning = getFormatAmount(item.amount * multiplier);

			winnings.push({
				id: item.id,
				user: item.user,
				amount: item.amount,
				winning: winning,
				multiplier: multiplier
			});

			if(total_winnings[item.user.userid] === undefined) total_winnings[item.user.userid] = {
				user: item.user,
				winning: 0,
				color: item.color
			};

			total_winnings[item.user.userid]['winning'] += winning;
		} else {
			winnings.push({
				id: item.id,
				user: item.user,
				amount: item.amount,
				winning: 0,
				multiplier: 0
			});
		}
	});

	giveWinnings(0, winnings, {}, function(err1, bets){
		if(err1) return;

		setTimeout(function(){
			winnings.forEach(function(item){
				if(item.winning > 0) loggerTrace('[ROULETTE] Win registed. ' + item.user.userid + ' did win $' + getFormatAmountString(item.winning) + ' with multiplier x' + item.multiplier);
			});

            Object.keys(bets).forEach(function(item){
                userService.updateLevel(item, bets[item].xp);
                userService.updateBalance(item, 'main', bets[item].balance);
            });

			Object.keys(total_winnings).forEach(function(item){
				if(total_winnings[item].winning >= config.games.winning_to_chat){
					var send_message = total_winnings[item].user.name + ' won ' + getFormatAmountString(total_winnings[item].winning) + ' to roulette on ' + total_winnings[item].color + '!';
					chatService.writeSystemMessage(send_message, 'all', true, null);
				}
			});

			gameProperties.status = 'jackpot';
		}, gameSettings.timer * 1000);
	});
}

/* ----- INTERNAL USAGE ----- */
function giveWinnings(index, winnings, bets, callback) {
	if(index >= winnings.length) return callback(null, bets);

	//FINISH BET
	userService.finishOriginalBet(winnings[index].user.userid, winnings[index].amount, winnings[index].winning, winnings[index].winning, [], 'roulette', 'Roulette', {
		active: true,
		visible: winnings[index].winning > 0,
		betid: winnings[index].id,
		countdown: gameSettings.timer * 1000
	}, function(err1, newxp, newbalance){
		if(err1) return callback(err1);

        if(bets[winnings[index].user.userid] === undefined){
            bets[winnings[index].user.userid] = {
                balance: newbalance,
                xp: newxp
            };
        } else {
            bets[winnings[index].user.userid].balance = newbalance;
            bets[winnings[index].user.userid].xp = newxp;
        }

		giveWinnings(index + 1, winnings, bets, callback);
	});
}

module.exports = {
	lastGames, last100Games, lastRoll, gameSettings, totalBets, gameProperties, jackpotProperties,
	initializeGame, placeBet, getJackpotHistory, getJackpotWinners
};