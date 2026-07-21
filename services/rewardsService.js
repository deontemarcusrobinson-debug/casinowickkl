var { pool } = require('@/lib/database.js');

var userService = require('@/services/userService.js');

var { getFormatAmount, getFormatAmountString } = require('@/utils/formatAmount.js');
var { time } = require('@/utils/formatDate.js');
var { emitSocketToUser } = require('@/utils/socket.js');
var { verifyRecaptcha } = require('@/utils/utils.js');

var config = require('@/config/config.js');

/* ----- CLIENT USAGE ----- */
function redeemReferralCode(user, socket, code, recaptcha, cooldown){
	cooldown(true, true);

	/* CHECK DATA */

	if(!(/(^[a-zA-Z0-9]*$)/.exec(code))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid code!'
		});

		return cooldown(false, true);
	}

	code = code.trim().toLowerCase();

	if(code.length < config.app.rewards.requirements.code_length.min || code.length > config.app.rewards.requirements.code_length.max){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid code length [' + config.app.rewards.requirements.code_length.min + '-' + config.app.rewards.requirements.code_length.max + ']!'
		});

		return cooldown(false, true);
	}

	/* END CHECK DATA */

	verifyRecaptcha(recaptcha, function(verified){
		if(!verified){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid recaptcha!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `userid` FROM `referral_codes` WHERE `code` = ' + pool.escape(code), function(err1, row1){
			if(err1) {
				emitSocketToUser(socket, 'message', 'error', {
					message: 'An error occurred while redeeming referral code (1)'
				});

				return cooldown(false, true);
			}

			if(row1.length <= 0){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'Referral code not found!'
				});

				return cooldown(false, true);
			}

			if(row1[0].userid == user.userid){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'Unable to redeem your referral code!'
				});

				return cooldown(false, true);
			}

			pool.query('SELECT `id` FROM `referral_uses` WHERE `userid` = ' + pool.escape(user.userid), function(err2, row2){
				if(err2) {
					emitSocketToUser(socket, 'message', 'error', {
						message: 'An error occurred while redeeming referral code (2)'
					});

					return cooldown(false, true);
				}

				if(row2.length > 0){
					emitSocketToUser(socket, 'message', 'error', {
						message: 'You already redeemed a referral code!'
					});

					return cooldown(false, true);
				}

				var amount = getFormatAmount(config.app.rewards.amounts.refferal_code);

				pool.query('INSERT INTO `referral_uses` SET `userid` = ' + pool.escape(user.userid) + ', `referral` = ' + pool.escape(row1[0].userid) + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err3, row3){
					if(err3) {
						emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while redeeming referral code (3)'
                        });

						return cooldown(false, true);
					}

					pool.query('INSERT INTO `users_rewards` SET `userid` = ' + pool.escape(user.userid) + ', `reward` = ' + pool.escape('referral') + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err4){
						if(err4) {
							emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while redeeming referral code (4)'
                            });

							return cooldown(false, true);
						}

						//EDIT BALANCE
						userService.editBalance(user.userid, amount, 'referral_code', function(err5, newbalance){
							if(err5) {
								emitSocketToUser(socket, 'message', 'error', {
                                    message: err5.message
                                });

								return cooldown(false, true);
							}

                            pool.query('UPDATE `users` SET `rollover` = `rollover` + ' + amount + ' WHERE `userid` = ' + pool.escape(user.userid), function(err6){
                                if(err6) {
                                    emitSocketToUser(socket, 'message', 'error', {
                                        message: 'An error occurred while redeeming referral code (5)'
                                    });

                                    return cooldown(false, true);
                                }

                        		emitSocketToUser(socket, 'site', 'refresh');

                                emitSocketToUser(socket, 'message', 'success', {
                                    message: 'You claimed ' + getFormatAmountString(amount) + ' coins!'
                                });

                                userService.updateBalance(user.userid, 'main', newbalance);

                                cooldown(false, false);
						    });
						});
					});
				});
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function claimTask(user, socket, task, recaptcha, cooldown) {
	cooldown(true, true);

	verifyRecaptcha(recaptcha, function(verified){
		if(!verified){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid recaptcha!'
			});

			return cooldown(false, true);
		}

		if(config.settings.server.auth[task] === undefined) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid task!'
			});

			return cooldown(false, true);
		}

		if(!user.links[task]){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Your account is not linked with ' + task + '!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id` FROM `users_rewards` WHERE `reward` = ' + pool.escape(task) + ' AND `userid` = ' + pool.escape(user.userid), function(err1, row1){
			if(err1) {
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while claiming task (1)'
                });

				return cooldown(false, true);
			}

			if(row1.length > 0){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'You already claimed this task!'
				});

				return cooldown(false, true);
			}

			var amount = getFormatAmount(config.app.rewards.amounts[task]);

			pool.query('INSERT INTO `users_rewards` SET `userid` = ' + pool.escape(user.userid) + ', `reward` = ' + pool.escape(task) + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err2, row2){
				if(err2) {
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while claiming task (2)'
                    });

					return cooldown(false, true);
				}

				//EDIT BALANCE
				userService.editBalance(user.userid, amount, 'claim_task', function(err3, newbalance){
					if(err3) {
						emitSocketToUser(socket, 'message', 'error', {
                            message: err3.message
                        });

						return cooldown(false, true);
					}

                    pool.query('UPDATE `users` SET `rollover` = `rollover` + ' + amount + ' WHERE `userid` = ' + pool.escape(user.userid), function(err4){
                        if(err4) {
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while claiming task (3)'
                            });

                            return cooldown(false, true);
                        }

                        emitSocketToUser(socket, 'site', 'refresh');

                        emitSocketToUser(socket, 'message', 'success', {
                            message: 'You claimed ' + getFormatAmountString(amount) + ' coins!'
                        });

                        userService.updateBalance(user.userid, 'main', newbalance);

                        cooldown(false, false);
				    });
				});
			});
		});
	});
}

module.exports = {
	redeemReferralCode, claimTask
};