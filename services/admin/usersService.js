var { pool } = require('@/lib/database.js');

var userService = require('@/services/userService.js');

var { makeDate, time } = require('@/utils/formatDate.js');
var { getFormatAmount, getFormatAmountString, verifyFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');
var { getUserInfo } = require('@/utils/user.js');

var config = require('@/config/config.js');

/* ----- CLIENT USAGE ----- */
function getUsers(user, socket, page, order, search, cooldown){
	cooldown(true, true);

	if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	/* CHECK DATA */

	var order_allowed = [ 0, 1, 2, 3, 4, 5 ];
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

	pool.query('SELECT `userid` FROM `users_logins` WHERE `ip` = ' + pool.escape(search) + ' GROUP BY `userid`', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting users (1)'
            });

			return cooldown(false, true);
		}

		var userids = row1.map(a => '"' + a.userid + '"').join(',') || 'null';

		pool.query('SELECT COUNT(*) AS `count` FROM `users` WHERE `bot` = 0 AND (`userid` LIKE ' + pool.escape('%' + search + '%') + ' OR `email` LIKE ' + pool.escape('%' + search + '%') + ' OR `name` LIKE ' + pool.escape('%' + search + '%') + ' OR `userid` IN (' + userids + '))', function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting users (2)'
                });

				return cooldown(false, true);
			}

			var pages = Math.ceil(row2[0].count / 10);

			if(pages <= 0){
				emitSocketToUser(socket, 'pagination', 'admin_users', {
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
				0: 'ORDER BY `time_create` ASC',
				1: 'ORDER BY `name` ASC',
				2: 'ORDER BY `name` DESC',
				3: 'ORDER BY `balance` ASC',
				4: 'ORDER BY `balance` DESC',
				5: 'ORDER BY `rank` DESC'
			}[order];

			pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `balance`, `rank`, `time_create` FROM `users` WHERE `bot` = 0 AND (`userid` LIKE ' + pool.escape('%' + search + '%') + ' OR `email` LIKE ' + pool.escape('%' + search + '%') + ' OR `name` LIKE ' + pool.escape('%' + search + '%') + ' OR `userid` IN (' + userids + ')) ' + order_query + ' LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err3, row3){
				if(err3){
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while getting users (3)'
                    });

					return cooldown(false, true);
				}

				var list = row3.map(a => ({
					user: getUserInfo({
                        userid: a.userid,
                        name: a.name,
                        avatar: a.avatar,
                        xp: parseInt(a.xp),
                        anonymous: 0
                    }),
					balance: getFormatAmountString(a.balance),
					rank: config.app.ranks[a.rank],
					created: makeDate(new Date(a.time_create * 1000))
				}));

				emitSocketToUser(socket, 'pagination', 'admin_users', {
					list: list,
					pages: pages,
					page: page
				});

				cooldown(false, false);
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function removeUserLink(user, socket, userid, provider, secret, cooldown){
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

    if(config.settings.server.auth[provider] === undefined) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid provider!'
		});

		return cooldown(false, true);
	}

	/* END CHECK DATA */

	pool.query('SELECT `id` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while removing user link (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown user!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id` FROM `users_links` WHERE `userid` = ' + pool.escape(userid) + ' AND `provider` = ' + pool.escape(provider) + ' AND `removed` = 0', function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while removing user link (2)'
                });

				return cooldown(false, true);
			}

			if(row2.length <= 0){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'User not linked with ' + provider + '!'
				});

				return cooldown(false, true);
			}

			pool.query('UPDATE `users_links` SET `removed` = 1 WHERE `userid` = ' + pool.escape(userid) + ' AND `provider` = ' + pool.escape(provider), function(err3){
				if(err3){
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while removing user link (3)'
                    });

					return cooldown(false, true);
				}

				emitSocketToUser(socket, 'message', 'success', {
					message: 'Account link removed!'
				});

				emitSocketToUser(socket, 'site', 'refresh');

				cooldown(false, false);
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function removeUserExclusion(user, socket, userid, secret, cooldown){
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

	pool.query('SELECT `exclusion` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while removing user exclusion (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown user!'
			});

			return cooldown(false, true);
		}

		if(row1[0].exclusion <= time()){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'User have no exclusion!'
			});

			return cooldown(false, true);
		}

		pool.query('UPDATE `users` SET `exclusion` = 0 WHERE `userid` = ' + pool.escape(userid), function(err2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while removing user exclusion (2)'
                });

				return cooldown(false, true);
			}

			emitSocketToUser(socket, 'message', 'success', {
				message: 'Exclusion removed!'
			});

			emitSocketToUser(socket, 'site', 'refresh');

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function removeUserSessions(user, socket, userid, secret, cooldown){
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
                message: 'An error occurred while removing user sessions (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown user!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id` FROM `users_sessions` WHERE `userid` = ' + pool.escape(userid) + ' AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while removing user sessions (2)'
                });

				return cooldown(false, true);
			}

			if(row2.length <= 0){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'User have no active sessions!'
				});

				return cooldown(false, true);
			}

			pool.query('UPDATE `users_sessions` SET `removed` = 1 WHERE `userid` = ' + pool.escape(userid) + ' AND `removed` = 0 AND `expire` > ' + pool.escape(time()), function(err3){
				if(err3){
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while removing user sessions (3)'
                    });

					return cooldown(false, true);
				}

				emitSocketToUser(socket, 'message', 'success', {
					message: 'Sessions successfully removed. User has been disconnected!'
				});

				emitSocketToUser(socket, 'site', 'refresh');

				cooldown(false, false);
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function banUserIp(user, socket, userid, ip, secret, cooldown){
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
                message: 'An error occurred while banning user ip (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown user!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id` FROM `users_logins` WHERE `userid` = ' + pool.escape(userid) + ' AND `ip` = ' + pool.escape(ip), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while banning user ip (2)'
                });

				return cooldown(false, true);
			}

			if(row2.length <= 0){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'Unknown ip!'
				});

				return cooldown(false, true);
			}

			pool.query('SELECT `id` FROM `bannedip` WHERE `ip` = ' + pool.escape(ip) + ' AND `removed` = 0', function(err3, row3){
				if(err3){
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while banning user ip (3)'
                    });

					return cooldown(false, true);
				}

				if(row3.length > 0){
					emitSocketToUser(socket, 'message', 'error', {
						message: 'Ip already banned!'
					});

					return cooldown(false, true);
				}

				pool.query('INSERT INTO `bannedip` SET `ip` = ' + pool.escape(ip) + ', `userid` = ' + pool.escape(user.userid) + ', `time` = ' + pool.escape(time()), function(err4){
					if(err4){
						emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while banning user ip (4)'
                        });

						return cooldown(false, true);
					}

					emitSocketToUser(socket, 'message', 'success', {
						message: 'IP banned successfully!'
					});

					emitSocketToUser(socket, 'site', 'refresh');

					cooldown(false, false);
				});
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function unbanUserIp(user, socket, userid, ip, secret, cooldown){
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
                message: 'An error occurred while unbanning user ip (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown user!'
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `id` FROM `users_logins` WHERE `userid` = ' + pool.escape(userid) + ' AND `ip` = ' + pool.escape(ip), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while unbanning user ip (2)'
                });

				return cooldown(false, true);
			}

			if(row2.length <= 0){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'Unknown user ip!'
				});

				return cooldown(false, true);
			}

			pool.query('SELECT `id` FROM `bannedip` WHERE `ip` = ' + pool.escape(ip) + ' AND `removed` = 0', function(err3, row3){
				if(err3){
					emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while unbanning user ip (3)'
                    });

					return cooldown(false, true);
				}

				if(row3.length <= 0){
					emitSocketToUser(socket, 'message', 'error', {
						message: 'Ip not banned!'
					});

					return cooldown(false, true);
				}

				pool.query('UPDATE `bannedip` SET `removed` = 1 WHERE `ip` = ' + pool.escape(ip) + ' AND `removed` = 0', function(err4){
					if(err4){
						emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while unbanning user ip (4)'
                        });

						return cooldown(false, true);
					}

					emitSocketToUser(socket, 'message', 'success', {
						message: 'IP unbanned successfully!'
					});

					emitSocketToUser(socket, 'site', 'refresh');

					cooldown(false, false);
				});
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function setUserRank(user, socket, userid, rank, secret, cooldown){
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

	var allowed_ranks = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 100 ];
	if(!allowed_ranks.includes(rank)) {
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid rank!'
		});

		return cooldown(false, true);
	}

	/* END CHECK DATA */

	pool.query('SELECT `rank` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while setting user rank (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown user!'
			});

			return cooldown(false, true);
		}

		if(row1[0].rank == rank){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'User have already this rank!'
			});

			return cooldown(false, true);
		}

		pool.query('UPDATE `users` SET `rank` = ' + pool.escape(rank) + ' WHERE `userid` = ' + pool.escape(userid), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while setting user rank (2)'
                });

				return cooldown(false, true);
			}

			emitSocketToUser(socket, 'message', 'success', {
				message: 'Rank setted!'
			});

			emitSocketToUser(socket, 'site', 'refresh');

			cooldown(false, false);
		});
	});
}

