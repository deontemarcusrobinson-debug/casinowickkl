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
function placeBet(user, socket, amount, chance, mode, cooldown){
	if(gameCooldown[user.userid]){
		return emitSocketToUser(socket, 'message', 'error', {
			message: 'Wait for ending last dice game!'
		});
	}

	cooldown(true, true);

	/* CHECK DATA */

	var allowed_mode = [ 'under', 'over' ];
	if(!allowed_mode.includes(mode)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid type mode [over or under]!'
		});

		return cooldown(false, true);
	}

	if(isNaN(Number(chance))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid chance!'
		});

		return cooldown(false, true);
	}

	chance = roundedToFixed(chance, 2);

	if(chance < 0.01 || chance > 94) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid chance [0.01 - 94]!'
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

            if(amount < config.app.intervals.amounts['dice'].min || amount > config.app.intervals.amounts['dice'].max) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'Invalid bet amount [' + getFormatAmountString(config.app.intervals.amounts['dice'].min) + '-' + getFormatAmountString(config.app.intervals.amounts['dice'].max) + ']'
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
                userService.registerOriginalBet(user.userid, amount, [], 'dice', function(err4, newbalance1){
                    if(err4) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: err4.message
                        });

                        return cooldown(false, true);
                    }

                    var seed = fairService.getCombinedSeed(fair.server_seed, fair.client_seed, fair.nonce);
                    var salt = fairService.generateSaltHash(seed);

                    var roll = (fairService.getRoll(salt, 10000) / 100) % 100;

                    var multiplier = roundedToFixed((100 - config.settings.games.games.original.dice.house_edge.value) / chance, 2);
                    var win = false;

                    if(mode == 'under' && roll < chance) win = true;
                    if(mode == 'over' && roll >= roundedToFixed(100 - chance, 2)) win = true;

                    var winning = 0;
                    if(win) winning = getFormatAmount(multiplier * amount);

                    pool.query('INSERT INTO `dice_bets` SET `userid` = ' + pool.escape(user.userid) + ', `avatar` = ' + pool.escape(user.avatar) + ', `name` = ' + pool.escape(user.name) + ', `xp` = ' + parseInt(user.xp) + ', `amount` = ' + amount + ', `mode` = ' + pool.escape(mode) + ', `chance` = ' + chance + ', `multiplier` = ' + multiplier + ', `roll` = ' + roll + ', `server_seedid` = ' + pool.escape(fair.server_seedid) + ', `client_seedid` = ' + pool.escape(fair.client_seedid) + ', `nonce` = ' + pool.escape(fair.nonce) + ', `time` = ' + pool.escape(time()), function(err5, row5) {
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
                            userService.finishOriginalBet(user.userid, amount, winning, winning, [], 'dice', 'Dice', {
                                active: true,
                                visible: true,
                                betid: row5.insertId,
                                countdown: 2000 + 1000
                            }, function(err7, newxp, newbalance2){
                                if(err7) {
                                    emitSocketToUser(socket, 'message', 'error', {
                                        message: err7.message
                                    });

                                    return cooldown(false, true);
                                }

                                emitSocketToUser(socket, 'dice', 'bet', {
                                    roll: roll,
                                    total: amount,
                                    profit: 0
                                });

                                setTimeout(function(){
                                    emitSocketToUser(socket, 'dice', 'result', {
                                        roll: roll,
                                        win: win,
                                        total: amount,
                                        profit: getFormatAmount(winning - amount)
                                    });

                                    userService.updateLevel(user.userid, newxp);
                                    userService.updateBalance(user.userid, 'main', newbalance2);

                                    if(win){
                                        if(winning >= config.games.winning_to_chat){
                                            var send_message = user.name + ' won ' + getFormatAmountString(winning) + ' to dice with chance ' + chance.toFixed(2) + '!';
                                            chatService.writeSystemMessage(send_message, 'all', true, null);
                                        }

                                        loggerTrace('[DICE] Win registed. ' + user.name + ' did win $' + getFormatAmountString(winning) + ' with chance ' + chance.toFixed(2));
                                    }

                                    gameCooldown[user.userid] = false;
                                }, 2000 + 1000);

                                cooldown(false, false);
                            });

                            userService.updateBalance(user.userid, 'main', newbalance1);

                            loggerTrace('[DICE] Bet registed. ' + user.name + ' did bet $' + getFormatAmountString(amount));
                        });
                    });
                });
		    });
		});
	});
}

module.exports = {
	gameCooldown,
	placeBet
};