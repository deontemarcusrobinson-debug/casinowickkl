var { pool } = require('@/lib/database.js');

var { haveRankPermission } = require('@/utils/utils.js');

var config = require('@/config/config.js');
var cashService = require('@/services/trading/cashService.js');
var paypalService = require('@/services/trading/paypalService.js');

exports.deposit = async (req, res, next) => {
    var response = {
        deposit: {
            enable: [
                'cash',
                'crypto'
            ].reduce((acc, cur) => ({ ...acc, [cur]: Object.keys(config.settings.payments.methods[cur]).map(a => ({
                method: a,
                enable: config.settings.payments.methods[cur][a].enable.deposit,
                name: config.settings.payments.methods[cur][a].name
            })) }), {}),
            code: null
        }
    }

    if(!res.locals.user) return res.render('deposit', {
        page: 'deposit',
        name: config.app.pages['deposit'],
        response: response
    });

    pool.query('SELECT deposit_codes.code FROM `deposit_uses` INNER JOIN `deposit_codes` ON deposit_uses.bonusid = deposit_codes.id WHERE deposit_uses.userid = ' + pool.escape(res.locals.user.userid) + ' AND deposit_uses.removed = 0', function(err1, row1) {
		if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering deposit page (1)' });

        if(row1.length > 0) response.deposit.code = row1[0].code.toUpperCase();

        res.render('deposit', {
            page: 'deposit',
            name: config.app.pages['deposit'],
            response: response
        });
    });
};

exports.depositCash = async (req, res, next) => {
    if(!Object.keys(config.settings.payments.methods.cash).includes(req.params.method)) return next();
    if(!config.settings.payments.methods.cash[req.params.method].enable.deposit && !haveRankPermission('trade_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    var paypal = paypalService.getPublicConfig();

    res.render('depositCash', {
        page: 'deposit',
        name: config.app.pages['deposit'],
        response: {
            deposit: {
                name: config.settings.payments.methods.cash[req.params.method].name,
                method: req.params.method,
                test: config.trading.cash.test_mode,
                paypal: paypal,
                min: config.app.intervals.amounts.deposit_cash.min,
                max: config.app.intervals.amounts.deposit_cash.max
            }
        }
    });
};

exports.depositCrypto = async (req, res, next) => {
    if(!Object.keys(config.settings.payments.methods.crypto).includes(req.params.method)) return next();
    if(!config.settings.payments.methods.crypto[req.params.method].enable.deposit && !haveRankPermission('trade_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    res.render('depositCrypto', {
        page: 'deposit',
        name: config.app.pages['deposit'],
        response: {
            deposit: {
                name: config.settings.payments.methods.crypto[req.params.method].name,
                network: config.settings.payments.methods.crypto[req.params.method].network
            }
        }
    });
};

exports.depositPaypalCreateOrder = async (req, res, next) => {
    if(!res.locals.user) return res.status(401).json({ error: 'You must be logged in' });

    // Front-end may only request an order — it cannot set balance or paid amount
    var amount = req.body && req.body.amount;
    var source = (req.body && req.body.source) === 'wallet' ? 'wallet' : 'card';

    cashService.createCheckoutOrder(res.locals.user, amount, { source: source }, function(err1, order) {
        if(err1) return res.status(400).json({ error: err1.message || 'Could not create order' });

        res.json({ id: order.id });
    });
};

exports.depositPaypalCapture = async (req, res, next) => {
    if(!res.locals.user) return res.status(401).json({ error: 'You must be logged in' });

    // Only order ID is accepted from the client — never amount/balance
    var orderID = (req.body && (req.body.orderID || req.body.orderId || req.body.token)) || '';
    if(req.body && (req.body.amount !== undefined || req.body.paid !== undefined || req.body.balance !== undefined)) {
        return res.status(400).json({ error: 'Invalid capture request' });
    }

    cashService.completePayPalDeposit(orderID, {
        userid: res.locals.user.userid,
        source: 'user'
    }, function(err1, result) {
        if(err1) return res.status(400).json({ error: err1.message || 'Capture failed' });

        // Amount returned is from PayPal-verified server data only
        res.json({
            status: 'COMPLETED',
            verified: true,
            already: !!(result && result.already),
            amount: result && result.amount,
            currency: result && result.currency,
            order_id: result && result.order_id
        });
    });
};

exports.depositPaypalPaid = async (req, res, next) => {
    if(!res.locals.user) return res.redirect('/deposit');

    var orderId = req.query.order || '';

    cashService.getPaidDepositForUser(res.locals.user.userid, orderId, function(err1, paid) {
        if(err1 || !paid) {
            return res.status(409).render('409', {
                layout: 'layouts/error',
                error: 'No verified PayPal payment found for this order.'
            });
        }

        res.render('depositPaid', {
            page: 'deposit',
            name: config.app.pages['deposit'] || 'Deposit',
            response: {
                deposit: {
                    amount: paid.amount,
                    currency: paid.currency,
                    order_id: paid.order_id,
                    already: false,
                    verified: true
                }
            }
        });
    });
};

exports.depositPaypalReturn = async (req, res, next) => {
    if(!res.locals.user) return res.redirect('/deposit');

    var orderId = req.query.token || req.query.orderId || '';

    cashService.completePayPalDeposit(orderId, {
        userid: res.locals.user.userid,
        source: 'return'
    }, function(err1, result) {
        if(err1) {
            return res.status(409).render('409', {
                layout: 'layouts/error',
                error: err1.message || 'PayPal payment could not be completed'
            });
        }

        res.redirect('/deposit/paid?order=' + encodeURIComponent(result.order_id || orderId));
    });
};

exports.depositPaypalCancel = async (req, res, next) => {
    var orderId = req.query.token || req.query.orderId || '';

    cashService.cancelPayPalDeposit(orderId, function() {
        res.redirect('/deposit?paypal=canceled');
    });
};
