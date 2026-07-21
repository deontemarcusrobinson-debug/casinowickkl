var fs = require('fs');

var { pool } = require('@/lib/database.js');
var { loggerError } = require('@/lib/logger.js');

var { time } = require('@/utils/formatDate.js');
var { emitSocketToUser } = require('@/utils/socket.js');
var { setObjectProperty, generateHexCode } = require('@/utils/utils.js');

var config = require('@/config/config.js');

var updating = {
	value: false
};

function saveSettings(path, value, callback){
    if(updating.value) return callback(new Error('An error occurred while saving settings (1)'));

	updating.value = true;

	var settings = { ...config.settings };

	setObjectProperty(settings, path, value);

	fs.writeFile('./settings.json', JSON.stringify(settings, null, 4), function(err1) {
		if(err1) {
            loggerError(err1);

			updating.value = false;

			return callback(new Error('An error occurred while saving settings (2)'));
		}

		config.settings = require('@/settings.json');

		updating.value = false;

		callback(null);
	});
}

/* ----- CLIENT USAGE ----- */
function setMaintenance(user, socket, status, reason, secret, cooldown){
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

	pool.query('SELECT `id` FROM `maintenance` WHERE `removed` = 0', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while setting maintenance (1)'
            });

			return cooldown(false, true);
		}

		if(status && row1.length > 0) {
			emitSocketToUser(socket, 'message', 'success', {
				message: 'Maintenance is already enabled!'
			});

			return cooldown(false, true);
		} else if(!status && row1.length <= 0) {
			emitSocketToUser(socket, 'message', 'success', {
				message: 'Maintenance is already disabled!'
			});

			return cooldown(false, true);
		}

		pool.query('UPDATE `maintenance` SET `removed` = 1 WHERE `removed` = 0', function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while setting maintenance (2)'
                });

				return cooldown(false, true);
			}

			if(!status) {
				emitSocketToUser(socket, 'message', 'success', {
					message: 'Maintenance disabled!'
				});

				emitSocketToUser(socket, 'site', 'reload');

				return cooldown(false, true);
			}

			pool.query('INSERT INTO `maintenance` SET `userid` = ' + pool.escape(user.userid) + ', `reason` = ' + pool.escape(reason) + ', `time` = ' + pool.escape(time()), function(err3, row3){
				if(err3){
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while setting maintenance (3)'
                    });

					return cooldown(false, true);
				}

				emitSocketToUser(socket, 'message', 'success', {
					message: 'Maintenance enabled!'
				});

				emitSocketToUser(socket, 'site', 'reload');

				cooldown(false, false);
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function setSettings(user, socket, settings, status, secret, cooldown){
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

	var settings_allowed = [
        'server_auth_google_enable',
        'server_auth_discord_enable',

		'games_status',

        'games_games_original_roulette_enable',
        'games_games_original_crash_enable',
        'games_games_original_jackpot_enable',
        'games_games_original_coinflip_enable',
        'games_games_original_dice_enable',
        'games_games_original_tower_enable',
        'games_games_original_minesweeper_enable',
        'games_games_original_plinko_enable',

        'games_games_classic_casino_enable',

        'games_casino_real',

        'games_bots_enable_coinflip',

        'payments_status',

        'payments_manually_enable_crypto',

        'payments_methods_cash_card_enable_deposit', 'payments_methods_cash_paypal_enable_deposit',

        'payments_methods_crypto_btc_enable_deposit', 'payments_methods_crypto_eth_enable_deposit', 'payments_methods_crypto_ltc_enable_deposit', 'payments_methods_crypto_bch_enable_deposit', 'payments_methods_crypto_usdttrc20_enable_deposit', 'payments_methods_crypto_usdterc20_enable_deposit', 'payments_methods_crypto_usdtbsc_enable_deposit', 'payments_methods_crypto_usdtsol_enable_deposit', 'payments_methods_crypto_usdtmatic_enable_deposit', 'payments_methods_crypto_usdc_enable_deposit', 'payments_methods_crypto_ton_enable_deposit', 'payments_methods_crypto_trx_enable_deposit', 'payments_methods_crypto_doge_enable_deposit', 'payments_methods_crypto_xrp_enable_deposit', 'payments_methods_crypto_bnbbsc_enable_deposit', 'payments_methods_crypto_sol_enable_deposit', 'payments_methods_crypto_shibbsc_enable_deposit',
		'payments_methods_crypto_btc_enable_withdraw', 'payments_methods_crypto_eth_enable_withdraw', 'payments_methods_crypto_ltc_enable_withdraw', 'payments_methods_crypto_bch_enable_withdraw', 'payments_methods_crypto_usdttrc20_enable_withdraw', 'payments_methods_crypto_usdterc20_enable_withdraw', 'payments_methods_crypto_usdtbsc_enable_withdraw', 'payments_methods_crypto_usdtsol_enable_withdraw', 'payments_methods_crypto_usdtmatic_enable_withdraw', 'payments_methods_crypto_usdc_enable_withdraw', 'payments_methods_crypto_ton_enable_withdraw', 'payments_methods_crypto_trx_enable_withdraw', 'payments_methods_crypto_doge_enable_withdraw', 'payments_methods_crypto_xrp_enable_withdraw', 'payments_methods_crypto_bnbbsc_enable_withdraw', 'payments_methods_crypto_sol_enable_withdraw', 'payments_methods_crypto_shibbsc_enable_withdraw'

	];
	if(!settings_allowed.includes(settings)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid settings!'
		});

		return cooldown(false, true);
	}

	/* END CHECK DATA */

	var settings_copy = { ...config.settings };
	settings.split('_').forEach(function(item){ settings_copy = settings_copy[item]; });

	if(settings_copy == status){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Property already setted!'
		});

		return cooldown(false, true);
	}

	saveSettings(settings.split('_').join('..'), status, function(err1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: err1.message
            });

			return cooldown(false, true);
		}

		emitSocketToUser(socket, 'message', 'success', {
			message: 'Settings saved!'
		});

		emitSocketToUser(socket, 'admin', 'settings_apply', { settings });

		emitSocketToUser(socket, 'site', 'refresh');

		cooldown(false, false);
	});
}

