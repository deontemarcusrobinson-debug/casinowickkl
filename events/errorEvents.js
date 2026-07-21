var { emitSocketToUser } = require('@/utils/socket.js');

module.exports = (socket) => {
    return (err) => {
        emitSocketToUser(socket, 'message', 'error', {
            message: err.message
        });
    };
};