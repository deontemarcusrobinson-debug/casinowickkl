var { pool } = require('@/lib/database.js');

var { haveRankPermission } = require('@/utils/utils.js');

var banip = async (req, res, next) => {
    var ip = req.ip;

    pool.query('SELECT `id` FROM `bannedip` WHERE `ip` = ' + pool.escape(ip) + ' AND `removed` = 0', function(err1, row1) {
        if(err1) {
            console.error('[banip] DB error:', err1.code || '', err1.message || err1);
            var hint = 'Database error while checking ban IP.';
            if(err1.code === 'ER_NO_SUCH_TABLE') {
                hint = 'Table bannedip is missing — run migrate (Start Command must be: npm start).';
            } else if(err1.code === 'ECONNREFUSED' || err1.code === 'ENOTFOUND' || err1.code === 'ETIMEDOUT' || err1.code === 'PROTOCOL_CONNECTION_LOST') {
                hint = 'Cannot reach MySQL — link MYSQLHOST/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE on Render.';
            } else if(err1.code === 'ER_ACCESS_DENIED_ERROR') {
                hint = 'MySQL login failed — check MYSQLUSER / MYSQLPASSWORD.';
            }
            return res.status(409).render('409', { layout: 'layouts/error', error: hint + ' (' + (err1.code || 'unknown') + ')' });
        }

        if(row1.length <= 0) return next();
        if(row1.length > 0 && haveRankPermission('exclude_ban_ip', res.locals.user ? res.locals.user.rank : 0)) return next();

        res.status(403).render('banip', { layout: 'layouts/error' });
    });
};

module.exports = banip;