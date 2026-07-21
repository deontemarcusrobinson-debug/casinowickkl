var { pool } = require('@/lib/database.js');

var { getFetchDate } = require('@/utils/dashboard.js');
var { roundedToFixed, getFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser } = require('@/utils/socket.js');

var config = require('@/config/config.js');

var graphsQueue = {
	queue: [],
	loading: false
};

var statsQueue = {
	queue: [],
	loading: false
};

/* ----- CLIENT USAGE ----- */
function getAllStats(user, socket, stats, cooldown){
	cooldown(true, true);

	if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	stats.forEach(function(item){
		processStats(socket, item);
	});

	cooldown(false, false);
}

/* ----- INTERNAL USAGE ----- */
function processStats(socket, stats){
	var stats_allowed = [
		'users_registed', 'users_online', 'guests_online',
		'support_closed', 'support_opened',

		'total_bets', 'total_winnings', 'total_profit', 'count_games',

        'roulette_total_bets', 'roulette_total_winnings', 'roulette_total_profit', 'roulette_count_games',
        'crash_total_bets', 'crash_total_winnings', 'crash_total_profit', 'crash_count_games',
        'jackpot_total_bets', 'jackpot_total_winnings', 'jackpot_total_profit', 'jackpot_count_games',
        'coinflip_total_bets', 'coinflip_total_winnings', 'coinflip_total_profit', 'coinflip_count_games',
        'dice_total_bets', 'dice_total_winnings', 'dice_total_profit', 'dice_count_games',
        'minesweeper_total_bets', 'minesweeper_total_winnings', 'minesweeper_total_profit', 'minesweeper_count_games',
        'tower_total_bets', 'tower_total_winnings', 'tower_total_profit', 'tower_count_games',
        'plinko_total_bets', 'plinko_total_winnings', 'plinko_total_profit', 'plinko_count_games',

        'casino_total_bets', 'casino_total_winnings', 'casino_total_profit', 'casino_count_games',

		'total_deposits', 'count_deposits', 'transactions_profit',
        'total_withdrawals', 'count_withdrawals',

		'total_manual_deposits', 'count_manual_deposits', 'total_manual_withdrawals', 'count_manual_withdrawals',

        'total_cash_deposits', 'count_cash_deposits',

        'total_crypto_deposits', 'count_crypto_deposits', 'total_crypto_withdrawals', 'count_crypto_withdrawals'

	];

	if(!stats_allowed.includes(stats)){
		return emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid stats!'
		});
	}

	if(statsQueue.loading) return statsQueue.queue.push({ socket, stats });

	sendStats({ socket, stats });
}

/* ----- INTERNAL USAGE ----- */
function sendStats(item){
	statsQueue.loading = true;

	finishStats(item, function(err1, data){
        if(err1){
            return emitSocketToUser(item.socket, 'message', 'error', {
                message: err1.message
            });
        }

		emitSocketToUser(item.socket, 'dashboard', 'stats', {
			data: data,
			stats: item.stats
		});

		if(statsQueue.queue.length > 0){
			var first = statsQueue.queue[0];

			statsQueue.queue.shift();

			return sendStats(first);
		}

		statsQueue.loading = false;
	});
}

