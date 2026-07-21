var { pool } = require('@/lib/database.js');
var { loggerTrace } = require('@/lib/logger.js');

var chatService = require('@/services/chatService.js');
var userService = require('@/services/userService.js');
var fairService = require('@/services/fairService.js');

var { time } = require('@/utils/formatDate.js');
var { roundedToFixed, getFormatAmount, getFormatAmountString, verifyFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');

var config = require('@/config/config.js');

var gameCooldown = {};

/* ----- CLIENT USAGE ----- */
function placeBet(user, socket, amount, difficulty, rows, cooldown){
	if(gameCooldown[user.userid]){
		return emitSocketToUser(socket, 'message', 'error', {
			message: 'Wait for ending last plinko game!'
		});
	}

	cooldown(true, true);

	/* CHECK DATA */

	var allowed_difficulty = [ 'easy', 'medium', 'hard' ];
	if(!allowed_difficulty.includes(difficulty)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid difficulty type!'
		});

		return cooldown(false, true);
	}

	if(isNaN(Number(rows))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid rows!'
		});

		return cooldown(false, true);
	}

	rows = parseInt(rows);

	var allowed_rows = [ 8, 9, 10, 11, 12, 13, 14, 15, 16 ];
	if(!allowed_rows.includes(rows)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid rows!'
		});

		return cooldown(false, true);
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

		//SEEDS
		fairService.getUserSeeds(user.userid, function(err2, fair){
			if(err2) {
				emitSocketToUser(socket, 'message', 'error', {
					message: err2.message
				});

				return cooldown(false, true);
			}

            if(amount < config.app.intervals.amounts['plinko'].min || amount > config.app.intervals.amounts['plinko'].max) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'Invalid bet amount [' + getFormatAmountString(config.app.intervals.amounts['plinko'].min) + '-' + getFormatAmountString(config.app.intervals.amounts['plinko'].max) + ']'
                });

                return cooldown(false, true);
            }

            //CHECK BALANCE
            userService.getBalance(user.userid, function(err3, balance){
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: err3.message
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
                userService.registerOriginalBet(user.userid, amount, [], 'plinko', function(err4, newbalance1){
                    if(err4) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: err4.message
                        });

                        return cooldown(false, true);
                    }

                    var seed = fairService.getCombinedSeed(fair.server_seed, fair.client_seed, fair.nonce);

                    var salt = fairService.generateSaltHash(seed);
                    var array = fairService.getRollPlinko(salt, rows);

                    var roll = array.join('');

                    var result = 0;
                    array.forEach(function(item){ result += item; });

                    var multiplier = generateAmounts()[difficulty][rows][result];
                    var winning = getFormatAmount(multiplier * amount);

                    pool.query('INSERT INTO `plinko_bets` SET `userid` = ' + pool.escape(user.userid) + ', `name` = ' + pool.escape(user.name) + ', `avatar` = ' + pool.escape(user.avatar) + ', `xp` = ' + parseInt(user.xp) + ', `amount` = ' + amount + ', `difficulty` = ' + pool.escape(difficulty) + ', `rows` = ' + rows + ', `multiplier` = ' + multiplier + ', `roll` = ' + pool.escape(roll) + ', `server_seedid` = ' + pool.escape(fair.server_seedid) + ', `client_seedid` = ' + pool.escape(fair.client_seedid) + ', `nonce` = ' + pool.escape(fair.nonce) + ', `time` = ' + pool.escape(time()), function(err5, row5) {
                        if(err5) {
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while placing bet (1)'
                            });

                            return cooldown(false, true);
                        }

                        pool.query('UPDATE `users_server_seeds` SET `nonce` = `nonce` + 1 WHERE `userid` = ' + pool.escape(user.userid) + ' AND `id` = ' + pool.escape(fair.server_seedid), function(err6){
                            if(err6) {
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: 'An error occurred while placing bet (2)'
                                });

                                return cooldown(false, true);
                            }

                            //FINISH BET
                            userService.finishOriginalBet(user.userid, amount, winning, winning, [], 'plinko', 'Plinko', {
                                active: true,
                                visible: true,
                                betid: row5.insertId,
                                countdown: 300 * (rows + 1) + 1000
                            }, function(err7, newxp, newbalance2){
                                if(err7) {
                                    emitSocketToUser(socket, 'message', 'error', {
                                        message: err7.message
                                    });

                                    return cooldown(false, true);
                                }

                                emitSocketToUser(socket, 'plinko', 'bet', {
                                    id: row5.insertId,
                                    roll: array,
                                    total: amount,
                                    profit: 0
                                });

                                setTimeout(function(){
                                    emitSocketToUser(socket, 'plinko', 'result', {
                                        total: winning,
                                        profit: getFormatAmount(winning - amount)
                                    });

                                    userService.updateLevel(user.userid, newxp);
                                    userService.updateBalance(user.userid, 'main', newbalance2);

                                    if(winning >= config.games.winning_to_chat){
                                        var send_message = user.name + ' won ' + getFormatAmountString(winning) + ' to plinko with multiplier x' + roundedToFixed(multiplier, 2).toFixed(2) + '!';
                                        chatService.writeSystemMessage(send_message, 'all', true, null);
                                    }

                                    loggerTrace('[PLINKO] Win registed. ' + user.name + ' did win $' + getFormatAmountString(winning) + ' with multiplier x' + roundedToFixed(multiplier, 2).toFixed(2));

                                    gameCooldown[user.userid] = false;
                                }, 300 * (rows + 1) + 1000);

                                cooldown(false, false);
                            });

                            userService.updateBalance(user.userid, 'main', newbalance1);

                            loggerTrace('[PLINKO] Bet registed. ' + user.name + ' did bet $' + getFormatAmountString(amount));
                        });
                    });
                });
            });
		});
	});
}

function generateAmounts(){
	var multipliers = {};

	Object.keys(config.games.games.plinko.results).forEach(function(difficulty){
		if(multipliers[difficulty] === undefined) multipliers[difficulty] = {};

		Object.keys(config.games.games.plinko.results[difficulty]).forEach(function(rows){
			multipliers[difficulty][rows] = config.games.games.plinko.results[difficulty][rows].map(a => roundedToFixed(a * (100 - config.settings.games.games.original.plinko.house_edge.value) / 100, 2));
		});
	});

	return multipliers;
}

module.exports = {
	gameCooldown,
	generateAmounts,
	placeBet
};