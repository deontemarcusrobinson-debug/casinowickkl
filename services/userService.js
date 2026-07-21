var { pool } = require('@/lib/database.js');
var chatService = require('@/lib/chat.js');

var historyService = require('@/services/historyService.js');

var { roundedToFixed, getFormatAmount, getFormatAmountString } = require('@/utils/formatAmount.js');
var { makeDate, time } = require('@/utils/formatDate.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');
var { haveRankPermission, calculateLevel, parseItemName, getAmountCommission, getXpByAmount, getAffiliateCommission } = require('@/utils/utils.js');

var config = require('@/config/config.js');

function updateBalance(userid, type, balance) {
	emitSocketToRoom(userid, 'user', 'balance', {
        balance: {
            type: type,
            balance: getFormatAmount(balance)
        }
    });
}

function updateLevel(userid, xp) {
	emitSocketToRoom(userid, 'user', 'level', {
        level: calculateLevel(xp)
    });
}

function getBalance(userid, callback){
	pool.query('SELECT `balance` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while getting balance (1)'));

		if(row1.length <= 0) return callback(new Error('An error occurred while getting balance (2)'));

		var balance = getFormatAmount(row1[0].balance);

		callback(null, balance);
	});
}

function registerOriginalBet(userid, amountremove, itemsid, game, callback){
	var games_allowed = Object.keys(config.settings.games.games.original);
	if(!games_allowed.includes(game)) return callback(new Error('An error occurred while registering original bet (1)'));

    editBalance(userid, -amountremove, game + '_bet', function(err1, newbalance){
        if(err1) return callback(err1);
            return callback(null, newbalance);
    });
}

function registerClassicBet(userid, amount, game, callback){
	var games_allowed = Object.keys(config.settings.games.games.classic);
	if(!games_allowed.includes(game)) return callback(new Error('An error occurred while registering classic bet (1)'));

    editBalance(userid, -amount, game + '_bet', function(err1, newbalance){
        if(err1) return callback(err1);

        pool.query('UPDATE `users` SET `rollover` = GREATEST(`rollover` - ' + amount + ', 0) WHERE `userid` = ' + pool.escape(userid), function(err2){
            if(err2) return callback(new Error('An error occurred while registering classic bet (2)'));

            pool.query('UPDATE `users` SET `xp` = `xp` + ' + getXpByAmount(amount) + ' WHERE `userid` = ' + pool.escape(userid), function(err3){
                if(err3) return callback(new Error('An error occurred while registering classic bet (3)'));

                registerAffiliates(userid, amount, 'wager', function(err4){
                    if(err4) return callback(err4);

                    pool.query('SELECT `xp` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err5, row5){
                        if(err5) return callback(new Error('An error occurred while registering classic bet (4)'));

                        if(row5.length <= 0) return callback(new Error('An error occurred while registering classic bet (5)'));

                        callback(null, row5[0].xp, newbalance);
                    });
                });
            });
        });
    });
}

function finishOriginalBet(userid, amount, winning, amountadd, itemsid, gameid, game, history, callback){
	var games_singleplayer = Object.keys(config.settings.games.games.original).filter(a => config.games.games[a].multiplayer == false);

	var games_allowed = Object.keys(config.settings.games.games.original);
	if(!games_allowed.includes(gameid)) return callback(new Error('An error occurred while finishing original bet (1)'));

	editBalance(userid, amountadd, gameid + '_win', function(err1, newbalance){
		if(err1) return callback(err1);

        var items = [];

			pool.query('UPDATE `users` SET `rollover` = GREATEST(`rollover` - ' + amount + ', 0) WHERE `userid` = ' + pool.escape(userid), function(err3){
				if(err3) return callback(new Error('An error occurred while finishing original bet (2)'));

				pool.query('UPDATE `users` SET `xp` = `xp` + ' + getXpByAmount(amount) + ' WHERE `userid` = ' + pool.escape(userid), function(err4){
					if(err4) return callback(new Error('An error occurred while finishing original bet (3)'));

					registerAffiliates(userid, amount, 'wager', function(err5){
						if(err5) return callback(err5);

                        pool.query('SELECT `xp` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err6, row6){
                            if(err6) return callback(new Error('An error occurred while finishing original bet (4)'));

                            if(row6.length <= 0) return callback(new Error('An error occurred while finishing original bet (5)'));

                            if(!history.active) return callback(null, row6[0].xp, newbalance, items);

                            historyService.registerHistory(userid, 'original', gameid, game, history.betid, amount, winning, winning > 0 ? winning / amount : 0, history.visible || games_singleplayer.includes(game), history.countdown, function(err7){
                                if(err7) return callback(err7);

                                callback(null, row6[0].xp, newbalance, items);
						    });
						});
					});
				});
			});
	});
}

