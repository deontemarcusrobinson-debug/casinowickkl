var sha256 = require('sha256');

var { pool } = require('@/lib/database.js');
var { loggerDebug, loggerTrace } = require('@/lib/logger.js');

var chatService = require('@/services/chatService.js');
var userService = require('@/services/userService.js');
var fairService = require('@/services/fairService.js');

var { time } = require('@/utils/formatDate.js');
var { roundedToFixed, getFormatAmount, getFormatAmountString, verifyFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');
var { getUserInfo } = require('@/utils/user.js');
var { getRandomInt, getAmountCommission } = require('@/utils/utils.js');

var config = require('@/config/config.js');

var lastGames = [];

var gameSettings = {
	last_ticket: 0,
	start_time: 0,
	avatars_rolling: []
}

var totalBets = [];
var userBets = {};

var gameProperties = {
	status: 'wait',
	id: null,
	server_seed: null,
	public_seed: null,
	block: null,
	roll: null
}

var gameColors = [];
var gameAvatars = [];

function initializeGame(){
	loadHistory();
	checkGames();
}

/* ----- INTERNAL USAGE ----- */
function loadHistory(){
	loggerDebug('[JACKPOT] Loading History');

	pool.query('SELECT jackpot_games.id, jackpot_games.server_seed, jackpot_rolls.public_seed, jackpot_rolls.blockid, jackpot_rolls.betid, jackpot_rolls.chance, jackpot_rolls.amount FROM `jackpot_games` INNER JOIN `jackpot_rolls` ON jackpot_games.id = jackpot_rolls.gameid WHERE jackpot_games.ended = 1 AND jackpot_rolls.removed = 0 ORDER BY jackpot_rolls.id DESC LIMIT 5', function(err1, row1) {
		if(err1) return;

		if(row1.length == 0) return;

		row1.reverse();

		row1.forEach(function(history){
			pool.query('SELECT `id`, `userid`, `name`, `avatar`, `xp`, `anonymous`, `amount`, `color`, `ticketmin`, `ticketmax` FROM `jackpot_bets` WHERE `gameid` = ' + parseInt(history.id), function(err2, row2){
				if(err2) return;

				var bets = [];

				row2.forEach(function(item){
					bets.push({
						id: item.id,
						user: getUserInfo({
							userid: item.userid,
							name: item.name,
							avatar: item.avatar,
							xp: parseInt(item.xp),
							anonymous: parseInt(item.anonymous)
						}),
						amount: getFormatAmount(item.amount),
						color: item.color,
						tickets: {
							min: parseInt(item.ticketmin),
							max: parseInt(item.ticketmax)
						}
					});
				});

				lastGames.push({
					id: history.id,
					bets: bets,
					winner: bets.findIndex(a => a.id == history.betid),
					chance: roundedToFixed(history.chance, 2),
					amount: getFormatAmount(history.amount),
					fair: {
						server_seed_hashed: sha256(history.server_seed),
						server_seed: history.server_seed,
						public_seed: history.public_seed,
						block: history.blockid,
						nonce: history.id
					}
				});
			});
		});
	});
};

/* ----- INTERNAL USAGE ----- */
function checkGames(){
	loggerDebug('[JACKPOT] Loading Games');

	pool.query('SELECT `id`, `server_seed` FROM `jackpot_games` WHERE `ended` = 0 ORDER BY `id` DESC LIMIT 1', function(err1, row1){
		if(err1) return;

		if(row1.length > 0){
			Object.assign(gameProperties, {
				status: 'wait',
				id: row1[0].id,
				server_seed: row1[0].server_seed,
				public_seed: null,
				block: null,
				roll: null
			});

			emitSocketToRoom('jackpot', 'jackpot', 'fair', {
				fair: {
					server_seed_hashed: sha256(gameProperties.server_seed),
					nonce: gameProperties.id
				}
			});

			pool.query('SELECT `id`, `userid`, `name`, `avatar`, `xp`, `anonymous`, `amount`, `color` FROM `jackpot_bets` WHERE `gameid` = ' + parseInt(gameProperties.id), function(err2, row2){
				if(err2) return;

				row2.forEach(function(item){
					var amount = getFormatAmount(item.amount);

					var user_color = item.color;

					if(!gameColors.includes(user_color)) gameColors.push(user_color);

					var min_ticket = gameSettings.last_ticket + 1;
					var max_ticket = Math.floor(amount * 100) + gameSettings.last_ticket;

					if(userBets[item.userid] === undefined){
						userBets[item.userid] = {
							total: 0,
							amount: 0,
							color: user_color
						};
					}

					userBets[item.userid].total++;
					userBets[item.userid].amount += amount;

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
						color: user_color,
						tickets: {
							min: min_ticket,
							max: max_ticket
						}
					});

					if(totalBets.length > 0){
						var totalamounts = getFormatAmount(totalBets.reduce((acc, cur) => acc + cur.amount, 0));

						totalBets.forEach(function(item){
							var chance = roundedToFixed(userBets[item.user.userid].amount / totalamounts * 100, 2);

							emitSocketToRoom(item.user.userid, 'jackpot', 'chance', {
								chance: chance
							});
						});
					}

					gameSettings.last_ticket += Math.floor(amount * 100);
					checkGame();

					gameAvatars.splice(0, gameAvatars.length, ...generateAvatars(25));

					loggerTrace('[JACKPOT] Bet registed. ' + item.name + ' did bet $' + getFormatAmountString(amount));
				});
			});
		} else generateGame();
	});
}

