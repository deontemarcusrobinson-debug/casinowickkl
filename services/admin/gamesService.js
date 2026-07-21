var { pool } = require('@/lib/database.js');
var { uuid } = require('@/lib/uuid.js');

var settingsService = require('@/services/admin/settingsService.js');

var coinflipService = require('@/services/games/coinflipService.js');

var { makeDate, time } = require('@/utils/formatDate.js');
var { getFormatAmount, getFormatAmountString } = require('@/utils/formatAmount.js');
var { emitSocketToUser } = require('@/utils/socket.js');
var { getUserInfo } = require('@/utils/user.js');
var { haveRankPermission, generateHexCode, getRandomInt } = require('@/utils/utils.js');

var config = require('@/config/config.js');

function setGamesHouseEdges(user, socket, house_edges, secret, cooldown){
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

    for(var i = 0; i < house_edges.length; i++){
        if(!Object.keys(config.settings.games.games.original).includes(house_edges[i].game)){
            emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid game!'
			});

			return cooldown(false, true);
        }

        if(house_edges[i].value < 0 || house_edges[i].value > 100){
            emitSocketToUser(socket, 'message', 'error', {
				message: 'The amount must have a percentage!'
			});

			return cooldown(false, true);
        }

        if(config.settings.games.games.original[house_edges[i].game].house_edge.fixed && parseFloat(house_edges[i].value) != config.settings.games.games.original[house_edges[i].game].house_edge.value){
            emitSocketToUser(socket, 'message', 'error', {
				message: 'The ' + house_edges[i].game + ' game have a fixed house edge and cannot be modified!'
			});

			return cooldown(false, true);
        }
    }

	/* END CHECK DATA */

    iterate(0, function(err1){
        if(err1){
            emitSocketToUser(socket, 'message', 'error', {
                message: err1.message
            });

            return cooldown(false, true);
        }

        emitSocketToUser(socket, 'message', 'success', {
            message: 'House edges saved!'
        });

        emitSocketToUser(socket, 'site', 'refresh');

        cooldown(false, false);
    })

    function iterate(index, callback){
        if(index >= house_edges.length) return callback(null);

        if(parseFloat(house_edges[index].value) == config.settings.games.games.original[house_edges[index].game].house_edge.value) return iterate(index + 1, callback);

        settingsService.saveSettings('games..games..original..' + house_edges[index].game + '..house_edge..value', parseFloat(house_edges[index].value), function(err1){
            if(err1) return callback(err1);

            iterate(index + 1, callback);
		});
    }
}

/* ----- CLIENT USAGE ----- */
function confirmGameBot(user, socket, userid, game, data, cooldown){
	cooldown(true, true);

	/* CHECK DATA */

	var allowed_games = [
        'coinflip'
    ];

	if(!allowed_games.includes(game)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid game!'
		});

		return cooldown(false, true);
	}

	/* END CHECK DATA */

	if(!config.settings.games.bots.enable[game] && !haveRankPermission('call_gamebots', user.rank)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Calling bots for this game are disabled. Please try again later!'
		});

		return cooldown(false, true);
	}

    if(game == 'coinflip'){
		continueGameBotCoinflip(userid, parseInt(data.id), function(err1, bot){
			if(err1){
				emitSocketToUser(socket, 'message', 'error', {
					message: err1.message
				});

				return cooldown(false, true);
			}

			emitSocketToUser(socket, 'message', 'success', {
				message: bot.name + ' successfully called in your coinflip!'
			});

			cooldown(false, false);
		});
	}

}

/* ----- INTERNAL USAGE ----- */
function continueGameBotCoinflip(userid, id, callback){
	if(isNaN(Number(id))) return callback(new Error('Invalid game. Please join in a valid game!'));

	if(coinflipService.games[id] === undefined) return callback(new Error('Invalid game. Please join in a valid game!'));
	if(coinflipService.games[id]['status'] != 0) return callback(new Error('This game are already ended!'));

	if(Object.keys(coinflipService.secure[id]).length > 0) return callback(new Error('Another user are trying to join in this game. Please try again later!'));

	var amount = getFormatAmount(coinflipService.games[id]['amount']);

	pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `anonymous`, `balance` FROM `users` WHERE `bot` = 1', function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while continuing game bot coinflip (1)'));

		var bots = [];

		row1.forEach(function(item){
			var available = true;

			if(getFormatAmount(item.balance) < amount) available = false;
			if(coinflipService.games[id].players.filter(a => a.user.userid == item.userid).length > 0) available = false;

			if(available){
				bots.push({
					userid: item.userid,
					name: item.name,
					avatar: item.avatar,
					xp: parseInt(item.xp),
					anonymous: parseInt(item.anonymous),
					bot: 1
				});
			}
		});

		if(bots.length <= 0) return callback(new Error('No available bots to join coinflip!'));

		var bot = bots[getRandomInt(0, bots.length - 1)];

		coinflipService.secure[id][bot.userid] = true;

		coinflipService.confirmJoinGame(bot, id, function(err2){
			if(err2) return callback(err2);

			if(coinflipService.secure[id] !== undefined) if(coinflipService.secure[id][bot.userid] !== undefined) delete coinflipService.secure[id][bot.userid];

			callback(null, getUserInfo({
				userid: bot.userid,
				name: bot.name,
				avatar: bot.avatar,
				xp: bot.xp,
				anonymous: bot.anonymous
			}));
		});
	});
}