function finishClassicBet(userid, amount, winning, category, gameid, game, history, callback){
	var categories_allowed = Object.keys(config.settings.games.games.classic);
	if(!categories_allowed.includes(category)) return callback(new Error('An error occurred while finishing classic bet (1)'));

	editBalance(userid, winning, category + '_win', function(err1, newbalance){
		if(err1) return callback(err1);

        if(!history.active) return callback(null, newbalance);

        historyService.registerHistory(userid, category, gameid, game, history.betid, amount, winning, winning > 0 && amount > 0 ? winning / amount : 0, true, history.countdown, function(err2){
            if(err2) return callback(err2);

            callback(null, newbalance);
        });
	});
}

function refundOriginalBet(userid, amount, game, callback){
	editBalance(userid, amount, game + '_refund', function(err1, newbalance){
		if(err1) return callback(err1);

		callback(null, newbalance);
	});
}

function refundClassicBet(userid, amount, game, callback){
	editBalance(userid, amount, game + '_refund', function(err1, newbalance){
		if(err1) return callback(err1);

		callback(null, newbalance);
	});
}

function editBalance(userid, amount, transaction, callback){
	if(amount == 0) {
        pool.query('SELECT `balance` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err1, row1) {
            if(err1) return callback(new Error('An error occurred while editing balance (1)'));

            if(row1.length <= 0) return callback(new Error('An error occurred while editing balance (2)'));

            var newbalance = getFormatAmount(row1[0].balance);

            callback(null, newbalance);
        });
    } else {
        pool.query('UPDATE `users` SET `balance` = `balance` + ' + amount + ' WHERE `userid` = ' + pool.escape(userid), function(err1, row1) {
            if(err1) return callback(new Error('An error occurred while editing balance (3)'));

            pool.query('INSERT INTO `users_transactions` SET `userid` = ' + pool.escape(userid) + ', `transaction` = ' + pool.escape(transaction) + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err2, row2){
                if(err2) return callback(new Error('An error occurred while editing balance (4)'));

                pool.query('SELECT `balance` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err3, row3) {
                    if(err3) return callback(new Error('An error occurred while editing balance (5)'));

                    if(row3.length <= 0) return callback(new Error('An error occurred while editing balance (6)'));

                    var newbalance = getFormatAmount(row3[0].balance);

                    callback(null, newbalance);
                });
            });
        });
    }
}

function registerAffiliates(userid, amount, type, callback){
	var types_allowed = [ 'wager', 'deposit' ];
	if(!types_allowed.includes(type)) return callback(new Error('An error occurred while registering affiliates (1)'));

	pool.query('SELECT COALESCE(SUM(referral_deposited.amount), 0) AS `amount`, referral_uses.referral FROM `referral_uses` LEFT JOIN `referral_deposited` ON referral_uses.referral = referral_deposited.referral WHERE referral_uses.userid = ' + pool.escape(userid) + ' GROUP BY referral_uses.referral', function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while registering affiliates (2)'));

		if(row1.length <= 0) return callback(null);

		var earnings = getAmountCommission(amount, getAffiliateCommission(getFormatAmount(row1[0].amount), type));

		if(type == 'wager') {
			pool.query('INSERT INTO `referral_wagered` SET `userid` = ' + pool.escape(userid) + ', `referral` = ' + pool.escape(row1[0].referral) + ', `amount` = ' + amount + ', `commission` = ' + earnings + ', `time` = ' + pool.escape(time()), function(err2){
				if(err2) return callback(new Error('An error occurred while registering affiliates (3)'));

				pool.query('UPDATE `referral_codes` SET `available` = `available` + ' + earnings + ' WHERE `userid` = ' + pool.escape(row1[0].referral), function(err3){
					if(err3) return callback(new Error('An error occurred while registering affiliates (4)'));

					callback(null);
				});
			});
		} else if(type == 'deposit') {
			pool.query('INSERT INTO `referral_deposited` SET `userid` = ' + pool.escape(userid) + ', `referral` = ' + pool.escape(row1[0].referral) + ', `amount` = ' + amount + ', `commission` = ' + earnings + ', `time` = ' + pool.escape(time()), function(err4){
				if(err4) return callback(new Error('An error occurred while registering affiliates (5)'));

				pool.query('UPDATE `referral_codes` SET `available` = `available` + ' + earnings + ' WHERE `userid` = ' + pool.escape(row1[0].referral), function(err5){
					if(err5) return callback(new Error('An error occurred while registering affiliates (6)'));

					callback(null);
				});
			});
		}
	});
}

