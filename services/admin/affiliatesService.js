var { pool } = require('@/lib/database.js');

var { getFormatAmountString } = require('@/utils/formatAmount.js');
var { makeDate } = require('@/utils/formatDate.js');
var { emitSocketToUser } = require('@/utils/socket.js');
var { getUserInfo } = require('@/utils/user.js');

var config = require('@/config/config.js');

/* ----- CLIENT USAGE ----- */
function getReferrals(user, socket, page, order, search, cooldown){
	cooldown(true, true);

	if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

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

    pool.query('SELECT COUNT(*) AS `count` FROM `referral_codes` INNER JOIN `users` ON referral_codes.userid = users.userid', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting referrals (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'admin_referrals', {
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
			0: 'ORDER BY referral_codes.time ASC',
			1: 'ORDER BY users.name ASC',
			2: 'ORDER BY users.name DESC',
			3: 'ORDER BY `earnings` ASC',
			4: 'ORDER BY `earnings` DESC'
		}[order];

		pool.query('SELECT users.userid, users.name, users.avatar, users.xp, referral_codes.code, (referral_codes.collected + referral_codes.available) AS `earnings`, referral_codes.time FROM `referral_codes` INNER JOIN `users` ON referral_codes.userid = users.userid WHERE referral_codes.userid LIKE ' + pool.escape('%' + search + '%') + ' OR users.name LIKE ' + pool.escape('%' + search + '%') + ' OR referral_codes.code LIKE ' + pool.escape('%' + search + '%') + ' ' + order_query + ' LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting referrals (2)'
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
                    code: a.code,
                    earnings: getFormatAmountString(a.earnings),
                    created: makeDate(new Date(a.time * 1000))
                };
            });

			emitSocketToUser(socket, 'pagination', 'admin_referrals', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

function getReferredUsers(user, socket, page, userid, order, search, cooldown){
    cooldown(true, true);

	if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

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

    pool.query('SELECT `id` FROM `users` WHERE `bot` = 0 AND `userid` = ' + pool.escape(userid), function(err1, row1) {
        if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting referred users (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown user!'
			});

			return cooldown(false, true);
		}

        pool.query('SELECT COUNT(*) AS `count` FROM `referral_uses` INNER JOIN `users` ON referral_uses.userid = users.userid WHERE referral_uses.referral = ' + pool.escape(userid), function(err2, row2){
            if(err2){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting referred users (2)'
                });

                return cooldown(false, true);
            }

            var pages = Math.ceil(row2[0].count / 10);

            if(pages <= 0){
                emitSocketToUser(socket, 'pagination', 'admin_referred_users', {
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

            pool.query('SELECT users.userid, users.name, users.avatar, users.xp, COALESCE(deposited.amount, 0) AS `deposited`, COALESCE(deposited.commission, 0) AS `commission_deposited`, COALESCE(wagered.amount, 0) AS `wagered`, COALESCE(wagered.commission, 0) AS `commission_wagered` FROM `referral_uses` INNER JOIN `users` ON referral_uses.userid = users.userid LEFT JOIN (SELECT `userid`, SUM(`amount`) AS `amount`, SUM(`commission`) AS `commission` FROM `referral_deposited` WHERE `referral` = ' + pool.escape(userid) + ' GROUP BY `userid`) `deposited` ON referral_uses.userid = deposited.userid LEFT JOIN (SELECT `userid`, SUM(`amount`) AS `amount`, SUM(`commission`) AS `commission` FROM `referral_wagered` WHERE `referral` = ' + pool.escape(userid) + ' GROUP BY `userid`) `wagered` ON referral_uses.userid = wagered.userid WHERE referral_uses.referral = ' + pool.escape(userid) + ' AND (users.userid LIKE ' + pool.escape('%' + search + '%') + ' OR users.name LIKE ' + pool.escape('%' + search + '%') + ') ' + order_query + ' LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err3, row3){
                if(err3){
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while getting referred users (3)'
                    });

                    return cooldown(false, true);
                }

                var list = row3.map(a => {
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

                emitSocketToUser(socket, 'pagination', 'admin_referred_users', {
                    list: list,
                    pages: pages,
                    page: page
                });

                cooldown(false, false);
            });
        });
    });
}

module.exports = {
    getReferrals, getReferredUsers
};