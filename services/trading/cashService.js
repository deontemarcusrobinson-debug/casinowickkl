var { pool } = require('@/lib/database.js');
var { loggerDebug, loggerError } = require('@/lib/logger.js');

var userService = require('@/services/userService.js');
var paypalService = require('@/services/trading/paypalService.js');

var { makeDate, time } = require('@/utils/formatDate.js');
var { getFormatAmount, getFormatAmountString, verifyFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');
var { haveRankPermission } = require('@/utils/utils.js');

var config = require('@/config/config.js');

var transactions = {};

function getCashCurrency(){
    return paypalService.getCurrency().toLowerCase();
}

function initializeTransactions(){
    loggerDebug('[CASH] Loading Payments');

    pool.query('SELECT `id`, `time` FROM `cash_transactions` WHERE `status` >= 0 AND `status` != 5 AND `type` = ' + pool.escape('deposit'), function(err1, row1){
		if(err1) return;

        row1.forEach(function(item){
            transactions[item.id] = {
                timeout: null
            };

            if(item.time + config.trading.cash.time_cancel_transaction <= time()) {
                cancelTransaction(item.id, function(err2){
                    if(err2) return;
                });
            } else {
                transactions[item.id].timeout = setTimeout(function(){
                    cancelTransaction(item.id, function(err2){
                        if(err2) return;
                    });
                }, (item.time + config.trading.cash.time_cancel_transaction - time()) * 1000);
            }
        });
    });
}

/* ----- INTERNAL USAGE ----- */
function cancelTransaction(id, callback){
    pool.query('SELECT `transactionid`, `userid` FROM `cash_transactions` WHERE `id` = ' + pool.escape(id) + ' AND `status` >= 0 AND `status` != 5 AND `type` = ' + pool.escape('deposit'), function(err1, row1){
		if(err1) return callback(new Error('An error occurred while canceling transaction (1)'));

        if(row1.length <= 0) return callback(new Error('An error occurred while canceling transaction (2)'));

        pool.query('UPDATE `cash_transactions` SET `status` = -1 WHERE `id` = ' + pool.escape(id) + ' AND `status` >= 0 AND `status` != 5 AND `type` = ' + pool.escape('deposit'), function(err2){
            if(err2) return callback(new Error('An error occurred while canceling transaction (3)'));

            if(transactions[id] && transactions[id].timeout != null){
                clearTimeout(transactions[id].timeout);
                transactions[id].timeout = null;
            }

            delete transactions[id];

            emitSocketToRoom(row1[0].userid, 'message', 'info', {
                message: 'Your cash deposit order has been canceled!'
            });

            loggerDebug('[CASH] Deposit order #' + id + ' has been canceled');

            callback(null);
        });
    });
}

/* ----- INTERNAL USAGE ----- */
function createPayment(amount, options, callback) {
    if(typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = options || {};

    if(!paypalService.isConfigured()) {
        return callback(new Error('PayPal is not connected. Ask an admin to connect PayPal.'));
    }

    var base = config.app.url.replace(/\/$/, '');
    var returnUrl = base + '/deposit/paypal/return';
    var cancelUrl = base + '/deposit/paypal/cancel';

    paypalService.createOrder(amount, returnUrl, cancelUrl, options, function(err1, order) {
        if(err1) {
            loggerError(err1);
            return callback(new Error(err1.message || 'An error occurred while creating PayPal payment'));
        }

        callback(null, order);
    });
}

function createCheckoutOrder(user, amount, options, callback){
    if(typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = options || {};

    if(!user || !user.userid) return callback(new Error('You must be logged in'));

    if((user.restrictions && (user.restrictions.trade >= time() || user.restrictions.trade == -1)) && !haveRankPermission('exclude_ban_trade', user.rank)){
        return callback(new Error('You are restricted to use our trade.'));
    }

    if(user.exclusion > time()){
        return callback(new Error('Your exclusion expires ' + makeDate(new Date(user.exclusion * 1000)) + '.'));
    }

    verifyFormatAmount(amount, function(err1, amount){
        if(err1) return callback(err1);

        if(amount < config.app.intervals.amounts.deposit_cash.min || amount > config.app.intervals.amounts.deposit_cash.max){
            return callback(new Error('Invalid deposit amount [' + getFormatAmountString(config.app.intervals.amounts.deposit_cash.min) + '-' + getFormatAmountString(config.app.intervals.amounts.deposit_cash.max) + ']!'));
        }

        createPayment(amount, options, function(err2, payment) {
            if(err2) return callback(err2);

            pool.query('INSERT INTO `cash_transactions` SET `status` = 0, `type` = ' + pool.escape('deposit') + ', `userid` = ' + pool.escape(user.userid) + ', `name` = ' + pool.escape(user.name) + ', `avatar` = ' + pool.escape(user.avatar) + ', `xp` = ' + pool.escape(user.xp) + ', `transactionid` = ' + pool.escape(payment.id) + ', `currency` = ' + pool.escape(payment.currency) + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err3, row3) {
                if(err3) return callback(new Error('An error occurred while creating deposit'));

                transactions[row3.insertId] = {
                    timeout: setTimeout(function(){
                        cancelTransaction(row3.insertId, function(){});
                    }, config.trading.cash.time_cancel_transaction * 1000)
                };

                callback(null, {
                    id: payment.id,
                    amount: amount,
                    currency: payment.currency,
                    local_id: row3.insertId
                });
            });
        });
    });
}

function creditCompletedDeposit(id, userid, amount, currency, callback){
    userService.editBalance(userid, amount, currency + '_deposit', function(err1, newbalance1){
        if(err1) return callback(err1);

        pool.query('UPDATE `users` SET `rollover` = `rollover` + ' + amount + ' WHERE `userid` = ' + pool.escape(userid), function(err2) {
            if(err2) return callback(new Error('An error occurred while crediting deposit (1)'));

            userService.registerAffiliates(userid, amount, 'deposit', function(err3){
                if(err3) return callback(err3);

                userService.registerDepositBonus(userid, amount, function(err4, newbalance2){
                    if(err4) return callback(err4);

                    if(newbalance2) userService.updateBalance(userid, 'main', newbalance2);
                    else userService.updateBalance(userid, 'main', newbalance1);

                    pool.query('INSERT INTO `users_trades` SET `type` = ' + pool.escape('deposit') + ', `method` = ' + pool.escape('cash') + ', `option` = ' + pool.escape(currency) + ', `userid` = ' + pool.escape(userid) + ', `amount` = ' + amount + ', `value` = ' + amount + ', `tradeid` = ' + parseInt(id) + ', `time` = ' + pool.escape(time()), function(err5){
                        if(err5) return callback(new Error('An error occurred while crediting deposit (2)'));

                        emitSocketToRoom(userid, 'message', 'success', {
                            message: 'Your PayPal deposit of ' + getFormatAmountString(amount) + ' has been credited!'
                        });

                        loggerDebug('[CASH] Deposit order #' + id + ' has been finished via PayPal');

                        callback(null);
                    });
                });
            });
        });
    });
}

/**
 * Credit balance ONLY after PayPal Orders v2 server-side verification.
 * options.userid — required for browser-initiated capture (ownership lock)
 * options.source — 'user' | 'webhook' | 'return'
 */
function completePayPalDeposit(orderId, options, callback){
    if(typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = options || {};

    if(!orderId) return callback(new Error('Missing PayPal order'));

    // Only accept order IDs that look like PayPal order ids (never trust client amounts)
    orderId = String(orderId).trim();
    if(!/^[A-Z0-9]{10,50}$/i.test(orderId)) {
        return callback(new Error('Invalid PayPal order'));
    }

    pool.query('SELECT `id`, `userid`, `status`, `amount`, `paid` FROM `cash_transactions` WHERE `transactionid` = ' + pool.escape(orderId) + ' AND `type` = ' + pool.escape('deposit'), function(err1, row1) {
        if(err1) return callback(new Error('An error occurred while completing PayPal deposit (1)'));
        if(row1.length <= 0) return callback(new Error('PayPal deposit order not found'));

        var id = row1[0].id;
        var userid = row1[0].userid;
        var status = parseInt(row1[0].status, 10);
        var expected = getFormatAmount(row1[0].amount);

        // Ownership lock — front-end capture cannot complete another user's order
        if(options.userid && String(options.userid) !== String(userid)) {
            return callback(new Error('This payment does not belong to your account.'));
        }

        if(status === 5) {
            return callback(null, {
                already: true,
                id: id,
                amount: getFormatAmount(row1[0].paid || row1[0].amount),
                currency: getCashCurrency(),
                order_id: orderId
            });
        }
        if(status < 0) return callback(new Error('This PayPal deposit was canceled'));

        // Capture (if needed) + verify via capture response / GET with short retries
        paypalService.captureAndVerifyOrder(orderId, expected, function(err2, verified) {
            if(err2) {
                loggerError(err2);
                // Keep pending for retryable "still processing" — do not kill the order
                if(err2.retryable) {
                    return callback(err2);
                }
                pool.query('UPDATE `cash_transactions` SET `status` = -2 WHERE `id` = ' + pool.escape(id) + ' AND `status` >= 0 AND `status` != 5', function() {
                    callback(err2);
                });
                return;
            }

            var amount = getFormatAmount(verified.paid);
            var currency = verified.currency || getCashCurrency();

            // Atomic: only one credit can win this update
            pool.query('UPDATE `cash_transactions` SET `status` = 5, `paid` = ' + amount + ' WHERE `id` = ' + pool.escape(id) + ' AND `status` >= 0 AND `status` != 5', function(err3, row3) {
                if(err3) return callback(new Error('An error occurred while completing PayPal deposit (2)'));
                if(row3.affectedRows <= 0) {
                    return callback(null, { already: true, id: id, amount: amount, currency: currency, order_id: orderId });
                }

                if(transactions[id] && transactions[id].timeout != null){
                    clearTimeout(transactions[id].timeout);
                    transactions[id].timeout = null;
                }
                delete transactions[id];

                creditCompletedDeposit(id, userid, amount, currency, function(err4) {
                    if(err4) return callback(err4);
                    callback(null, {
                        id: id,
                        amount: amount,
                        currency: currency,
                        capture_id: verified.capture_id || '',
                        order_id: orderId,
                        verified: true
                    });
                });
            });
        });
    });
}

function getPaidDepositForUser(userid, orderId, callback){
    if(!userid || !orderId) return callback(new Error('Missing payment lookup'));

    pool.query('SELECT `id`, `userid`, `status`, `amount`, `paid`, `currency`, `transactionid` FROM `cash_transactions` WHERE `transactionid` = ' + pool.escape(orderId) + ' AND `userid` = ' + pool.escape(userid) + ' AND `type` = ' + pool.escape('deposit') + ' LIMIT 1', function(err1, row1) {
        if(err1) return callback(err1);
        if(row1.length <= 0) return callback(new Error('Payment not found'));
        if(parseInt(row1[0].status, 10) !== 5) return callback(new Error('Payment is not completed'));

        callback(null, {
            id: row1[0].id,
            amount: getFormatAmount(row1[0].paid || row1[0].amount),
            currency: row1[0].currency || getCashCurrency(),
            order_id: row1[0].transactionid
        });
    });
}

function cancelPayPalDeposit(orderId, callback){
    if(!orderId) return callback(null);

    pool.query('SELECT `id` FROM `cash_transactions` WHERE `transactionid` = ' + pool.escape(orderId) + ' AND `status` >= 0 AND `status` != 5 AND `type` = ' + pool.escape('deposit'), function(err1, row1) {
        if(err1) return callback(err1);
        if(row1.length <= 0) return callback(null);

        cancelTransaction(row1[0].id, callback);
    });
}

function updateTransaction(transaction, callback){
    var transactionid = transaction.data.object.id;

    pool.query('SELECT `id`, `userid`, `status`, `paid` FROM `cash_transactions` WHERE `transactionid` = ' + pool.escape(transactionid), function(err1, row1) {
        if(err1) return callback(new Error('An error occurred while updating transaction (1)'));

        if(row1.length <= 0) return callback(new Error('An error occurred while updating transaction (2)'));

        var id = row1[0].id;
		var userid = row1[0].userid;

        var status = {
            'payment_intent.created': 0,
            'payment_intent.processing': 1,
            'payment_intent.requires_action': 2,
            'payment_intent.amount_capturable_updated': 3,
            'payment_intent.partially_funded': 4,
            'payment_intent.succeeded': 5,
            'payment_intent.canceled': -1,
            'payment_intent.payment_failed': -2
        }[transaction.type];

        if(status === undefined) {
            loggerError('[CASH] Transaction status ' + transaction.type + ' unmapped');

            return callback(new Error('Transaction status unmapped'));
        }

        if(status == parseInt(row1[0].status) && status != 3) return callback(null);

        if(status == 5){
            var amount = getFormatAmount(parseFloat(transaction.data.object.amount_received) / 100);

            pool.query('UPDATE `cash_transactions` SET `status` = ' + status + ', `paid` = ' + amount + ' WHERE `id` = ' + pool.escape(id), function(err2, row2) {
                if(err2) return callback(new Error('An error occurred while updating transaction (3)'));

                if(row2.affectedRows <= 0) return callback(new Error('An error occurred while updating transaction (4)'));

                creditCompletedDeposit(id, userid, amount, getCashCurrency(), callback);
            });
        } else if(status < 0){
            var amount = getFormatAmount(row1[0].paid);

            if(transaction.data.object.amount_received !== undefined) amount = getFormatAmount(parseFloat(transaction.data.object.amount_received) / 100);

            pool.query('UPDATE `cash_transactions` SET `status` = ' + status + ', `paid` = ' + amount + ' WHERE `id` = ' + pool.escape(id), function(err2, row2) {
                if(err2) return callback(new Error('An error occurred while updating transaction (7)'));

                if(row2.affectedRows <= 0) return callback(new Error('An error occurred while updating transaction (8)'));

                emitSocketToRoom(userid, 'message', 'info', {
                    message: 'Your cash deposit order has been canceled!'
                });

                loggerDebug('[CASH] Deposit order #' + id + ' has been canceled');

                callback(null);
            });
        } else {
            var amount = getFormatAmount(row1[0].paid);

            if(transaction.data.object.amount_received !== undefined) amount = getFormatAmount(parseFloat(transaction.data.object.amount_received) / 100);

            pool.query('UPDATE `cash_transactions` SET `status` = ' + status + ', `paid` = ' + amount + ' WHERE `id` = ' + pool.escape(id), function(err2, row2) {
                if(err2) return callback(new Error('An error occurred while updating transaction (9)'));

                if(row2.affectedRows <= 0) return callback(new Error('An error occurred while updating transaction (10)'));

                callback(null);
            });
        }
    });
}

/* ----- CLIENT USAGE ----- */
function placeDeposit(user, socket, method, amount, cooldown){
    cooldown(true, true);

    if((user.restrictions.trade >= time() || user.restrictions.trade == -1) && !haveRankPermission('exclude_ban_trade', user.rank)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You are restricted to use our trade. The restriction expires ' + ((user.restrictions.trade == -1) ? 'never' : makeDate(new Date(user.restrictions.trade * 1000))) + '.'
        });

        return cooldown(false, true);
    }

	if(user.exclusion > time()){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Your exclusion expires ' + makeDate(new Date(user.exclusion * 1000)) + '.'
		});

		return cooldown(false, true);
	}

    verifyFormatAmount(amount, function(err1, amount){
		if(err1) {
			emitSocketToUser(socket, 'message', 'error', {
				message: err1.message
			});

			return cooldown(false, true);
		}

        if(amount < config.app.intervals.amounts.deposit_cash.min || amount > config.app.intervals.amounts.deposit_cash.max){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid deposit amount [' + getFormatAmountString(config.app.intervals.amounts.deposit_cash.min) + '-' + getFormatAmountString(config.app.intervals.amounts.deposit_cash.max) + ']!'
            });

            return cooldown(false, true);
        }

        // TEST MODE disabled for live PayPal — never credit without PayPal verification
        if(config.trading.cash.test_mode) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Test deposits are disabled. Pay with PayPal Card Fields on the deposit page.'
            });
            return cooldown(false, true);
        }

        createPayment(amount, function(err2, payment) {
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: err2.message
                });

                return cooldown(false, true);
            }

            pool.query('INSERT INTO `cash_transactions` SET `status` = 0, `type` = ' + pool.escape('deposit') + ', `userid` = ' + pool.escape(user.userid) + ', `name` = ' + pool.escape(user.name) + ', `avatar` = ' + pool.escape(user.avatar) + ', `xp` = ' + pool.escape(user.xp) + ', `transactionid` = ' + pool.escape(payment.id) + ', `currency` = ' + pool.escape(payment.currency) + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err3, row3) {
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while placing deposit (1)'
                    });

                    return cooldown(false, true);
                }

                transactions[row3.insertId] = {
                    timeout: setTimeout(function(){
                        cancelTransaction(row3.insertId, function(err4){
                            if(err4) {
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: err4.message
                                });

                                return cooldown(false, true);
                            }
                        });
                    }, config.trading.cash.time_cancel_transaction * 1000)
                };

                emitSocketToUser(socket, 'offers', 'cash_payment', {
                    payment: {
                        provider: 'paypal',
                        order_id: payment.id,
                        approve_url: payment.approve_url
                    },
                    user: {
                        name: user.name,
                        email: user.email
                    }
                });

                emitSocketToUser(socket, 'message', 'info', {
                    message: 'Redirecting you to PayPal to complete payment...'
                });

                cooldown(false, false);
            });
        });
    });
}

