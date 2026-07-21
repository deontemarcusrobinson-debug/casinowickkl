var { pool } = require('@/lib/database.js');

var { haveRankPermission } = require('@/utils/utils.js');

module.exports = (socket) => {
    return (packet, next) => {
        socket.data.maintenance = false;

        pool.query('SELECT `id` FROM `maintenance` WHERE `removed` = 0', function(err1, row1) {
            if(err1) return next(new Error('An error occurred while processing maintenance middleware (1)'));

            if(row1.length <= 0) return next();
            if(row1.length > 0 && haveRankPermission('access_maintenance', socket.data.user ? socket.data.user.rank : 0)) return next();

            socket.data.maintenance = true;

            next();
        });
    };
};