/* ----- INTERNAL USAGE ----- */
function loadStats(item, callback){
	if(item.stats == 'users_registed') var query = 'SELECT COUNT(*) AS `users` FROM `users`';
	else if(item.stats == 'users_online') return callback(null, {
		online: Array.from(item.socket.server.sockets.sockets.values()).filter(a => a.data.user).filter((value, index, self) => self.findIndex(a => a.data.user.userid == value.data.user.userid) == index).length
	});
    else if(item.stats == 'guests_online') return callback(null, {
		online: Array.from(item.socket.server.sockets.sockets.values()).filter(a => !a.data.user).length
	});
    else if(item.stats == 'support_closed') var query = 'SELECT COUNT(*) AS `count` FROM `support_requests` WHERE `closed` = 1';
	else if(item.stats == 'support_opened') var query = 'SELECT COUNT(*) AS `count` FROM `support_requests` WHERE `closed` = 0';

	else if(item.stats == 'total_bets') {
        var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM (' + [
            'SELECT COALESCE(SUM(amount), 0) AS `amount` FROM `users_transactions` WHERE `amount` < 0 AND (' + [ ...Object.keys(config.settings.games.games.original), ...Object.keys(config.settings.games.games.classic) ].map(a => '`transaction` LIKE "' + a + '_%"').join(' OR ') + ')'
        ].join(' UNION ALL ') + ') AS `table`';
    } else if(item.stats == 'total_winnings') {
        var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM (' + [
            'SELECT COALESCE(SUM(amount), 0) AS `amount` FROM `users_transactions` WHERE `amount` >= 0 AND (' + [ ...Object.keys(config.settings.games.games.original), ...Object.keys(config.settings.games.games.classic) ].map(a => '`transaction` LIKE "' + a + '_%"').join(' OR ') + ')'
        ].join(' UNION ALL ') + ') AS `table`';
    } else if(item.stats == 'total_profit') {
        var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM (' + [
            'SELECT COALESCE(SUM(amount), 0) AS `amount` FROM `users_transactions` WHERE (' + [ ...Object.keys(config.settings.games.games.original), ...Object.keys(config.settings.games.games.classic) ].map(a => '`transaction` LIKE "' + a + '_%"').join(' OR ') + ')'
        ].join(' UNION ALL ') + ') AS `table`';
    } else if(item.stats == 'count_games') {
		var query = 'SELECT COALESCE(SUM(total), 0) AS `total` FROM (' + [
            'SELECT COUNT(*) AS `total` FROM `roulette_bets`',
            'SELECT COUNT(*) AS `total` FROM `crash_bets`',
            'SELECT COUNT(*) AS `total` FROM `jackpot_games` WHERE `ended` = 1',
            'SELECT COUNT(*) AS `total` FROM `coinflip_games` WHERE `ended` = 1 AND `canceled` = 0',
            'SELECT COUNT(*) AS `total` FROM `dice_bets`',
            'SELECT COUNT(*) AS `total` FROM `minesweeper_bets` WHERE `ended` = 1',
            'SELECT COUNT(*) AS `total` FROM `tower_bets` WHERE `ended` = 1',
            'SELECT COUNT(*) AS `total` FROM `plinko_bets`',
            'SELECT COUNT(*) AS `total` FROM `casino_bets` WHERE `refunded` = 0'
        ].join(' UNION ALL ') + ') AS `table`';
	}

    else if(item.stats == 'roulette_total_bets') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` < 0 AND `transaction` LIKE "roulette_%"';
	else if(item.stats == 'roulette_total_winnings') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` >= 0 AND `transaction` LIKE "roulette_%"';
	else if(item.stats == 'roulette_total_profit') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `transaction` LIKE "roulette_%"';
	else if(item.stats == 'roulette_count_games') var query = 'SELECT COUNT(*) AS `total` FROM `roulette_bets`';

    else if(item.stats == 'crash_total_bets') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` < 0 AND `transaction` LIKE "crash_%"';
	else if(item.stats == 'crash_total_winnings') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` >= 0 AND `transaction` LIKE "crash_%"';
	else if(item.stats == 'crash_total_profit') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `transaction` LIKE "crash_%"';
	else if(item.stats == 'crash_count_games') var query = 'SELECT COUNT(*) AS `total` FROM `crash_bets`';

    else if(item.stats == 'jackpot_total_bets') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` < 0 AND `transaction` LIKE "jackpot_%"';
	else if(item.stats == 'jackpot_total_winnings') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` >= 0 AND `transaction` LIKE "jackpot_%"';
	else if(item.stats == 'jackpot_total_profit') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `transaction` LIKE "jackpot_%"';
	else if(item.stats == 'jackpot_count_games') var query = 'SELECT COUNT(*) AS `total` FROM `jackpot_games` WHERE `ended` = 1';

    else if(item.stats == 'coinflip_total_bets') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` < 0 AND `transaction` LIKE "coinflip_%"';
	else if(item.stats == 'coinflip_total_winnings') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` >= 0 AND `transaction` LIKE "coinflip_%"';
	else if(item.stats == 'coinflip_total_profit') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `transaction` LIKE "coinflip_%"';
	else if(item.stats == 'coinflip_count_games') var query = 'SELECT COUNT(*) AS `total` FROM `coinflip_games` WHERE `ended` = 1 AND `canceled` = 0';

    else if(item.stats == 'dice_total_bets') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` < 0 AND `transaction` LIKE "dice_%"';
	else if(item.stats == 'dice_total_winnings') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` >= 0 AND `transaction` LIKE "dice_%"';
	else if(item.stats == 'dice_total_profit') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `transaction` LIKE "dice_%"';
	else if(item.stats == 'dice_count_games') var query = 'SELECT COUNT(*) AS `total` FROM `dice_bets`';

    else if(item.stats == 'minesweeper_total_bets') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` < 0 AND `transaction` LIKE "minesweeper_%"';
	else if(item.stats == 'minesweeper_total_winnings') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` >= 0 AND `transaction` LIKE "minesweeper_%"';
	else if(item.stats == 'minesweeper_total_profit') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `transaction` LIKE "minesweeper_%"';
	else if(item.stats == 'minesweeper_count_games') var query = 'SELECT COUNT(*) AS `total` FROM `minesweeper_bets` WHERE `ended` = 1';

    else if(item.stats == 'tower_total_bets') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` < 0 AND `transaction` LIKE "tower_%"';
	else if(item.stats == 'tower_total_winnings') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` >= 0 AND `transaction` LIKE "tower_%"';
	else if(item.stats == 'tower_total_profit') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `transaction` LIKE "tower_%"';
	else if(item.stats == 'tower_count_games') var query = 'SELECT COUNT(*) AS `total` FROM `tower_bets` WHERE `ended` = 1';

    else if(item.stats == 'plinko_total_bets') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` < 0 AND `transaction` LIKE "plinko_%"';
	else if(item.stats == 'plinko_total_winnings') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` >= 0 AND `transaction` LIKE "plinko_%"';
	else if(item.stats == 'plinko_total_profit') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `transaction` LIKE "plinko_%"';
	else if(item.stats == 'plinko_count_games') var query = 'SELECT COUNT(*) AS `total` FROM `plinko_bets`';

    else if(item.stats == 'casino_total_bets') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` < 0 AND `transaction` LIKE "casino_%"';
	else if(item.stats == 'casino_total_winnings') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `amount` >= 0 AND `transaction` LIKE "casino_%"';
	else if(item.stats == 'casino_total_profit') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_transactions` WHERE `transaction` LIKE "casino_%"';
	else if(item.stats == 'casino_count_games') var query = 'SELECT COUNT(*) AS `total` FROM `casino_bets` WHERE `refunded` = 0';

	else if(item.stats == 'total_manual_deposits') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("manual");
	else if(item.stats == 'count_manual_deposits') var query = 'SELECT COUNT(*) AS `count` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("manual");
	else if(item.stats == 'total_manual_withdrawals') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw") + ' AND `method` = ' + pool.escape("manual");
	else if(item.stats == 'count_manual_withdrawals') var query = 'SELECT COUNT(*) AS `count` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw") + ' AND `method` = ' + pool.escape("manual");

    else if(item.stats == 'total_cash_deposits') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("cash");
	else if(item.stats == 'count_cash_deposits') var query = 'SELECT COUNT(*) AS `count` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("cash");

    else if(item.stats == 'total_crypto_deposits') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("crypto");
	else if(item.stats == 'count_crypto_deposits') var query = 'SELECT COUNT(*) AS `count` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("crypto");
	else if(item.stats == 'total_crypto_withdrawals') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw") + ' AND `method` = ' + pool.escape("crypto");
	else if(item.stats == 'count_crypto_withdrawals') var query = 'SELECT COUNT(*) AS `count` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw") + ' AND `method` = ' + pool.escape("crypto");

	else if(item.stats == 'total_deposits') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit");
	else if(item.stats == 'count_deposits') var query = 'SELECT COUNT(*) AS `count` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit");
	else if(item.stats == 'transactions_profit') var query = 'SELECT ((SELECT COALESCE(SUM(amount), 0) FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ') - (SELECT COALESCE(SUM(amount), 0) FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw") + ')) AS `total`';
    else if(item.stats == 'total_withdrawals') var query = 'SELECT COALESCE(SUM(amount), 0) AS `total` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw");
	else if(item.stats == 'count_withdrawals') var query = 'SELECT COUNT(*) AS `count` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw");

	pool.query(query, function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while loading stats (1)'));

		callback(null, row1);
	});
}

