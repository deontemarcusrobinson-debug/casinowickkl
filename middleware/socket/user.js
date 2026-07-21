var crypto = require('crypto');
var cookie = require('cookie');

var { getSocketUserBySession } = require('@/utils/user.js');

module.exports = (socket) => {
    return (packet, next) => {
        socket.data.user = null;

        var cookies = socket.handshake.headers.cookie;
        if (!cookies) return next();

        var { session } = cookie.parse(cookies);

        if (!session) return next();

        var agent = socket.handshake.headers['user-agent'];
        var device = crypto.createHash('sha256').update(agent).digest('hex');

        getSocketUserBySession(session, device, function(err1, user) {
            if(err1) return next(err1);

            socket.data.user = user;

            next();
        });
    }
};