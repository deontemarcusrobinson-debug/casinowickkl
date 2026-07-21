var crypto = require('crypto');

var { loggerDebug, loggerError, loggerInfo } = require('@/lib/logger.js');

var cashService = require('@/services/trading/cashService.js');

var config = require('@/config/config.js');

function verifySignature(signature, body){
    var parts = signature.split(',').reduce((acc, item) => {
        var [key, value] = item.split('=');
        acc[key] = value;

        return acc;
    }, {});

    var hmac = crypto.createHmac('sha256', config.trading.cash.stripe.webhook_secret_key);
    hmac.update(parts.t + '.' + body.toString());

    return crypto.timingSafeEqual(
        Buffer.from(hmac.digest('hex')),
        Buffer.from(parts.v1)
    );
}

exports.callback = async (req, res) => {
    if(req.headers['stripe-signature'] === undefined) return res.sendStatus(403);

    var verified = verifySignature(req.headers['stripe-signature'], JSON.stringify(req.body, null, 2));
    if(!verified) return res.sendStatus(403);

    cashService.updateTransaction(req.body, function(err1){
        if(err1) return res.sendStatus(409);

        res.sendStatus(200);
    });
};