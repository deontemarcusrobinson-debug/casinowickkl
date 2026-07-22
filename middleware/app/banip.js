var { pool } = require('@/lib/database.js');

var { haveRankPermission } = require('@/utils/utils.js');

var banip = async (req, res, next) => {
    var ip = req.ip;

    pool.query('SELECT `id` FROM `bannedip` WHERE `ip` = ' + pool.escape(ip) + ' AND `removed` = 0', function(err1, row1) {
        if(err1) {
            console.error('[banip] DB error:', err1.code || '', err1.message || err1);
            // Fail open so health checks and the site can load if MySQL is briefly unavailable
            return next();
        }

        if(row1.length <= 0) return next();
        if(row1.length > 0 && haveRankPermission('exclude_ban_ip', res.locals.user ? res.locals.user.rank : 0)) return next();

        res.status(403).render('banip', { layout: 'layouts/error' });
    });
};

module.exports = banip;