/* ----- INTERNAL USAGE ----- */
function generateGame(){
	var server_seed = fairService.generateServerSeed();

	pool.query('INSERT INTO `jackpot_games` SET `server_seed` = ' + pool.escape(server_seed) + ', `time` = ' + pool.escape(time()), function(err1, row1){
		if(err1) return;

		gameProperties.id = row1.insertId;
		gameProperties.server_seed = server_seed;

		gameProperties.status = 'wait';

		emitSocketToRoom('jackpot', 'jackpot', 'fair', {
			fair: {
				server_seed_hashed: sha256(gameProperties.server_seed),
				nonce: gameProperties.id
			}
		});
	});
}

/* ----- CLIENT USAGE ----- */
function placeBet(user, socket, amount, cooldown){
	cooldown(true, true);

	if(gameProperties.status != 'started' && gameProperties.status != 'wait') {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Wait for preparing a new round!'
		});

		return cooldown(false, true);
	}

	if(userBets[user.userid] !== undefined && userBets[user.userid].total >= config.games.games.jackpot.total_bets) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You have entered too many times in jackpot'
		});

		return cooldown(false, true);
	}

	//VERIFY FORMAT AMOUNT
	verifyFormatAmount(amount, function(err1, amount){
		if(err1) {
			emitSocketToUser(socket, 'message', 'error', {
				message: err1.message
			});

			return cooldown(false, true);
		}

        if(amount < config.app.intervals.amounts['jackpot'].min || amount > config.app.intervals.amounts['jackpot'].max) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid bet amount [' + getFormatAmountString(config.app.intervals.amounts['jackpot'].min) + '-' + getFormatAmountString(config.app.intervals.amounts['jackpot'].max) + ']'
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
            userService.registerOriginalBet(user.userid, amount, [], 'jackpot', function(err3, newbalance){
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: err3.message
                    });

                    return cooldown(false, true);
                }

                var user_color = generateColor(user.userid);

                var ticketmin = gameSettings.last_ticket + 1;
                var ticketmax = Math.floor(amount * 100) + gameSettings.last_ticket;

                pool.query('INSERT INTO `jackpot_bets` SET `userid` = ' + pool.escape(user.userid) + ', `name` = ' + pool.escape(user.name) + ', `avatar` = ' + pool.escape(user.avatar) + ', `xp` = ' + parseInt(user.xp) + ', `anonymous` = ' + parseInt(user.anonymous) + ', `amount` = ' + amount + ', `color` = ' + pool.escape(user_color) + ', `ticketmin` = ' + pool.escape(ticketmin) + ', `ticketmax` = ' + pool.escape(ticketmax) + ', `gameid` = ' + parseInt(gameProperties.id) + ', `time` = ' + pool.escape(time()), function(err4, row4) {
                    if(err4) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while placing bet (1)'
                        });

                        return cooldown(false, true);
                    }

                    if(userBets[user.userid] === undefined){
                        userBets[user.userid] = {
                            total: 0,
                            amount: 0,
                            color: user_color
                        };
                    }

                    userBets[user.userid].total++;
                    userBets[user.userid].amount += amount;

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
                        color: user_color,
                        tickets: {
                            min: ticketmin,
                            max: ticketmax
                        }
                    });

                    if(totalBets.length > 0){
                        var totalamounts = getFormatAmount(totalBets.reduce((acc, cur) => acc + cur.amount, 0));

                        totalBets.forEach(function(item){
                            var chance = roundedToFixed(userBets[item.user.userid].amount / totalamounts * 100, 2);

                            emitSocketToRoom(item.user.userid, 'jackpot', 'chance', {
                                chance: chance
                            });
                        });
                    }

                    emitSocketToUser(socket, 'jackpot', 'bet_confirmed');

                    emitSocketToRoom('jackpot', 'jackpot', 'bet', {
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
                            color: user_color,
                            tickets: {
                                min: ticketmin,
                                max: ticketmax
                            }
                        },
                        total: getFormatAmount(totalBets.reduce((acc, cur) => acc + cur.amount, 0))
                    });

                    gameSettings.last_ticket += Math.floor(amount * 100);
                    checkGame();

                    gameAvatars.splice(0, gameAvatars.length, ...generateAvatars(25));

                    emitSocketToRoom('jackpot', 'jackpot', 'avatars', {
                        avatars: gameAvatars
                    });

                    userService.updateBalance(user.userid, 'main', newbalance);

                    loggerTrace('[JACKPOT] Bet registed. ' + user.name + ' did bet $' + getFormatAmountString(amount));

                    cooldown(false, false);
                });
            });
        });
	});
}