/* ----- INTERNAL USAGE ----- */
function finishStats(item, callback){
	loadStats(item, function(err1, data){
		if(err1) return callback(err1);

		var result = '0';

	    if(item.stats == 'users_registed') result = data[0].users;
		else if(item.stats == 'users_online') result = data.online;
		else if(item.stats == 'guests_online') result = data.online;
		else if(item.stats == 'support_closed') result = data[0].count;
		else if(item.stats == 'support_opened') result = data[0].count;

		else if(item.stats == 'total_bets') result = roundedToFixed(-data[0].total, 2).toFixed(2);
		else if(item.stats == 'total_winnings') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'total_profit') result = (-roundedToFixed(data[0].total, 2)).toFixed(2);
		else if(item.stats == 'count_games') result = data[0].total;

        else if(item.stats == 'roulette_total_bets') result = roundedToFixed(-data[0].total, 2).toFixed(2);
		else if(item.stats == 'roulette_total_winnings') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'roulette_total_profit') result = (-roundedToFixed(data[0].total, 2)).toFixed(2);
		else if(item.stats == 'roulette_count_games') result = data[0].total;

        else if(item.stats == 'crash_total_bets') result = roundedToFixed(-data[0].total, 2).toFixed(2);
		else if(item.stats == 'crash_total_winnings') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'crash_total_profit') result = (-roundedToFixed(data[0].total, 2)).toFixed(2);
		else if(item.stats == 'crash_count_games') result = data[0].total;

        else if(item.stats == 'jackpot_total_bets') result = roundedToFixed(-data[0].total, 2).toFixed(2);
		else if(item.stats == 'jackpot_total_winnings') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'jackpot_total_profit') result = (-roundedToFixed(data[0].total, 2)).toFixed(2);
		else if(item.stats == 'jackpot_count_games') result = data[0].total;

        else if(item.stats == 'coinflip_total_bets') result = roundedToFixed(-data[0].total, 2).toFixed(2);
		else if(item.stats == 'coinflip_total_winnings') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'coinflip_total_profit') result = (-roundedToFixed(data[0].total, 2)).toFixed(2);
		else if(item.stats == 'coinflip_count_games') result = data[0].total;

        else if(item.stats == 'dice_total_bets') result = roundedToFixed(-data[0].total, 2).toFixed(2);
		else if(item.stats == 'dice_total_winnings') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'dice_total_profit') result = (-roundedToFixed(data[0].total, 2)).toFixed(2);
		else if(item.stats == 'dice_count_games') result = data[0].total;

        else if(item.stats == 'minesweeper_total_bets') result = roundedToFixed(-data[0].total, 2).toFixed(2);
		else if(item.stats == 'minesweeper_total_winnings') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'minesweeper_total_profit') result = (-roundedToFixed(data[0].total, 2)).toFixed(2);
		else if(item.stats == 'minesweeper_count_games') result = data[0].total;

        else if(item.stats == 'tower_total_bets') result = roundedToFixed(-data[0].total, 2).toFixed(2);
		else if(item.stats == 'tower_total_winnings') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'tower_total_profit') result = (-roundedToFixed(data[0].total, 2)).toFixed(2);
		else if(item.stats == 'tower_count_games') result = data[0].total;

        else if(item.stats == 'plinko_total_bets') result = roundedToFixed(-data[0].total, 2).toFixed(2);
		else if(item.stats == 'plinko_total_winnings') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'plinko_total_profit') result = (-roundedToFixed(data[0].total, 2)).toFixed(2);
		else if(item.stats == 'plinko_count_games') result = data[0].total;

        else if(item.stats == 'casino_total_bets') result = roundedToFixed(-data[0].total, 2).toFixed(2);
		else if(item.stats == 'casino_total_winnings') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'casino_total_profit') result = (-roundedToFixed(data[0].total, 2)).toFixed(2);
		else if(item.stats == 'casino_count_games') result = data[0].total;

		else if(item.stats == 'total_deposits') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'count_deposits') result = data[0].count;
		else if(item.stats == 'transactions_profit') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'total_withdrawals') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'count_withdrawals') result = data[0].count;

		else if(item.stats == 'total_manual_deposits') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'count_manual_deposits') result = data[0].count;
		else if(item.stats == 'total_manual_withdrawals') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'count_manual_withdrawals') result = data[0].count;

        else if(item.stats == 'total_cash_deposits') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'count_cash_deposits') result = data[0].count;

        else if(item.stats == 'total_crypto_deposits') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'count_crypto_deposits') result = data[0].count;
		else if(item.stats == 'total_crypto_withdrawals') result = roundedToFixed(data[0].total, 2).toFixed(2);
		else if(item.stats == 'count_crypto_withdrawals') result = data[0].count;

		return callback(null, result);
	});
}

