var { pool } = require('@/lib/database.js');

var { makeDate, time } = require('@/utils/formatDate.js');
var { haveRankPermission } = require('@/utils/utils.js');

module.exports = (socket) => {
    return (packet, next) => {
        if(!socket.data.user) return next();

        var event = packet[0];
        if(event == 'join') return next();

        var type = packet[1].type;
        var command = packet[1].command;
        if(type == 'support' || (type == 'pagination' && command == 'support_requests')) return next();

        pool.query('SELECT users_restrictions.expire FROM `users_restrictions` INNER JOIN `users` ON users_restrictions.adminid = users.userid WHERE users_restrictions.restriction = ' + pool.escape('site') + ' AND users_restrictions.removed = 0 AND (users_restrictions.expire = -1 OR users_restrictions.expire > ' + pool.escape(time()) + ') AND users_restrictions.userid = ' + pool.escape(socket.data.user.userid), function(err1, row1){
            if(err1) return next(new Error('An error occurred while processing ban site middleware (1)'));

            if(row1.length <= 0) return next();
            if(row1.length > 0 && haveRankPermission('exclude_ban_site', socket.data.user ? socket.data.user.rank : 0)) return next();

            var expire = parseInt(row1[0].expire);

            next(new Error('You are restricted to use our site. The restriction expires ' + (expire == -1 ? 'never' : makeDate(new Date(expire * 1000))) + '.'));
        });
    };
};