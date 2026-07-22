var { loggerWarn } = require('@/lib/logger.js');

var { emitSocketToAll } = require('@/utils/socket.js');

var historyService = require('@/services/historyService.js');

var config = require('@/config/config.js');

module.exports = (socket) => {
    return () => {
        if(historyService.rooms[socket.data.user ? socket.data.user.userid : socket.id] !== undefined) delete historyService.rooms[socket.data.user ? socket.data.user.userid : socket.id];

        if(socket.data.user) loggerWarn('[SERVER] User with userid ' + socket.data.user.userid + ' is disconnected from page /' + socket.data.paths.join('/'));
        else loggerWarn('[SERVER] Guest with socketid ' + socket.id + ' is disconnected from page /' + socket.data.paths.join('/'));

        //USERS ONLINE
        emitSocketToAll('site', 'online', {
            online: require('@/services/activityService.js').getOnlineByChannel()
        });
    };
};