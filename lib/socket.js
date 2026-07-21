var fs = require('fs');
var http = require('http');
var https = require('https');
var { Server } = require('socket.io');

var app = require('@/lib/app.js');
var { loggerDebug } = require('@/lib/logger.js');

var config = require('@/config/config.js');

var server;

if (config.app.secure) {
    server = https.createServer({
        cert: fs.readFileSync(config.app.ssl.cert),
        key: fs.readFileSync(config.app.ssl.key)
    }, app);
} else {
    server = http.createServer(app);
}

var io = new Server(server, {
    transports: [ 'polling' ],
    cors: {
        origin: config.app.secure ? config.app.url : '*',
        allowedHeaders: config.app.secure ? ['Access-Control-Allow-Origin'] : [],
        credentials: config.app.secure,
        methods: [ 'GET', 'POST' ]
    }
});

// Bind all interfaces so Render / Railway / containers can reach the process
server.listen(config.app.port, '0.0.0.0', function(){
    loggerDebug('[SERVER] Server running on port ' + config.app.port);
});

module.exports = io;