var affiliatesService = require('@/services/affiliatesService.js');

var { pool } = require('@/lib/database.js');

var { getLocationByIp } = require('@/utils/utils.js');
var { time } = require('@/utils/formatDate.js');

var config = require('@/config/config.js');
const { messages } = require('@/services/chatService');

var referral = async (req, res) => {
    if(!(/(^[a-zA-Z0-9]*$)/.exec(req.params.referral))) return res.redirect('/');

    var code = req.params.referral.trim().toLowerCase();

    if(code.length < config.app.rewards.requirements.code_length.min || code.length > config.app.rewards.requirements.code_length.max) return res.redirect('/');

    pool.query('SELECT `userid` FROM `referral_codes` WHERE `code` = ' + pool.escape(code), function(err1, row1){
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while processing referral middleware (1)' });

        if(row1.length <= 0) return res.redirect('/');

        var ip = req.ip;
        var agent = req.headers['user-agent'];

        getLocationByIp(ip, function(err2, response){
            if(err2) return res.status(409).render('409', { layout: 'layouts/error', error: err2.message });

            var location = [ response.city, response.region, response.country ].join(', ');

            pool.query('INSERT INTO `referral_visitors` SET `referral` = ' + pool.escape(row1[0].userid) + ', `ip` = ' + pool.escape(ip) + ', `location` = ' + pool.escape(location) + ', `agent` = ' + pool.escape(agent) + ', `time` = ' + pool.escape(time()), function(err3) {
                if(err3) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while processing referral middleware (2)' });

                if(!res.locals.user) {
                    req.session.referral = code;

                    return res.redirect('/');
                }

                affiliatesService.redeemReferralCode(res.locals.user.userid, code, function(err4){
                    if(err4) return res.status(409).render('409', { layout: 'layouts/error', error: err4,messages });

                    res.redirect('/');
                });
            });
        });
    });
};

module.exports = referral;