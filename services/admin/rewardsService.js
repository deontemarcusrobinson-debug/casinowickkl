var { pool } = require('@/lib/database.js');

var { makeDate, time } = require('@/utils/formatDate.js');
var { getFormatAmountString, verifyFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser } = require('@/utils/socket.js');

var config = require('@/config/config.js');

/* ----- CLIENT USAGE ----- */
function createBonusCode(user, socket, code, amount, uses, expire, secret, cooldown){
	cooldown(true, true);

	if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	if(!config.app.access_secrets.includes(secret)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid secret!'
		});

		return cooldown(false, true);
	}

	/* CHECK DATA */

	code = code.trim().toLowerCase();

	if(code.length < config.app.admin.bonus_codes.requirements.code_length.min || code.length > config.app.admin.bonus_codes.requirements.code_length.max){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid code length [' + config.app.admin.bonus_codes.requirements.code_length.min + '-' + config.app.admin.bonus_codes.requirements.code_length.max + ']!'
		});

		return cooldown(false, true);
	}

	uses = parseInt(uses);

	var allowed_uses = [ 0, 1, 2, 3, 4, 5, 6 ];
	if(!allowed_uses.includes(uses)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid uses!'
		});

		return cooldown(false, true);
	}

	expire = parseInt(expire);

	var allowed_expire = [ 0, 1, 2, 3, 4 ];
	if(!allowed_expire.includes(expire)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid expire!'
		});

		return cooldown(false, true);
	}

	/* END CHECK DATA */

	verifyFormatAmount(amount, function(err1, amount){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
				message: err1.message
			});

			return cooldown(false, true);
		}

		if(amount < 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'The amount must have a greater value!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id` FROM `bonus_codes` WHERE `code` = ' + pool.escape(code), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'An error occurred while creating bonus code (1)'
				});

				return cooldown(false, true);
			}

			if(row2.length > 0){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'This code is already used!'
				});

				return cooldown(false, true);
			}

			pool.query('INSERT INTO `bonus_codes` SET `userid` = ' + pool.escape(user.userid) + ', `code` = ' + pool.escape(code) + ', `amount` = ' + amount + ', `uses` = ' + [ 1, 5, 10, 20, 50, 100, 500 ][uses] + ', `expire` = ' + pool.escape([
				-1,
				60 * 60 + time(),
				6 * 60 * 60 + time(),
				24 * 60 * 60 + time(),
				7 * 24 * 60 * 60 + time()
			][expire]) + ', `time` = ' + pool.escape(time()), function(err3){
				if(err3){
					emitSocketToUser(socket, 'message', 'error', {
						message: 'An error occurred while creating bonus code (2)'
					});

					return cooldown(false, true);
				}

				emitSocketToUser(socket, 'message', 'success', {
					message: 'Code created!'
				});

				cooldown(false, false);
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function removeBonusCode(user, socket, id, secret, cooldown){
	cooldown(true, true);

	if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	if(!config.app.access_secrets.includes(secret)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid secret!'
		});

		return cooldown(false, true);
	}

	pool.query('SELECT `id` FROM `bonus_codes` WHERE `id` = ' + pool.escape(id) + ' AND `removed` = 0', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while removing bonus code (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown bonus code!'
			});

			return cooldown(false, true);
		}

		pool.query('UPDATE `bonus_codes` SET `removed` = 1 WHERE `id` = ' + pool.escape(id) + ' AND `removed` = 0', function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while removing bonus code (2)'
                });

				return cooldown(false, true);
			}

			emitSocketToUser(socket, 'message', 'success', {
				message: 'Bonus code removed successfully!'
			});

			emitSocketToUser(socket, 'site', 'refresh');

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getBonusCodes(user, socket, page, status, search, cooldown){
    cooldown(true, true);

	if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	/* CHECK DATA */

	var status_allowed = [ 0, 1, 2 ];
	if(!status_allowed.includes(status)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid status!'
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

    var status_query = {
        0: '',
        1: 'AND (`expire` > ' + pool.escape(time()) + ' OR `expire` = -1) AND (SELECT COUNT(*) FROM `bonus_uses` WHERE `bonusid` = bc.id) < `uses`',
        2: 'AND ((`expire` <= ' + pool.escape(time()) + ' AND `expire` != -1) OR (SELECT COUNT(*) FROM `bonus_uses` WHERE `bonusid` = bc.id) >= `uses`)'
    }[status];

	pool.query('SELECT COUNT(*) AS `count` FROM `bonus_codes` `bc` WHERE `code` LIKE ' + pool.escape('%' + search + '%') + ' ' + status_query + ' AND `removed` = 0', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting bonus codes (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'admin_bonus_codes', {
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

		pool.query('SELECT `id`, `code`, `amount`, `uses` AS `max`, (SELECT COUNT(*) FROM `bonus_uses` WHERE `bonusid` = bc.id) AS `total`, `expire` FROM `bonus_codes` `bc` WHERE `code` LIKE ' + pool.escape('%' + search + '%') + ' ' + status_query + ' AND `removed` = 0 ORDER BY `id` DESC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting bonus codes (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(a => ({
                id: a.id,
                code: a.code.toUpperCase(),
                amount: getFormatAmountString(a.amount),
                uses: {
                    total: parseInt(a.total),
                    max: parseInt(a.max)
                },
                status: parseInt(a.total) < parseInt(a.max) ? a.expire > time() || a.expire == -1 ? 'active' : 'expired' : 'used',
                expire: a.expire > 0 ? makeDate(new Date(a.expire * 1000)) : 'Unset'
            }));

			emitSocketToUser(socket, 'pagination', 'admin_bonus_codes', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

module.exports = {
	createBonusCode, removeBonusCode, getBonusCodes
};