function registerDepositBonus(userid, amount, callback){
	pool.query('SELECT `bonusid` FROM `deposit_uses` WHERE `userid` = ' + pool.escape(userid) + ' AND `removed` = 0', function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while registering deposit bonus (1)'));

		if(row1.length <= 0) return callback(null, null);

		var bonus_deposit = getAmountCommission(amount, config.trading.deposit_bonus);

		editBalance(userid, bonus_deposit, 'deposit_bonus', function(err2, newbalance){
			if(err2) return callback(err2);

			pool.query('UPDATE `deposit_codes` SET `uses` = `uses` + 1, `amount` = `amount` + ' + bonus_deposit + ' WHERE `id` = ' + pool.escape(row1[0].bonusid) + ' AND `removed` = 0', function(err3) {
				if(err3) return callback(new Error('An error occurred while registering deposit bonus (2)'));

				pool.query('INSERT INTO `deposit_bonuses` SET `userid` = ' + pool.escape(userid) + ', `bonusid` = ' + pool.escape(row1[0].bonusid) + ', `amount` = ' + bonus_deposit + ', `time` = ' + pool.escape(time()), function(err4) {
					if(err4) return callback(new Error('An error occurred while registering deposit bonus (3)'));

					callback(null, newbalance);
				});
			});
		});
	});
}

function unsetRestrictionAccount(user, socket, data, callback) {
	pool.query('SELECT `id` FROM `users_restrictions` WHERE `removed` = 0 AND `restriction` = ' + pool.escape(data.restriction) + ' AND (`expire` = -1 OR `expire` > ' + pool.escape(time()) + ') AND `userid` = ' + pool.escape(data.userid), function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while unsetting restriction account (1)'));

		if(row1.length <= 0) return callback(new Error('This user don\'t have this restriction!'));

		pool.query('UPDATE `users_restrictions` SET `removed` = 1 WHERE `removed` = 0 AND `restriction` = ' + pool.escape(data.restriction) + ' AND (`expire` = -1 OR `expire` > ' + pool.escape(time()) + ') AND `userid` = '+ pool.escape(data.userid), function(err2, row2){
			if(err2) return callback(new Error('An error occurred while unsetting restriction account (2)'));

			if(row2.affectedRows <= 0) return callback(new Error('An error occurred while unsetting restriction account (3)'));

			callback(null);
		});
	});
}

