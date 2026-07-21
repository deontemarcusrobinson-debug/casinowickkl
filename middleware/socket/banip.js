var { pool } = require('@/lib/database.js');

var { haveRankPermission } = require('@/utils/utils.js');

module.exports = (socket) => {
    return (packet, next) => {
        var ip = (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || socket.request.connection.remoteAddress).split(',')[0].trim();

        pool.query('SELECT `id` FROM `bannedip` WHERE `ip` = ' + pool.escape(ip) + ' AND `removed` = 0', function(err1, row1) {
            if(err1) return next(new Error('An error occurred while processing ban ip middleware (1)'));

            if(row1.length <= 0) return next();
            if(row1.length > 0 && haveRankPermission('exclude_ban_ip', socket.data.user ? socket.data.user.rank : 0)) return next();

            next(new Error('Your IP is banned'));
        });
    };
};