/* ----- CLIENT USAGE ----- */
function getAllGraphs(user, socket, graphs, cooldown){
	cooldown(true, true);

	if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	graphs.forEach(function(item){
		processGraph(socket, item);
	});

	cooldown(false, false);
}

/* ----- CLIENT USAGE ----- */
function getGraph(user, socket, graph, cooldown){
	cooldown(true, true);

	if(!config.settings.allowed.admin.includes(user.userid)){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'You don\'t have permission to use that!'
		});

		return cooldown(false, true);
	}

	processGraph(socket, graph);

	cooldown(false, false);
}

/* ----- INTERNAL USAGE ----- */
function processGraph(socket, graph){
	var graphs_allowed = [
		'unique_visitors', 'total_requests',
        'user_registration', 'conversion_registration',

		'tracking_joins',
		'referrals_overview',

        'count_games', 'total_profit',

        'roulette_games', 'roulette_profit',
        'crash_games', 'crash_profit',
        'jackpot_games', 'jackpot_profit',
        'coinflip_games', 'coinflip_profit',
        'dice_games', 'dice_profit',
        'minesweeper_games', 'minesweeper_profit',
        'tower_games', 'tower_profit',
        'plinko_games', 'plinko_profit',
        'casino_games', 'casino_profit',

		'count_deposits', 'total_deposits',
        'count_withdrawals', 'total_withdrawals',

        'count_manual_deposits', 'total_manual_deposits', 'count_manual_withdrawals', 'total_manual_withdrawals',

        'count_cash_deposits', 'total_cash_deposits',

        'count_crypto_deposits', 'total_crypto_deposits', 'count_crypto_withdrawals', 'total_crypto_withdrawals'

	];

	if(!graphs_allowed.includes(graph.graph.split('.')[0])){
		return emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid graph!'
		});
	}

	if(graphsQueue.loading) return graphsQueue.queue.push({ socket, date: graph.date, graph: graph.graph });

	fillGraph({ socket, date: graph.date, graph: graph.graph });
}

/* ----- INTERNAL USAGE ----- */
function fillGraph(item){
	graphsQueue.loading = true;

    if(item.graph.split('.')[0] == 'conversion_registration'){
        return finishGraph(item.date, 'unique_visitors', function(err1, data1){
            if(err1){
                return emitSocketToUser(item.socket, 'message', 'error', {
                    message: err1.message
                });
            }

            finishGraph(item.date, 'user_registration', function(err2, data2){
                if(err2){
                    return emitSocketToUser(item.socket, 'message', 'error', {
                        message: err2.message
                    });
                }

                var data = Array.from(Array({ 'day': 24, 'week': 7, 'month': 31, 'year': 12 }[item.date]), (a, i) => roundedToFixed(data2[i] / data1[i] * 100, 2));

                sendGraph(item, [
					data
				]);
            });
        });
    }

	if(item.graph.split('.')[0] == 'referrals_overview'){
		return finishGraph(item.date, item.graph.replace('referrals_overview', 'referrals_clicks'), function(err1, data1){
            if(err1){
                return emitSocketToUser(item.socket, 'message', 'error', {
                    message: err1.message
                });
            }

            finishGraph(item.date, item.graph.replace('referrals_overview', 'referrals_joins'), function(err2, data2){
                if(err2){
                    return emitSocketToUser(item.socket, 'message', 'error', {
                        message: err2.message
                    });
                }

                sendGraph(item, [
					data1,
					data2
				]);
            });
        });
	}

	finishGraph(item.date, item.graph, function(err1, data){
		if(err1){
            return emitSocketToUser(item.socket, 'message', 'error', {
                message: err1.message
            });
        }

        sendGraph(item, [
			data
		]);
	});
}