function setRestrictionAccount(user, socket, data, chat, callback) {
	var expire = parseInt(data.expire);

	if(expire <= time() && expire != -1) return callback(new Error('Invalid expire date!'));

	pool.query('SELECT `name` FROM `users` WHERE `userid` = ' + pool.escape(data.userid), function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while setting restriction account (1)'));

		if(row1.length == 0) return callback(new Error('Unknown user!'));

		pool.query('SELECT `id` FROM `users_restrictions` WHERE `removed` = 0 AND `restriction` = ' + pool.escape(data.restriction) + ' AND (`expire` = -1 OR `expire` > ' + pool.escape(time()) + ') AND `userid` = ' + pool.escape(data.userid), function(err2, row2) {
			if(err2) return callback(new Error('An error occurred while setting restriction account (2)'));

			if(row2.length > 0) return callback(new Error('This user have already this restriction!'));

			pool.query('INSERT INTO `users_restrictions` SET `userid` = ' + pool.escape(data.userid) + ', `restriction` = ' + pool.escape(data.restriction) + ', `reason` = ' + pool.escape(data.reason) + ', `adminid` = '+ pool.escape(user.userid) + ', `expire` = ' + pool.escape(expire) + ', `time` = '+ pool.escape(time()), function(err3){
				if(err3) return callback(new Error('An error occurred while setting restriction account (3)'));

				if(chat){
					if(data.restriction == 'play') var text_message = 'User ' + row1[0].name + ' was play banned by ' + user.name + ' for ' + data.reason + '. The restriction expires ' + (expire == -1 ? 'never' : makeDate(new Date(expire * 1000))) + '.';
					else if(data.restriction == 'trade') var text_message = 'User ' + row1[0].name + ' was trade banned by ' + user.name + ' for ' + data.reason + '. The restriction expires ' + (expire == -1 ? 'never' : makeDate(new Date(expire * 1000))) + '.';
					else if(data.restriction == 'site') var text_message = 'User ' + row1[0].name + ' was site banned by ' + user.name + ' for ' + data.reason + '. The restriction expires ' + (expire == -1 ? 'never' : makeDate(new Date(expire * 1000))) + '.';
					else if(data.restriction == 'mute') var text_message = 'User ' + row1[0].name + ' was muted by ' + user.name + ' for ' + data.reason + '. The restriction expires ' + (expire == -1 ? 'never' : makeDate(new Date(expire * 1000))) + '.';

					chatService.writeSystemMessage(text_message, 'all', true, null);
				}

				callback(null);
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserTransactions(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

	pool.query('SELECT COUNT(*) AS `count` FROM `users_transactions` WHERE `userid` = ' + pool.escape(userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user transactions (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_transactions', {
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

		pool.query('SELECT `id`, `transaction`, `amount`, `time` FROM `users_transactions` WHERE `userid` = ' + pool.escape(userid) + ' ORDER BY `id` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user transactions (2)'
                });

				return cooldown(false, true);
			}

			row2.reverse();

            var list = row2.map(a => ({
                id: a.id,
                transaction: a.transaction,
                amount: getFormatAmountString(a.amount),
                date: makeDate(new Date(a.time * 1000))
            }));

            list.reverse();

            emitSocketToUser(socket, 'pagination', 'user_transactions', {
                list: list,
                pages: pages,
                page: page
            });

            cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserDeposits(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

    pool.query([
            'SELECT COUNT(*) AS `count` FROM `manual_transactions` WHERE `userid` = ' + pool.escape(userid) + ' AND `type` = "deposit"',
            'SELECT COUNT(*) AS `count` FROM `cash_transactions` WHERE `userid` = ' + pool.escape(userid) + ' AND `type` = "deposit"',
            'SELECT COUNT(*) AS `count` FROM `crypto_transactions` WHERE `userid` = ' + pool.escape(userid) + ' AND `type` = "deposit"'
        ].join(' UNION ALL '), function(err1, row1){
        if(err1){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user deposits (1)'
            });

            return cooldown(false, true);
        }

        var pages = Math.ceil(row1.reduce((acc, cur) => acc + cur.count, 0) / 10);

        if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_deposits', {
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

		pool.query([
                'SELECT `id`, 0 AS `status`, `amount`, `amount` AS `paid`, "manual" AS `method`, "manual" AS `game`, `time` FROM `manual_transactions` WHERE `userid` = ' + pool.escape(userid) + ' AND `type` = "deposit"',
                'SELECT `transactionid` AS `id`, `status`, `amount`, `paid`, "cash" AS `method`, `currency` AS `game`, `time` FROM `cash_transactions` WHERE `userid` = ' + pool.escape(userid) + ' AND `type` = "deposit"',
                'SELECT `transactionid` AS `id`, `status`, `amount`, `paid` * `exchange` AS `paid`, "crypto" AS `method`, `currency` AS `game`, `time` FROM `crypto_transactions` WHERE `userid` = ' + pool.escape(userid) + ' AND `type` = "deposit"'
            ].join(' UNION ALL ') + ' ORDER BY `time` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user deposits (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var status = {
                    'manual': 'completed',
                    'cash': item.status == 5 ? 'completed' : item.status < 0 ? 'declined' : 'pending',
                    'crypto': item.status == 5 ? 'completed' : item.status == 4 ? 'partially_paid' : item.status < 0 ? 'declined' : 'pending'
                }[item.method];

                return {
                    id: item.id || '-',
                    amount: getFormatAmountString(item.amount),
                    paid: getFormatAmountString(item.paid),
                    method: item.game,
                    status: status,
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'user_deposits', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserWithdrawals(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

	pool.query([
            'SELECT COUNT(*) AS `count` FROM `manual_transactions` WHERE `userid` = ' + pool.escape(userid) + ' AND `type` = "withdraw"',
            'SELECT COUNT(*) AS `count` FROM `crypto_transactions` WHERE `userid` = ' + pool.escape(userid) + ' AND `type` = "withdraw"'
        ].join(' UNION ALL '), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user withdrawals (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1.reduce((acc, cur) => acc + cur.count, 0) / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_withdrawals', {
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

		pool.query([
                'SELECT `id`, 0 AS `status`, `amount`, "manual" AS `method`, "manual" AS `game`, `time` FROM `manual_transactions` WHERE `userid` = ' + pool.escape(userid) + ' AND `type` = "withdraw"',
                'SELECT `transactionid` AS `id`, `status`, `amount`, "crypto" AS `method`, `currency` AS `game`, `time` FROM `crypto_transactions` WHERE `userid` = ' + pool.escape(userid) + ' AND `type` = "withdraw"'
            ].join(' UNION ALL ') + ' ORDER BY `time` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user withdrawals (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var status = {
                    'manual': 'completed',
                    'crypto': item.status == 4 ? 'completed' : item.status < 0 ? 'declined' : 'pending'
                }[item.method];

                return {
                    id: item.id || '-',
                    amount: getFormatAmountString(item.amount),
                    method: item.game,
                    status: status,
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'user_withdrawals', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserRouletteHistory(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

	pool.query('SELECT COUNT(*) AS `count` FROM `roulette_bets` INNER JOIN `roulette_rolls` ON roulette_bets.gameid = roulette_rolls.id WHERE roulette_bets.userid = ' + pool.escape(userid) + ' AND roulette_rolls.ended = 1', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user roulette history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_roulette_history', {
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

		pool.query('SELECT roulette_bets.id, roulette_bets.amount, roulette_bets.color, roulette_rolls.roll, roulette_bets.time FROM `roulette_bets` INNER JOIN `roulette_rolls` ON roulette_bets.gameid = roulette_rolls.id WHERE roulette_bets.userid = ' + pool.escape(userid) + ' AND roulette_rolls.ended = 1 ORDER BY roulette_bets.id DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user roulette history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var colors = [];

                if(item.roll == 0) colors.push('green');
                else if(item.roll >= 1 && item.roll <= 7) colors.push('red');
                else if(item.roll >= 8 && item.roll <= 14) colors.push('black');

                if(item.roll == 4 || item.roll == 11) colors.push('bait');

                var amount = getFormatAmount(item.amount);
                var winnings = 0;
                if(colors.includes(item.color)) winnings = getFormatAmount(amount * config.games.games.roulette.multipliers[item.color]);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    option: item.color,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: colors.includes(item.color) ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'user_roulette_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserCrashHistory(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

	pool.query('SELECT COUNT(*) AS `count` FROM `crash_bets` INNER JOIN `crash_rolls` ON crash_bets.gameid = crash_rolls.id WHERE crash_bets.userid = ' + pool.escape(userid) + ' AND crash_rolls.ended = 1', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user crash history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_crash_history', {
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

		pool.query('SELECT crash_bets.id, crash_bets.amount, crash_bets.cashedout, crash_bets.point, crash_bets.time FROM `crash_bets` INNER JOIN `crash_rolls` ON crash_bets.gameid = crash_rolls.id WHERE crash_bets.userid = ' + pool.escape(userid) + ' AND crash_rolls.ended = 1 ORDER BY crash_bets.id DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user crash history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = 0;
                if(parseInt(item.cashedout)) winnings = getFormatAmount(amount * roundedToFixed(item.point, 2));

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    multiplier: roundedToFixed(item.point, 2).toFixed(2),
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: parseInt(item.cashedout) ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'user_crash_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserJackpotHistory(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

	pool.query('SELECT COUNT(*) AS `count` FROM `jackpot_bets` INNER JOIN `jackpot_games` ON jackpot_bets.gameid = jackpot_games.id INNER JOIN `jackpot_rolls` ON jackpot_games.id = jackpot_rolls.gameid WHERE jackpot_bets.userid = ' + pool.escape(userid) + ' AND jackpot_games.ended = 1 AND jackpot_rolls.removed = 0', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user jackpot history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_jackpot_history', {
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

		pool.query('SELECT jackpot_bets.id, IF(jackpot_bets.id = jackpot_rolls.betid, 1, 0) AS `status`, jackpot_bets.amount, jackpot_rolls.amount AS `winnings`, jackpot_rolls.roll, jackpot_bets.time FROM `jackpot_bets` INNER JOIN `jackpot_games` ON jackpot_bets.gameid = jackpot_games.id INNER JOIN `jackpot_rolls` ON jackpot_games.id = jackpot_rolls.gameid WHERE jackpot_bets.userid = ' + pool.escape(userid) + ' AND jackpot_games.ended = 1 AND jackpot_rolls.removed = 0 ORDER BY jackpot_bets.id DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user jackpot history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = 0;
                if(parseInt(item.status)) winnings = getFormatAmount(item.winnings);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    roll: item.roll,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: parseInt(item.status) ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'user_jackpot_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserCoinflipHistory(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

	pool.query('SELECT COUNT(*) AS `count` FROM `coinflip_bets` INNER JOIN `coinflip_games` ON coinflip_bets.gameid = coinflip_games.id INNER JOIN `coinflip_rolls` ON coinflip_games.id = coinflip_rolls.gameid INNER JOIN `coinflip_winnings` ON coinflip_games.id = coinflip_winnings.gameid WHERE coinflip_bets.userid = ' + pool.escape(userid) + ' AND coinflip_games.canceled = 0 AND coinflip_games.ended = 1 AND coinflip_rolls.removed = 0', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user coinflip history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_coinflip_history', {
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

		pool.query('SELECT coinflip_bets.id, IF(coinflip_bets.position = coinflip_winnings.position, 1, 0) AS `status`, coinflip_games.amount, coinflip_winnings.amount AS `winnings`, coinflip_bets.time FROM `coinflip_bets` INNER JOIN `coinflip_games` ON coinflip_bets.gameid = coinflip_games.id INNER JOIN `coinflip_rolls` ON coinflip_games.id = coinflip_rolls.gameid INNER JOIN `coinflip_winnings` ON coinflip_games.id = coinflip_winnings.gameid WHERE coinflip_bets.userid = ' + pool.escape(userid) + ' AND coinflip_games.canceled = 0 AND coinflip_games.ended = 1 AND coinflip_rolls.removed = 0 ORDER BY coinflip_bets.id DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user coinflip history (1)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = 0;
                if(parseInt(item.status)) winnings = getFormatAmount(item.winnings);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: parseInt(item.status) ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'user_coinflip_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserDiceHistory(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

	pool.query('SELECT COUNT(*) AS `count` FROM `dice_bets` WHERE `userid` = ' + pool.escape(userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user dice history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_dice_history', {
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

		pool.query('SELECT `id`, `amount`, `multiplier`, `roll`, `mode`, `chance`, `time` FROM `dice_bets` WHERE `userid` = ' + pool.escape(userid) + ' ORDER BY `id` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user dice history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var roll = roundedToFixed(item.roll, 2);
                var chance = roundedToFixed(item.chance, 2);

                var win = false;

                if(item.mode == 'under' && roll < chance) win = true;
                if(item.mode == 'over' && roll >= roundedToFixed(100 - chance, 2)) win = true;

                var amount = getFormatAmount(item.amount);
                var winnings = 0;
                if(win) winnings = getFormatAmount(amount * roundedToFixed(item.multiplier, 2));

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    roll: roll.toFixed(2),
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: win ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'user_dice_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserTowerHistory(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

	pool.query('SELECT COUNT(*) AS `count` FROM `tower_bets` WHERE `userid` = ' + pool.escape(userid) + ' AND `ended` = 1', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user tower history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_tower_history', {
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

		pool.query('SELECT `id`, `amount`, `winning`, `difficulty`, `time` FROM `tower_bets` WHERE `userid` = ' + pool.escape(userid) + ' AND `ended` = 1 ORDER BY `id` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user tower history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = getFormatAmount(item.winning);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    difficulty: item.difficulty,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: profit > 0 ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'user_tower_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserMinesweeperHistory(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

	pool.query('SELECT COUNT(*) AS `count` FROM `minesweeper_bets` WHERE `userid` = ' + pool.escape(userid) + ' AND `ended` = 1', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user minesweeper history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_minesweeper_history', {
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

		pool.query('SELECT `id`, `amount`, `winning`, `bombs`, `time` FROM `minesweeper_bets` WHERE `userid` = ' + pool.escape(userid) + ' AND `ended` = 1 ORDER BY `id` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user minesweeper history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = getFormatAmount(item.winning);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    bombs: item.bombs,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: profit > 0 ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'user_minesweeper_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserPlinkoHistory(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

	pool.query('SELECT COUNT(*) AS `count` FROM `plinko_bets` WHERE `userid` = ' + pool.escape(userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user plinko history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_plinko_history', {
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

		pool.query('SELECT `id`, `amount`, `multiplier`, `difficulty`, `rows`, `time` FROM `plinko_bets` WHERE `userid` = ' + pool.escape(userid) + ' ORDER BY `id` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user plinko history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = getFormatAmount(amount * roundedToFixed(item.multiplier, 2));

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    difficulty: item.difficulty,
                    rows: item.rows,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: profit > 0 ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'user_plinko_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getUserCasinoHistory(user, socket, page, userid, cooldown){
	cooldown(true, true);

    if(!haveRankPermission('view_user', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
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

	pool.query('SELECT COUNT(*) AS `count` FROM `casino_bets` LEFT JOIN `casino_winnings` ON casino_bets.id = casino_winnings.betid WHERE casino_bets.userid = ' + pool.escape(userid) + ' AND casino_bets.refunded = 0', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting user casino history (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'user_casino_history', {
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

		pool.query('SELECT casino_bets.id, casino_bets.amount, COALESCE(casino_winnings.amount, 0) AS `winnings`, casino_bets.game, casino_bets.time FROM `casino_bets` LEFT JOIN `casino_winnings` ON casino_bets.id = casino_winnings.betid WHERE casino_bets.userid = ' + pool.escape(userid) + ' AND casino_bets.refunded = 0 ORDER BY casino_bets.id DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting user casino history (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(function(item){
                var amount = getFormatAmount(item.amount);
                var winnings = getFormatAmount(item.winnings);

                var profit = getFormatAmount(winnings - amount);

                return {
                    id: item.id,
                    game: item.game,
                    amount: getFormatAmountString(amount),
                    profit: getFormatAmountString(profit),
                    status: profit > 0 ? 'win': 'loss',
                    date: makeDate(new Date(item.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'user_casino_history', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

module.exports = {
	updateBalance, updateLevel,
    getBalance, editBalance,
    registerAffiliates, registerDepositBonus,
    unsetRestrictionAccount, setRestrictionAccount,
	registerOriginalBet,
    registerClassicBet,
    finishOriginalBet,
    finishClassicBet,
    refundOriginalBet,
    refundClassicBet,
    getUserTransactions,
    getUserDeposits,
    getUserWithdrawals,
    getUserRouletteHistory,
    getUserCrashHistory,
    getUserJackpotHistory,
    getUserCoinflipHistory,
    getUserDiceHistory,
    getUserTowerHistory,
    getUserMinesweeperHistory,
    getUserPlinkoHistory,
    getUserCasinoHistory
};