/* ----- CLIENT USAGE ----- */
function setAdminAccess(user, socket, userid, secret, cooldown){
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

	pool.query('SELECT `id` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while setting admin access (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown user!'
			});

			return cooldown(false, true);
		}

		var admin_allowed = [ ...config.settings.allowed.admin ];

		if(admin_allowed.includes(userid)) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Userid already in list!'
			});

			return cooldown(false, true);
		}

		admin_allowed.push(userid);

		saveSettings('allowed..admin', admin_allowed, function(err2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: err2.message
                });

				return cooldown(false, true);
			}

			emitSocketToUser(socket, 'message', 'success', {
				message: 'Settings saved!'
			});

			emitSocketToUser(socket, 'site', 'refresh');

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function unsetAdminAccess(user, socket, userid, secret, cooldown){
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

	pool.query('SELECT `id` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while unsetting admin access (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown user!'
			});

			return cooldown(false, true);
		}

		var admin_allowed = [ ...config.settings.allowed.admin ];

		if(!admin_allowed.includes(userid)) {
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Userid not in list!'
			});

			return cooldown(false, true);
		}

		var index = admin_allowed.indexOf(userid);
		admin_allowed.splice(index, 1);

		saveSettings('allowed..admin', admin_allowed, function(err2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: err2.message
                });

				return cooldown(false, true);
			}

			emitSocketToUser(socket, 'message', 'success', {
				message: 'Settings saved!'
			});

			emitSocketToUser(socket, 'site', 'refresh');

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function createTrackingLink(user, socket, name, expire, secret, cooldown){
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

	name = name.trim();

	if(name.length < config.app.admin.tracking_links.requirements.name_length.min || name.length > config.app.admin.tracking_links.requirements.name_length.max){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid name length [' + config.app.admin.tracking_links.requirements.name_length.min + '-' + config.app.admin.tracking_links.requirements.name_length.max + ']!'
		});

		return cooldown(false, true);
	}

	expire = parseInt(expire);

	if(expire <= time() && expire != -1) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid expire date!'
		});

		return cooldown(false, true);
	}

	/* END CHECK DATA */

	var referral = generateHexCode(config.app.admin.tracking_links.requirements.code_length);

	pool.query('INSERT INTO `tracking_links` SET `userid` = ' + pool.escape(user.userid) + ', `referral` = ' + pool.escape(referral) + ', `name` = ' + pool.escape(name) + ', `expire` = ' + pool.escape(expire) + ', `time` = ' + pool.escape(time()), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while creating tracking link (1)'
            });

			return cooldown(false, true);
		}

		emitSocketToUser(socket, 'message', 'success', {
			message: 'Referral link created successfully!'
		});

		emitSocketToUser(socket, 'site', 'refresh');

		cooldown(false, false);
	});
}

/* ----- CLIENT USAGE ----- */
function removeTrackingLink(user, socket, id, secret, cooldown){
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

	pool.query('SELECT `id` FROM `tracking_links` WHERE `id` = ' + pool.escape(id) + ' AND `removed` = 0 AND (`expire` > ' + pool.escape(time()) + ' OR `expire` = -1)', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while removing tracking link (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown referral!'
			});

			return cooldown(false, true);
		}

		pool.query('UPDATE `tracking_links` SET `removed` = 1 WHERE `id` = ' + pool.escape(id) + ' AND `removed` = 0 AND (`expire` > ' + pool.escape(time()) + ' OR `expire` = -1)', function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while removing tracking link (2)'
                });

				return cooldown(false, true);
			}

			emitSocketToUser(socket, 'message', 'success', {
				message: 'Referral link removed successfully!'
			});

			emitSocketToUser(socket, 'site', 'refresh');

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function getTrackingLinks(user, socket, page, search, cooldown){
	cooldown(true, true);

	if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	/* CHECK DATA */

	if(isNaN(Number(page))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid page!'
		});

		return cooldown(false, true);
	}

	page = parseInt(page);
	search = search.trim();

	/* END CHECK DATA */

	pool.query('SELECT COUNT(*) AS `count` FROM `tracking_links` WHERE `referral` LIKE ' + pool.escape('%' + search + '%') + ' AND `removed` = 0 AND (`expire` > ' + pool.escape(time()) + ' OR `expire` = -1)', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting tracking link (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'admin_tracking_links', {
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

		pool.query('SELECT `id`, `userid`, `referral`, `name` FROM `tracking_links` WHERE `referral` LIKE ' + pool.escape('%' + search + '%') + ' AND `removed` = 0 AND (`expire` > ' + pool.escape(time()) + ' OR `expire` = -1) ORDER BY `id` ASC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting tracking link (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(a => ({
				id: a.id,
				userid: a.userid,
				referral: a.referral,
				name: a.name,
				link: config.app.url + '?ref=' + a.referral
			}));

			emitSocketToUser(socket, 'pagination', 'admin_tracking_links', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

module.exports = {
	updating,
    saveSettings,
	setMaintenance,
    setSettings,
	setAdminAccess, unsetAdminAccess,
	createTrackingLink, removeTrackingLink, getTrackingLinks
};