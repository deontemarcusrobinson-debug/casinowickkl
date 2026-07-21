var { pool } = require('@/lib/database.js');

var { getFormatAmountString } = require('@/utils/formatAmount.js');
var { getUserInfo } = require('@/utils/user.js');

var config = require('@/config/config.js');

exports.leaderboard = async (req, res, next) => {
    pool.query('SELECT users.userid, users.name, users.avatar, users.xp, bets_table.games, bets_table.wagered, bets_table.winnings FROM `users` INNER JOIN (SELECT users_transactions.userid, SUM(IF(users_transactions.amount > 0, 0, -users_transactions.amount)) AS `wagered`, SUM(IF(users_transactions.amount > 0, users_transactions.amount, 0)) AS `winnings`, SUM(users_transactions.amount) AS `profit`, SUM(IF(users_transactions.amount > 0, 0, 1)) AS `games` FROM `users_transactions` WHERE users_transactions.transaction LIKE "%_bet" OR users_transactions.transaction LIKE "%_win" OR users_transactions.transaction LIKE "%_refund" OR users_transactions.transaction LIKE "%_cashback" GROUP BY users_transactions.userid ORDER BY `wagered` DESC) AS `bets_table` ON users.userid = bets_table.userid WHERE users.bot = 0 ORDER BY bets_table.wagered DESC LIMIT 10', function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering leaderboard page (1)' });

        res.render('leaderboard', {
            page: 'leaderboard',
            name: config.app.pages['leaderboard'],
            response: {
                leaderboard: row1.map(a => ({
                    user: getUserInfo({
                        userid: a.userid,
                        name: a.name,
                        avatar: a.avatar,
                        xp: parseInt(a.xp),
                        anonymous: 0
                    }),
                    games: parseInt(a.games),
                    wagered: getFormatAmountString(a.wagered),
                    winnings: getFormatAmountString(a.winnings)
                }))
            }
        });
    });
};