/* ----- INTERNAL USAGE ----- */
function sendGraph(item, result){
    var data = {
        labels: [],
        data: result
    };

    var months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];

    if(item.date == 'day') data.labels = [ '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23' ];
    else if(item.date == 'week') data.labels = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ];
    else if(item.date == 'month') data.labels = [ '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31' ];
    else if(item.date == 'year') data.labels = months;

    if(item.date == 'month') for(var i = 0; i < data.labels.length; i++) data.labels[i] += ' ' + months[new Date(getFetchDate(item.date) * 1000).getMonth()];
    if(item.date == 'day') for(var i = 0; i < data.labels.length; i++) data.labels[i] += ':00';

    emitSocketToUser(item.socket, 'dashboard', 'graph', {
        data: data,
        graph: item.graph
    });

    if(graphsQueue.queue.length > 0){
        var first = graphsQueue.queue[0]

        graphsQueue.queue.shift();

        return fillGraph(first);
    }

    graphsQueue.loading = false;
}

/* ----- INTERNAL USAGE ----- */
function loadGraph(date, graph, callback){
	var time = getFetchDate(date);

	var graph_name = graph.split('.')[0];
	var graph_data = graph.split('.')[1];

	if(graph_name == 'unique_visitors') var query = 'SELECT `time`, `ip` FROM `join_visitors` WHERE `time` > ' + pool.escape(time);
	else if(graph_name == 'total_requests') var query = 'SELECT `time` FROM `join_visitors` WHERE `time` > ' + pool.escape(time);
	else if(graph_name == 'user_registration') var query = 'SELECT `time_create` FROM `users` WHERE `time_create` > ' + pool.escape(time);

    else if(graph_name == 'tracking_joins') var query = 'SELECT tracking_joins.time FROM `tracking_joins` INNER JOIN `tracking_links` ON tracking_joins.referral = tracking_links.referral WHERE tracking_links.id = ' + pool.escape(graph_data) + ' AND tracking_links.removed = 0 AND tracking_joins.time > ' + pool.escape(time);

	else if(graph_name == 'referrals_clicks') var query = 'SELECT `time` FROM `referral_visitors` WHERE `referral` = ' + pool.escape(graph_data) + ' AND `time` > ' + pool.escape(time);
	else if(graph_name == 'referrals_joins') var query = 'SELECT `time` FROM `referral_uses` WHERE `referral` = ' + pool.escape(graph_data) + ' AND `time` > ' + pool.escape(time);

	else if(graph_name == 'count_games') {
		var query = [
            'SELECT `time` FROM `roulette_bets` WHERE `time` > ' + pool.escape(time),
            'SELECT `time` FROM `crash_bets` WHERE `time` > ' + pool.escape(time),
            'SELECT `time` FROM `jackpot_games` WHERE `ended` = 1 AND `time` > ' + pool.escape(time),
            'SELECT coinflip_bets.time FROM `coinflip_games` INNER JOIN `coinflip_bets` ON coinflip_games.id = coinflip_bets.gameid WHERE coinflip_games.ended = 1 AND coinflip_games.canceled = 0 AND coinflip_bets.time > ' + pool.escape(time),
            'SELECT `time` FROM `dice_bets` WHERE `time` > ' + pool.escape(time),
            'SELECT `time` FROM `minesweeper_bets` WHERE `ended` = 1 AND `time` > ' + pool.escape(time),
            'SELECT `time` FROM `tower_bets` WHERE `ended` = 1 AND `time` > ' + pool.escape(time),
            'SELECT `time` FROM `plinko_bets` WHERE `time` > ' + pool.escape(time),
            'SELECT `time` FROM `casino_bets` WHERE `refunded` = 0 AND `time` > ' + pool.escape(time)
        ].join(' UNION ALL ');
	} else if(graph_name == 'total_profit') {
        var query = [
            'SELECT `amount`, `time` FROM `users_transactions` WHERE (' + [ ...Object.keys(config.settings.games.games.original), ...Object.keys(config.settings.games.games.classic) ].map(a => '`transaction` LIKE "' + a + '_%"').join(' OR ') + ') AND `time` > ' + pool.escape(time)
        ].join(' UNION ALL ');
    }

    else if(graph_name == 'roulette_games') var query = 'SELECT `time` FROM `roulette_bets` WHERE `time` > ' + pool.escape(time);
	else if(graph_name == 'roulette_profit') var query = 'SELECT `amount`, `time` FROM `users_transactions` WHERE `transaction` LIKE "roulette_%" AND `time` > ' + pool.escape(time);

    else if(graph_name == 'crash_games') var query = 'SELECT `time` FROM `crash_bets` WHERE `time` > ' + pool.escape(time);
	else if(graph_name == 'crash_profit') var query = 'SELECT `amount`, `time` FROM `users_transactions` WHERE `transaction` LIKE "crash_%" AND `time` > ' + pool.escape(time);

    else if(graph_name == 'jackpot_games') var query = 'SELECT `time` FROM `jackpot_games` WHERE `ended` = 1 AND `time` > ' + pool.escape(time);
	else if(graph_name == 'jackpot_profit') var query = 'SELECT `amount`, `time` FROM `users_transactions` WHERE `transaction` LIKE "jackpot_%" AND `time` > ' + pool.escape(time);

    else if(graph_name == 'coinflip_games') var query = 'SELECT coinflip_bets.time FROM `coinflip_games` INNER JOIN `coinflip_bets` ON coinflip_games.id = coinflip_bets.gameid WHERE coinflip_games.ended = 1 AND coinflip_games.canceled = 0 AND coinflip_bets.time > ' + pool.escape(time);
	else if(graph_name == 'coinflip_profit') var query = 'SELECT `amount`, `time` FROM `users_transactions` WHERE `transaction` LIKE "coinflip_%" AND `time` > ' + pool.escape(time);

    else if(graph_name == 'dice_games') var query = 'SELECT `time` FROM `dice_bets` WHERE `time` > ' + pool.escape(time);
	else if(graph_name == 'dice_profit') var query = 'SELECT `amount`, `time` FROM `users_transactions` WHERE `transaction` LIKE "dice_%" AND `time` > ' + pool.escape(time);

    else if(graph_name == 'minesweeper_games') var query = 'SELECT `time` FROM `minesweeper_bets` WHERE `ended` = 1 AND `time` > ' + pool.escape(time);
	else if(graph_name == 'minesweeper_profit') var query = 'SELECT `amount`, `time` FROM `users_transactions` WHERE `transaction` LIKE "minesweeper_%" AND `time` > ' + pool.escape(time);

    else if(graph_name == 'tower_games') var query = 'SELECT `time` FROM `tower_bets` WHERE `ended` = 1 AND `time` > ' + pool.escape(time);
	else if(graph_name == 'tower_profit') var query = 'SELECT `amount`, `time` FROM `users_transactions` WHERE `transaction` LIKE "tower_%" AND `time` > ' + pool.escape(time);

    else if(graph_name == 'plinko_games') var query = 'SELECT `time` FROM `plinko_bets` WHERE `time` > ' + pool.escape(time);
	else if(graph_name == 'plinko_profit') var query = 'SELECT `amount`, `time` FROM `users_transactions` WHERE `transaction` LIKE "plinko_%" AND `time` > ' + pool.escape(time);

    else if(graph_name == 'casino_games') var query = 'SELECT `time` FROM `casino_bets` WHERE `refunded` = 0 AND `time` > ' + pool.escape(time);
	else if(graph_name == 'casino_profit') var query = 'SELECT `amount`, `time` FROM `users_transactions` WHERE `transaction` LIKE "casino_%" AND `time` > ' + pool.escape(time);

	else if(graph_name == 'count_deposits') var query = 'SELECT `time` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `time` > ' + pool.escape(time);
	else if(graph_name == 'total_deposits') var query = 'SELECT `amount`, `time` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `time` > ' + pool.escape(time);
	else if(graph_name == 'count_withdrawals') var query = 'SELECT `time` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw") + ' AND `time` > ' + pool.escape(time);
	else if(graph_name == 'total_withdrawals') var query = 'SELECT `amount`, `time` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw") + ' AND `time` > ' + pool.escape(time);

	else if(graph_name == 'count_manual_deposits') var query = 'SELECT `time` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("manual") + ' AND `time` > ' + pool.escape(time);
	else if(graph_name == 'total_manual_deposits') var query = 'SELECT `amount`, `time` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("manual") + ' AND `time` > ' + pool.escape(time);
	else if(graph_name == 'count_manual_withdrawals') var query = 'SELECT `time` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw") + ' AND `method` = ' + pool.escape("manual") + ' AND `time` > ' + pool.escape(time);
	else if(graph_name == 'total_manual_withdrawals') var query = 'SELECT `amount`, `time` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw") + ' AND `method` = ' + pool.escape("manual") + ' AND `time` > ' + pool.escape(time);

    else if(graph_name == 'count_cash_deposits') var query = 'SELECT `time` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("cash") + ' AND `time` > ' + pool.escape(time);
	else if(graph_name == 'total_cash_deposits') var query = 'SELECT `amount`, `time` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("cash") + ' AND `time` > ' + pool.escape(time);

    else if(graph_name == 'count_crypto_deposits') var query = 'SELECT `time` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("crypto") + ' AND `time` > ' + pool.escape(time);
	else if(graph_name == 'total_crypto_deposits') var query = 'SELECT `amount`, `time` FROM `users_trades` WHERE `type` = ' + pool.escape("deposit") + ' AND `method` = ' + pool.escape("crypto") + ' AND `time` > ' + pool.escape(time);
	else if(graph_name == 'count_crypto_withdrawals') var query = 'SELECT `time` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw") + ' AND `method` = ' + pool.escape("crypto") + ' AND `time` > ' + pool.escape(time);
	else if(graph_name == 'total_crypto_withdrawals') var query = 'SELECT `amount`, `time` FROM `users_trades` WHERE `type` = ' + pool.escape("withdraw") + ' AND `method` = ' + pool.escape("crypto") + ' AND `time` > ' + pool.escape(time);

	pool.query(query, function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while loading graph (1)'));

		callback(null, row1);
	});
}