/* ----- CLIENT USAGE ----- */
function createGameBot(user, socket, name, secret, cooldown){
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

	if(name.length < config.app.admin.gamebots.requirements.name_length.min || name.length > config.app.admin.gamebots.requirements.name_length.max){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid code length [' + config.app.admin.gamebots.requirements.name_length.min + '-' + config.app.admin.gamebots.requirements.name_length.max + ']!'
		});

		return cooldown(false, true);
	}

	/* END CHECK DATA */

	var userid = uuid.uuidv4();

	name = 'Bot ' + name;

	var avatar = config.app.url + '/img/avatar.jpg';

	pool.query('INSERT INTO `users` SET `bot` = 1, `userid` = ' + pool.escape(userid) + ', `name` = ' + pool.escape(name) + ', `avatar` = ' + pool.escape(avatar) + ', `time_create` = ' + pool.escape(time()), function(err1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while creating game bot (1)'
            });

			return cooldown(false, true);
		}

        pool.query('INSERT INTO `users_history` SET `userid` = ' + pool.escape(userid) + ', `change` = ' + pool.escape('name') + ', `value` = ' + pool.escape(name) + ', `time` = ' + pool.escape(time()), function(err3){
            if(err3){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while creating game bot (2)'
                });

                return cooldown(false, true);
            }

            pool.query('INSERT INTO `users_history` SET `userid` = ' + pool.escape(userid) + ', `change` = ' + pool.escape('avatar') + ', `value` = ' + pool.escape(avatar) + ', `time` = ' + pool.escape(time()), function(err4){
                if(err4){
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while creating game bot (3)'
                    });

                    return cooldown(false, true);
                }

                var client_seed = generateHexCode(32);
                var server_seed = generateHexCode(64);

                pool.query('INSERT INTO `users_client_seeds` SET `userid` = ' + pool.escape(userid) + ', `seed` = ' + pool.escape(client_seed) + ', `time` = ' + pool.escape(time()), function(err5){
                    if(err5){
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while creating game bot (4)'
                        });

                        return cooldown(false, true);
                    }

                    pool.query('INSERT INTO `users_server_seeds` SET `userid` = ' + pool.escape(userid) + ', `seed` = ' + pool.escape(server_seed) + ', `time` = ' + pool.escape(time()), function(err6){
                        if(err6){
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while creating game bot (5)'
                            });

                            return cooldown(false, true);
                        }

                        emitSocketToUser(socket, 'message', 'success', {
                            message: 'Game bot created successfully!'
                        });

                        emitSocketToUser(socket, 'site', 'refresh');

                        cooldown(false, false);
                    });
                });
            });
        });
	});
}

/* ----- CLIENT USAGE ----- */
function getGameBots(user, socket, page, order, search, cooldown){
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

	pool.query('SELECT COUNT(*) AS `count` FROM `users` WHERE `bot` = 1 AND (`userid` LIKE ' + pool.escape('%' + search + '%') + ' OR `name` LIKE ' + pool.escape('%' + search + '%') + ')', function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting game bots (1)'
            });

			return cooldown(false, true);
		}

		var pages = Math.ceil(row1[0].count / 10);

		if(pages <= 0){
			emitSocketToUser(socket, 'pagination', 'admin_gamebots', {
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
			4: 'ORDER BY `balance` DESC'
		}[order];

		pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `balance`, `time_create` FROM `users` WHERE `bot` = 1 AND (`userid` LIKE ' + pool.escape('%' + search + '%') + ' OR `name` LIKE ' + pool.escape('%' + search + '%') + ') ' + order_query + ' LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
			if(err2){
				emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting game bots (2)'
                });

				return cooldown(false, true);
			}

			var list = row2.map(a => ({
				user: getUserInfo({
					userid: a.userid,
					name: a.name,
					avatar: a.avatar,
					xp: parseInt(a.xp),
					anonymous: 0
				}),
				balance: getFormatAmountString(a.balance),
				created: makeDate(new Date(a.time_create * 1000))
			}));

			emitSocketToUser(socket, 'pagination', 'admin_gamebots', {
				list: list,
				pages: pages,
				page: page
			});

			cooldown(false, false);
		});
	});
}

module.exports = {
	setGamesHouseEdges,
    confirmGameBot, createGameBot, getGameBots
};