/* ----- TEST MODE ----- */
function placeTestDeposit(user, socket, method, amount, cooldown){
    var currency = getCashCurrency();
    var transactionid = ('ts_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).slice(0, 27);

    pool.query('INSERT INTO `cash_transactions` SET `status` = 5, `type` = ' + pool.escape('deposit') + ', `userid` = ' + pool.escape(user.userid) + ', `name` = ' + pool.escape(user.name) + ', `avatar` = ' + pool.escape(user.avatar) + ', `xp` = ' + pool.escape(user.xp) + ', `transactionid` = ' + pool.escape(transactionid) + ', `currency` = ' + pool.escape(currency) + ', `amount` = ' + amount + ', `paid` = ' + amount + ', `time` = ' + pool.escape(time()), function(err1, row1){
        if(err1){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while placing test deposit (1)'
            });

            return cooldown(false, true);
        }

        creditCompletedDeposit(row1.insertId, user.userid, amount, currency, function(err2){
            if(err2){
                emitSocketToUser(socket, 'message', 'error', {
                    message: err2.message || 'An error occurred while placing test deposit'
                });

                return cooldown(false, true);
            }

            emitSocketToUser(socket, 'message', 'success', {
                message: '[TEST] Your ' + (method == 'paypal' ? 'PayPal' : 'card') + ' deposit of ' + getFormatAmountString(amount) + ' was credited instantly. No real payment was made.'
            });

            cooldown(false, false);
        });
    });
}

module.exports = {
    initializeTransactions,
    updateTransaction,
    placeDeposit,
    createCheckoutOrder,
    completePayPalDeposit,
    cancelPayPalDeposit,
    getPaidDepositForUser
};
