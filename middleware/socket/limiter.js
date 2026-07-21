var limiter = require('rate-limiter-flexible');

var config = require('@/config/config.js');

var rateLimiter = new limiter.RateLimiterMemory({
    points: config.app.limiter.socket.max,
    duration: config.app.limiter.socket.time
});

module.exports = (socket) => {
    return (packet, next) => {
        rateLimiter.consume(socket.id).then(function() {
            next();
        }).catch(function() {
            next(new Error('Rate limit exceeded'));
        });
    };
};