var { pool } = require('@/lib/database.js');

var userService = require('@/services/userService.js');

var { getFetchDate } = require('@/utils/dashboard.js');
var { getFormatAmount, getFormatAmountString } = require('@/utils/formatAmount.js');
var { time } = require('@/utils/formatDate.js');
var { emitSocketToUser } = require('@/utils/socket.js');
var { getUserInfo } = require('@/utils/user.js');
var { verifyRecaptcha } = require('@/utils/utils.js');

var config = require('@/config/config.js');

/* ----- CLIENT USAGE ----- */
function claimEarnings(user, socket, recaptcha, cooldown){
	cooldown(true, true);

	verifyRecaptcha(recaptcha, function(verified){
		if(!verified){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid recaptcha!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `available` FROM `referral_codes` WHERE `userid` = ' + pool.escape(user.userid), function(err1, row1){
			if(err1) {
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while claiming earnings (1)'
                });

				return cooldown(false, true);
			}

			if(row1.length <= 0) {
				emitSocketToUser(socket, 'message', 'error', {
					message: 'Unable to claim the available earnings!'
				});

				return cooldown(false, true);
			}

			var amount = getFormatAmount(row1[0].available);

			if(amount <= 0) {
				emitSocketToUser(socket, 'message', 'error', {
					message: 'You don\'t have available earnings to claim!'
				});

				return cooldown(false, true);
			}

			pool.query('UPDATE `referral_codes` SET `collected` = `collected` + ' + amount + ', `available` = `available` - ' + amount + ' WHERE `userid` = ' + pool.escape(user.userid), function(err2){
				if(err2) {
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while claiming earnings (2)'
                    });

					return cooldown(false, true);
				}

				//EDIT BALANCE
				userService.editBalance(user.userid, amount, 'affiliates_earnings', function(err3, newbalance){
					if(err3) {
						emitSocketToUser(socket, 'message', 'error', {
                            message: err3.message
                        });

						return cooldown(false, true);
					}

                    pool.query('UPDATE `users` SET `rollover` = `rollover` + ' + amount + ' WHERE `userid` = ' + pool.escape(user.userid), function(err4){
                        if(err4) {
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while claiming earnings (3)'
                            });

                            return cooldown(false, true);
                        }

						emitSocketToUser(socket, 'site', 'refresh');

                        emitSocketToUser(socket, 'message', 'success', {
                            message: 'You claimed ' + getFormatAmountString(amount) + ' coins!'
                        });

						// revalidate available earnings

                        userService.updateBalance(user.userid, 'main', newbalance);

                        cooldown(false, false);
				    });
				});
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function createReferralCode(user, socket, code, recaptcha, cooldown){
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

		pool.query('SELECT `id` FROM `referral_codes` WHERE `userid` = ' + pool.escape(user.userid), function(err1, row1){
			if(err1) {
				emitSocketToUser(socket, 'message', 'error', {
					message: 'An error occurred while creating referral code (1)'
				});

				return cooldown(false, true);
			}

			if(row1.length > 0) {
				emitSocketToUser(socket, 'message', 'error', {
					message: 'You have already created a referral code!'
				});

				return cooldown(false, true);
			}

			pool.query('SELECT `id` FROM `referral_codes` WHERE `code` = ' + pool.escape(code), function(err2, row2){
				if(err2) {
					emitSocketToUser(socket, 'message', 'error', {
						message: 'An error occurred while creating referral code (2)'
					});

					return cooldown(false, true);
				}

				if(row2.length > 0){
					emitSocketToUser(socket, 'message', 'error', {
					message: 'This referral code is already taken!'
					});

					return cooldown(false, true);
				}

				pool.query('INSERT INTO `referral_codes` SET `userid` = ' + pool.escape(user.userid) + ', `code` = ' + pool.escape(code) + ', `time` = ' + pool.escape(time()), function(err3) {
					if(err3) {
						emitSocketToUser(socket, 'message', 'error', {
							message: 'An error occurred while creating referral code (3)'
						});

						return cooldown(false, true);
					}

					emitSocketToUser(socket, 'site', 'refresh');

					emitSocketToUser(socket, 'message', 'success', {
						message: 'Referral code created!'
					});

					cooldown(false, false);
				});
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function redeemReferralCode(userid, code, callback){
	if(code == null) return callback(null);

	pool.query('SELECT `userid` FROM `referral_codes` WHERE `code` = ' + pool.escape(code), function(err1, row1){
		if(err1) return callback(new Error('An error occurred while redeeming referral code (1)'));

		if(row1.length <= 0) return callback(null);
		if(row1[0].userid == userid) return callback(null);

		pool.query('SELECT `id` FROM `referral_uses` WHERE `userid` = ' + pool.escape(userid), function(err2, row2){
			if(err2) return callback(new Error('An error occurred while redeeming referral code (2)'));

			if(row2.length > 0) return callback(null);

			var amount = getFormatAmount(config.app.rewards.amounts.refferal_code);

			pool.query('INSERT INTO `referral_uses` SET `userid` = ' + pool.escape(userid) + ', `referral` = ' + pool.escape(row1[0].userid) + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err3, row3){
				if(err3) return callback(new Error('An error occurred while redeeming referral code (3)'));

				pool.query('INSERT INTO `users_rewards` SET `userid` = ' + pool.escape(userid) + ', `reward` = ' + pool.escape('referral') + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err4){
					if(err4) return callback(new Error('An error occurred while redeeming referral code (4)'));

					//EDIT BALANCE
					userService.editBalance(userid, amount, 'referral_code', function(err5){
						if(err5) return callback(err5);

						pool.query('UPDATE `users` SET `rollover` = `rollover` + ' + amount + ' WHERE `userid` = ' + pool.escape(userid), function(err6){
							if(err6) return callback(new Error('An error occurred while redeeming referral code (5)'));

							return callback(null);
						});
					});
				});
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getReferredUsers(user, socket, page, order, search, cooldown){
	cooldown(true, true);

	/* CHECK DATA */

	var order_allowed = [ 0, 1, 2, 3, 4 ];
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

	/* END CHECK DATA */

	if(!user) {
		emitSocketToUser(socket, 'pagination', 'affiliates_referred_users', {
			list: [],
			pages: 1,
			page: 1
		});

		return cooldown(false, false);
	}

    pool.query('SELECT COUNT(*) AS `count` FROM `referral_uses` INNER JOIN `users` ON referral_uses.userid = users.userid WHERE referral_uses.referral = ' + pool.escape(user.userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting referred users (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'affiliates_referred_users', {
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

		var order_query = {
			0: 'ORDER BY referral_uses.time ASC',
			1: 'ORDER BY users.name ASC',
			2: 'ORDER BY users.name DESC',
			3: 'ORDER BY COALESCE(deposited.amount, 0) + COALESCE(wagered.amount, 0) ASC',
			4: 'ORDER BY COALESCE(deposited.amount, 0) + COALESCE(wagered.amount, 0) DESC'
		}[order];

		pool.query('SELECT users.userid, users.name, users.avatar, users.xp, COALESCE(deposited.amount, 0) AS `deposited`, COALESCE(deposited.commission, 0) AS `commission_deposited`, COALESCE(wagered.amount, 0) AS `wagered`, COALESCE(wagered.commission, 0) AS `commission_wagered` FROM `referral_uses` INNER JOIN `users` ON referral_uses.userid = users.userid LEFT JOIN (SELECT `userid`, SUM(`amount`) AS `amount`, SUM(`commission`) AS `commission` FROM `referral_deposited` WHERE `referral` = ' + pool.escape(user.userid) + ' GROUP BY `userid`) `deposited` ON referral_uses.userid = deposited.userid LEFT JOIN (SELECT `userid`, SUM(`amount`) AS `amount`, SUM(`commission`) AS `commission` FROM `referral_wagered` WHERE `referral` = ' + pool.escape(user.userid) + ' GROUP BY `userid`) `wagered` ON referral_uses.userid = wagered.userid WHERE referral_uses.referral = ' + pool.escape(user.userid) + ' AND (users.userid LIKE ' + pool.escape('%' + search + '%') + ' OR users.name LIKE ' + pool.escape('%' + search + '%') + ') ' + order_query + ' LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting referred users (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(a => {
                return {
					user: getUserInfo({
						userid: a.userid,
						name: a.name,
						avatar: a.avatar,
						xp: parseInt(a.xp),
						anonymous: 0
					}),
                    wagered: getFormatAmountString(a.wagered),
                    deposited: getFormatAmountString(a.deposited),
                    earnings: {
                        wagered: getFormatAmountString(a.commission_wagered),
                        deposited: getFormatAmountString(a.commission_deposited),
                        total: getFormatAmountString(a.commission_wagered + a.commission_deposited)
                    }
                };
            });

			emitSocketToUser(socket, 'pagination', 'affiliates_referred_users', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

function getOverview(user, socket, date, cooldown){
	cooldown(true, true);

	/* CHECK DATA */

	var allowed_date = [ 'day', 'week', 'month', 'year' ];

	if(!allowed_date.includes(date)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid date!'
		});

		return cooldown(false, true);
	}

	/* END CHECK DATA */

	var labels = [];

	var months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];

	if(date == 'day') labels = [ '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23' ];
	else if(date == 'week') labels = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ];
	else if(date == 'month') labels = [ '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31' ];
	else if(date == 'year') labels = months;

	if(date == 'month') for(var i = 0; i < labels.length; i++) labels[i] += ' ' + months[new Date(getFetchDate(date) * 1000).getMonth()];
	if(date == 'day') for(var i = 0; i < labels.length; i++) labels[i] += ':00';

	if(!user) {
		emitSocketToUser(socket, 'affiliates', 'overview', {
			labels: labels,
			data: [
				Array.from(Array(labels.length), e => 0),
				Array.from(Array(labels.length), e => 0)
			]
		});

		return cooldown(false, false);
	}

	var time = getFetchDate(date);

	pool.query('SELECT `time` FROM `referral_visitors` WHERE `referral` = ' + pool.escape(user.userid) + ' AND `time` > ' + pool.escape(time), function(err1, row1) {
		if(err1) {
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting overview (1)'
            });

			return cooldown(false, true);
		}

		pool.query('SELECT `time` FROM `referral_uses` WHERE `referral` = ' + pool.escape(user.userid) + ' AND `time` > ' + pool.escape(time), function(err2, row2) {
			if(err2) {
				emitSocketToUser(socket, 'message', 'error', {
					message: 'An error occurred while getting overview (2)'
				});

				return cooldown(false, true);
			}

			emitSocketToUser(socket, 'affiliates', 'overview', {
				labels: labels,
				data: [
					calculateOverview(row1, date),
					calculateOverview(row2, date)
				]
			});

			cooldown(false, false);
		});
	});
}

/* ----- INTERNAL USAGE ----- */
function calculateOverview(data, date){
	var result = Array.from(Array({ 'day': 24, 'week': 7, 'month': 31, 'year': 12 }[date]), () => 0);

	data.forEach(function(item){
		var time_row = item.time;

		if(date == 'day') var time = new Date(time_row * 1000).getHours();
		else if(date == 'week') var time = (new Date(time_row * 1000).getDay() + 6) % 7;
		else if(date == 'month') var time = new Date(time_row * 1000).getDate() - 1;
		else if(date == 'year') var time = new Date(time_row * 1000).getMonth();

		result[time] += 1;
	});

	return result;
}

module.exports = {
	claimEarnings, createReferralCode, redeemReferralCode, getReferredUsers, getOverview
};