/* ----- INTERNAL USAGE ----- */
function checkGame(){
	if(totalBets.length < config.games.games.jackpot.bets_start || Object.keys(userBets).length < config.games.games.jackpot.users_start) return;

	if(gameProperties.status == 'wait'){
		gameProperties.status = 'started';

		var timer = config.games.games.jackpot.timer;

		var timerID = setInterval(function(){
			if(timer >= 0){
				emitSocketToRoom('jackpot', 'jackpot', 'timer', {
					time: timer,
					total: config.games.games.jackpot.timer
				});

				timer--;
			} else {
				clearInterval(timerID);

				pickingGame();
			}
		}, 1000);
	}
}

/* ----- INTERNAL USAGE ----- */
function pickingGame(){
	gameProperties.status = 'picking';

	emitSocketToRoom('jackpot', 'jackpot', 'picking', {});

	fairService.generateEosSeed(function(data){
		gameProperties.status = 'eos';

		gameProperties.block = data.block;

		emitSocketToRoom('jackpot', 'jackpot', 'fair', {
			fair: {
				server_seed_hashed: sha256(gameProperties.server_seed),
				block: gameProperties.block,
				nonce: gameProperties.id
			}
		});
	}, function(data){
		pool.query('UPDATE `jackpot_rolls` SET `removed` = 1 WHERE `gameid` = ' + pool.escape(gameProperties.id) + ' AND `removed` = 0', function(err1) {
			if(err1) return;

			var seed = fairService.getCombinedSeed(gameProperties.server_seed, data.hash, gameProperties.id);
			var salt = fairService.generateSaltHash(seed);

			var roll = fairService.getRoll(salt, Math.pow(10, 8)) / Math.pow(10, 8);

			var winner_bet = null;
			var ticket_winner = Math.floor(roll * gameSettings.last_ticket) + 1;

			for(var bet of totalBets) {
				if(ticket_winner >= bet.tickets.min && ticket_winner <= bet.tickets.max) {
					winner_bet = bet;
					break;
				}
			}

			var total = getFormatAmount(totalBets.reduce((acc, cur) => acc + cur.amount, 0));
			var winning = getFormatAmount(total - getAmountCommission(total, config.settings.games.games.original.jackpot.house_edge.value));

			var chance = roundedToFixed(userBets[winner_bet.user.userid].amount / total * 100, 2);

			var losers = [];
			for(var bet of totalBets) {
				if(bet.user.userid != winner_bet.user.userid) {
					losers.push({
						id: bet.id,
						user: bet.user,
						amount: bet.amount
					});
				}
			}

			pool.query('INSERT INTO `jackpot_rolls` SET `gameid` = ' + pool.escape(gameProperties.id) + ', `betid` = ' + pool.escape(winner_bet.id) + ', `chance` = ' + chance + ', `amount` = ' + winning + ', `tickets` = ' + gameSettings.last_ticket + ', `blockid` = ' + pool.escape(data.block) + ', `public_seed` = ' + pool.escape(data.hash) + ', `roll` = ' + roll + ', `time` = ' + pool.escape(time()), function(err2) {
				if(err2) return;

				gameProperties.status = 'rolling';

				gameProperties.public_seed = data.hash;
				gameProperties.block = data.block;
				gameProperties.roll = roll;

				emitSocketToRoom('jackpot', 'jackpot', 'fair', {
					fair: {
						server_seed_hashed: sha256(gameProperties.server_seed),
						server_seed: gameProperties.server_seed,
						public_seed: gameProperties.public_seed,
						block: gameProperties.block,
						nonce: gameProperties.id
					}
				});

				var avatars = generateAvatars(150);
				avatars[99] = winner_bet.user.avatar;

				gameSettings.avatars_rolling = avatars;

				gameSettings.start_time = new Date().getTime();

				emitSocketToRoom('jackpot', 'jackpot', 'roll', {
					avatars: gameSettings.avatars_rolling,
					cooldown: 0
				});

				setTimeout(function(){
					pool.query('UPDATE `jackpot_games` SET `ended` = 1 WHERE `id` = ' + parseInt(gameProperties.id) + ' AND `ended` = 0', function(err3) {
						if(err3) return;

						//FINISH BET
						userService.finishOriginalBet(winner_bet.user.userid, userBets[winner_bet.user.userid].amount, winning, winning, [], 'jackpot', 'Jackpot', {
							active: true,
							visible: true,
							betid: gameProperties.id,
							countdown: 0
						}, function(err4, newxp, newbalance){
							if(err4) return;

							giveLosses(0, losers, function(err5){
								if(err5) return;

								if(winning >= config.games.winning_to_chat){
									var send_message = winner_bet.user.name + ' won ' + getFormatAmountString(winning) + ' to jackpot with chance ' + chance.toFixed(2) + '%!';
									chatService.writeSystemMessage(send_message, 'all', true, null);
								}

								var history = {
									id: gameProperties.id,
									bets: totalBets.slice(),
									winner: totalBets.findIndex(a => a.id == winner_bet.id),
									chance: chance,
									amount: winning,
									fair: {
										server_seed_hashed: sha256(gameProperties.server_seed),
										server_seed: gameProperties.server_seed,
										public_seed: gameProperties.public_seed,
										block: gameProperties.block,
										nonce: gameProperties.id
									}
								};

								lastGames.push(history);
								while(lastGames.length > 10) lastGames.shift();

								userService.updateLevel(winner_bet.user.userid, newxp);
								userService.updateBalance(winner_bet.user.userid, 'main', newbalance);

								loggerTrace('[JACKPOT] Win registed. ' + winner_bet.user.name + ' did win $' + getFormatAmountString(winning) + ' with chance ' + chance.toFixed(2) + '%');

								setTimeout(function(){
									totalBets.splice(0);
									Object.keys(userBets).forEach(key => delete userBets[key]);

									gameColors.splice(0);
									gameAvatars.splice(0);

									gameSettings.last_ticket = 0;

									generateGame();

									emitSocketToRoom('jackpot', 'jackpot', 'reset', {});

									emitSocketToRoom('jackpot', 'jackpot', 'history', {
										history: history
									});
								}, 5000);
							});
						});
					});
				}, 7000);
			});
		});
	});
}

