var { pool } = require('@/lib/database.js');

var { getLocationByIp } = require('@/utils/utils.js');
var { time } = require('@/utils/formatDate.js');

var visitors = async (req, res, next) => {
    if(req.path === '/healthz') return next();

    var link = req.protocol + '://' + req.get('host') + req.originalUrl;
    var ip = req.ip;
    var agent = req.headers['user-agent'];

    getLocationByIp(ip, function(err1, response){
        if(err1 || !response) {
            response = { country: 'XX', region: 'Unknown', city: 'Unknown' };
        }

        var location = [ response.city, response.region, response.country ].join(', ');

        pool.query('INSERT INTO `join_visitors` SET `link` = ' + pool.escape(link) + ', `ip` = ' + pool.escape(ip) + ', `location` = ' + pool.escape(location) + ', `agent` = ' + pool.escape(agent) + ', `time` = ' + pool.escape(time()), function(err2) {
            if(err2) {
                console.error('[visitors] insert failed:', err2.code || '', err2.message || err2);
                return next();
            }

            next();
        });
    });
};

module.exports = visitors;