/* ----- CLIENT USAGE ----- */
function editUserBalance(user, socket, userid, amount, secret, cooldown){
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

	verifyFormatAmount(amount, function(err1, amount){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
				message: err1.message
			});

			return cooldown(false, true);
		}

		pool.query('SELECT `name`, `balance` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while editing user balance (1)'
                });

				return cooldown(false, true);
			}

			if(row2.length <= 0){
				emitSocketToUser(socket, 'message', 'error', {
					message: 'Unknown user!'
				});

				return cooldown(false, true);
			}

			if(getFormatAmount(row2[0].balance) + amount < 0) amount = -getFormatAmount(row2[0].balance);

			//EDIT BALANCE
			userService.editBalance(userid, amount, 'change_balance', function(err3, newbalance){
				if(err3) {
					emitSocketToUser(socket, 'message', 'error', {
                        message: err3.message
                    });

					return cooldown(false, true);
				}

				emitSocketToRoom(userid, 'message', 'info', {
					message: 'You got ' + getFormatAmountString(amount) + ' coins from ' + user.name + '!'
				});

				emitSocketToUser(socket, 'message', 'info', {
					message: 'You gave ' + getFormatAmountString(amount) + ' coins to ' + row2[0].name + '.'
				});

				userService.updateBalance(userid, 'main', newbalance);

				emitSocketToUser(socket, 'site', 'refresh');

				cooldown(false, false);
			});
		});
	});
}