/* ----- INTERNAL USAGE ----- */
function finishGraph(date, graph, callback){
	loadGraph(date, graph, function(err1, data){
		if(err1) return callback(err1);

		var result = Array.from(Array({ 'day': 24, 'week': 7, 'month': 31, 'year': 12 }[date]), () => 0);

        var temp = {};

		var graph_name = graph.split('.')[0];
		var graph_data = graph.split('.')[1];

		data.forEach(function(item){
			if(graph_name == 'unique_visitors') var time_row = item.time;
			else if(graph_name == 'total_requests') var time_row = item.time;
			else if(graph_name == 'user_registration') var time_row = item.time_create;

			else if(graph_name == 'tracking_joins') var time_row = item.time;

			else if(graph_name == 'referrals_clicks') var time_row = item.time;
			else if(graph_name == 'referrals_joins') var time_row = item.time;

			else if(graph_name == 'count_games') var time_row = item.time;
			else if(graph_name == 'total_profit') var time_row = item.time;

            else if(graph_name == 'roulette_games') var time_row = item.time;
			else if(graph_name == 'roulette_profit') var time_row = item.time;

            else if(graph_name == 'crash_games') var time_row = item.time;
			else if(graph_name == 'crash_profit') var time_row = item.time;

            else if(graph_name == 'jackpot_games') var time_row = item.time;
			else if(graph_name == 'jackpot_profit') var time_row = item.time;

            else if(graph_name == 'coinflip_games') var time_row = item.time;
			else if(graph_name == 'coinflip_profit') var time_row = item.time;

            else if(graph_name == 'dice_games') var time_row = item.time;
			else if(graph_name == 'dice_profit') var time_row = item.time;

            else if(graph_name == 'minesweeper_games') var time_row = item.time;
			else if(graph_name == 'minesweeper_profit') var time_row = item.time;

            else if(graph_name == 'tower_games') var time_row = item.time;
			else if(graph_name == 'tower_profit') var time_row = item.time;

            else if(graph_name == 'plinko_games') var time_row = item.time;
			else if(graph_name == 'plinko_profit') var time_row = item.time;

            else if(graph_name == 'casino_games') var time_row = item.time;
			else if(graph_name == 'casino_profit') var time_row = item.time;

			else if(graph_name == 'count_deposits') var time_row = item.time;
			else if(graph_name == 'total_deposits') var time_row = item.time;
			else if(graph_name == 'count_withdrawals') var time_row = item.time;
			else if(graph_name == 'total_withdrawals') var time_row = item.time;

			else if(graph_name == 'count_manual_deposits') var time_row = item.time;
			else if(graph_name == 'total_manual_deposits') var time_row = item.time;
			else if(graph_name == 'count_manual_withdrawals') var time_row = item.time;
			else if(graph_name == 'total_manual_withdrawals') var time_row = item.time;

            else if(graph_name == 'count_cash_deposits') var time_row = item.time;
			else if(graph_name == 'total_cash_deposits') var time_row = item.time;

            else if(graph_name == 'count_crypto_deposits') var time_row = item.time;
			else if(graph_name == 'total_crypto_deposits') var time_row = item.time;
			else if(graph_name == 'count_crypto_withdrawals') var time_row = item.time;
			else if(graph_name == 'total_crypto_withdrawals') var time_row = item.time;

			if(date == 'day') var time = new Date(time_row * 1000).getHours();
			else if(date == 'week') var time = (new Date(time_row * 1000).getDay() + 6) % 7;
			else if(date == 'month') var time = new Date(time_row * 1000).getDate() - 1;
			else if(date == 'year') var time = new Date(time_row * 1000).getMonth();

			if(graph_name == 'unique_visitors') {
                if(temp[time] === undefined) temp[time] = {};

                var add = (temp[time][item.ip] === undefined) ? 1 : 0;

                if(temp[time][item.ip] === undefined) temp[time][item.ip] = true;
            } else if(graph_name == 'total_requests') var add = 1;
			else if(graph_name == 'user_registration') var add = 1;

			else if(graph_name == 'tracking_joins') var add = 1;

			else if(graph_name == 'referrals_clicks') var add = 1;
			else if(graph_name == 'referrals_joins') var add = 1;

			else if(graph_name == 'count_games') var add = 1;
			else if(graph_name == 'total_profit') var add = -getFormatAmount(item.amount);

            else if(graph_name == 'roulette_games') var add = 1;
			else if(graph_name == 'roulette_profit') var add = -getFormatAmount(item.amount);

            else if(graph_name == 'crash_games') var add = 1;
			else if(graph_name == 'crash_profit') var add = -getFormatAmount(item.amount);

            else if(graph_name == 'jackpot_games') var add = 1;
			else if(graph_name == 'jackpot_profit') var add = -getFormatAmount(item.amount);

            else if(graph_name == 'coinflip_games') var add = 1;
			else if(graph_name == 'coinflip_profit') var add = -getFormatAmount(item.amount);

            else if(graph_name == 'dice_games') var add = 1;
			else if(graph_name == 'dice_profit') var add = -getFormatAmount(item.amount);

            else if(graph_name == 'minesweeper_games') var add = 1;
			else if(graph_name == 'minesweeper_profit') var add = -getFormatAmount(item.amount);

            else if(graph_name == 'tower_games') var add = 1;
			else if(graph_name == 'tower_profit') var add = -getFormatAmount(item.amount);

            else if(graph_name == 'plinko_games') var add = 1;
			else if(graph_name == 'plinko_profit') var add = -getFormatAmount(item.amount);

            else if(graph_name == 'casino_games') var add = 1;
			else if(graph_name == 'casino_profit') var add = -getFormatAmount(item.amount);

			else if(graph_name == 'count_deposits') var add = 1;
			else if(graph_name == 'total_deposits') var add = getFormatAmount(item.amount);
			else if(graph_name == 'count_withdrawals') var add = 1;
			else if(graph_name == 'total_withdrawals') var add = getFormatAmount(item.amount);

			else if(graph_name == 'count_manual_deposits') var add = 1;
			else if(graph_name == 'total_manual_deposits') var add = getFormatAmount(item.amount);
			else if(graph_name == 'count_manual_withdrawals') var add = 1;
			else if(graph_name == 'total_manual_withdrawals') var add = getFormatAmount(item.amount);

            else if(graph_name == 'count_cash_deposits') var add = 1;
			else if(graph_name == 'total_cash_deposits') var add = getFormatAmount(item.amount);

            else if(graph_name == 'count_crypto_deposits') var add = 1;
			else if(graph_name == 'total_crypto_deposits') var add = getFormatAmount(item.amount);
			else if(graph_name == 'count_crypto_withdrawals') var add = 1;
			else if(graph_name == 'total_crypto_withdrawals') var add = getFormatAmount(item.amount);

			result[time] += add;
		});

		for(var i = 0; i < result.length; i++) {
			if(graph_name == 'unique_visitors') result[i] = Math.floor(result[i]);
			else if(graph_name == 'total_requests') result[i] = Math.floor(result[i]);
			else if(graph_name == 'user_registration') result[i] = Math.floor(result[i]);

			else if(graph_name == 'tracking_joins') result[i] = Math.floor(result[i]);

			else if(graph_name == 'referrals_clicks') result[i] = Math.floor(result[i]);
			else if(graph_name == 'referrals_joins') result[i] = Math.floor(result[i]);

			else if(graph_name == 'count_games') result[i] = Math.floor(result[i]);
			else if(graph_name == 'total_profit') result[i] = getFormatAmount(result[i]);

            else if(graph_name == 'roulette_games') result[i] = Math.floor(result[i]);
			else if(graph_name == 'roulette_profit') result[i] = getFormatAmount(result[i]);

            else if(graph_name == 'crash_games') result[i] = Math.floor(result[i]);
			else if(graph_name == 'crash_profit') result[i] = getFormatAmount(result[i]);

            else if(graph_name == 'jackpot_games') result[i] = Math.floor(result[i]);
			else if(graph_name == 'jackpot_profit') result[i] = getFormatAmount(result[i]);

            else if(graph_name == 'coinflip_games') result[i] = Math.floor(result[i]);
			else if(graph_name == 'coinflip_profit') result[i] = getFormatAmount(result[i]);

            else if(graph_name == 'dice_games') result[i] = Math.floor(result[i]);
			else if(graph_name == 'dice_profit') result[i] = getFormatAmount(result[i]);

            else if(graph_name == 'minesweeper_games') result[i] = Math.floor(result[i]);
			else if(graph_name == 'minesweeper_profit') result[i] = getFormatAmount(result[i]);

            else if(graph_name == 'tower_games') result[i] = Math.floor(result[i]);
			else if(graph_name == 'tower_profit') result[i] = getFormatAmount(result[i]);

            else if(graph_name == 'plinko_games') result[i] = Math.floor(result[i]);
			else if(graph_name == 'plinko_profit') result[i] = getFormatAmount(result[i]);

            else if(graph_name == 'casino_games') result[i] = Math.floor(result[i]);
			else if(graph_name == 'casino_profit') result[i] = getFormatAmount(result[i]);

			else if(graph_name == 'count_deposits') result[i] = Math.floor(result[i]);
			else if(graph_name == 'total_deposits') result[i] = getFormatAmount(result[i]);
			else if(graph_name == 'count_withdrawals') result[i] = Math.floor(result[i]);
			else if(graph_name == 'total_withdrawals') result[i] = getFormatAmount(result[i]);

			else if(graph_name == 'count_manual_deposits') result[i] = Math.floor(result[i]);
			else if(graph_name == 'total_manual_deposits') result[i] = getFormatAmount(result[i]);
			else if(graph_name == 'count_manual_withdrawals') result[i] = Math.floor(result[i]);
			else if(graph_name == 'total_manual_withdrawals') result[i] = getFormatAmount(result[i]);

            else if(graph_name == 'count_cash_deposits') result[i] = Math.floor(result[i]);
			else if(graph_name == 'total_cash_deposits') result[i] = getFormatAmount(result[i]);

            else if(graph_name == 'count_crypto_deposits') result[i] = Math.floor(result[i]);
			else if(graph_name == 'total_crypto_deposits') result[i] = getFormatAmount(result[i]);
			else if(graph_name == 'count_crypto_withdrawals') result[i] = Math.floor(result[i]);
			else if(graph_name == 'total_crypto_withdrawals') result[i] = getFormatAmount(result[i]);

		}

		return callback(null, result);
	});
}

module.exports = {
	getAllStats, getAllGraphs, getGraph
};