/* ----- INTERNAL USAGE ----- */
function giveLosses(index, losers, callback) {
	if(index >= losers.length) return callback(null);

	//FINISH BET
	userService.finishOriginalBet(losers[index].user.userid, losers[index].amount, 0, 0, [], 'jackpot', 'Jackpot', {
		active: true,
		visible: false,
		betid: losers[index].id,
		countdown: 0
	}, function(err1, newxp){
		if(err1) return callback(err1);

        userService.updateLevel(losers[index].user.userid, newxp);

		giveLosses(index + 1, losers, callback);
	});
}

/* ----- INTERNAL USAGE ----- */
function generateAvatars(amount){
	var avatars = [];

	for(var i = 0; i < amount; i++){
		var ticket = getRandomInt(1, gameSettings.last_ticket);

		for(var bet of totalBets) {
			if(ticket >= bet.tickets.min && ticket <= bet.tickets.max){
				avatars.push(bet.user.avatar);
				break;
			}
		}
	}

	return avatars;
}

/* ----- INTERNAL USAGE ----- */
function generateColor(userid) {
	if(userBets[userid] !== undefined) return userBets[userid].color;

	var filter = config.games.games.jackpot.colors.filter(a => !gameColors.includes(a));
	var index = getRandomInt(0, filter.length - 1);
	var color = filter[index];

	gameColors.push(color);

	return color;
}

module.exports = {
	lastGames, gameSettings, totalBets, userBets, gameProperties, gameColors, gameAvatars,
	initializeGame, placeBet
};