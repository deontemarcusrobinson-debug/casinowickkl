module.exports = (socket) => {
    var auth = socket.handshake.auth !== undefined ? socket.handshake.auth : {};
    var paths = Array.isArray(auth.paths) ? auth.paths : [];

    socket.data.channel = auth.channel;
    socket.data.history = auth.history;
    socket.data.paths = paths;
};