/* ----- CLIENT USAGE ----- */
function setUserRestriction(user, socket, userid, restriction, reason, expire, secret, cooldown){
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

	userService.setRestrictionAccount(user, socket, {
		userid: userid,
		restriction: restriction,
		reason: reason,
		expire: expire
	}, true, function(err1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
				message: err1.message
			});

			return cooldown(false, true);
		}

		emitSocketToUser(socket, 'message', 'success', {
			message: 'The user was successfully restricted!'
		});

		emitSocketToUser(socket, 'site', 'refresh');

		cooldown(false, false);
	});
}

/* ----- CLIENT USAGE ----- */
function unsetUserRestriction(user, socket, userid, restriction, secret, cooldown){
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

	userService.unsetRestrictionAccount(user, socket, {
		userid: userid,
		restriction: restriction
	}, function(err1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
				message: err1.message
			});

			return cooldown(false, true);
		}

		emitSocketToUser(socket, 'message', 'success', {
			message: 'The user was successfully unrestricted!'
		});

		emitSocketToUser(socket, 'site', 'refresh');

		cooldown(false, false);
	});
}

module.exports = {
	getUsers,
    removeUserLink,
    removeUserExclusion,
    removeUserSessions,
    banUserIp, unbanUserIp,
    setUserRank,
    editUserBalance,
    setUserRestriction, unsetUserRestriction
};