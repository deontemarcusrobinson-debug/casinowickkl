var request = require('request');

var { pool } = require('@/lib/database.js');
var { loggerDebug, loggerError, loggerInfo } = require('@/lib/logger.js');

var { totp } = require('@/lib/totp.js');

var userService = require('@/services/userService.js');

var { makeDate, time } = require('@/utils/formatDate.js');
var { roundedToFixed, getFormatAmount, getFormatAmountString, verifyFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');
var { haveRankPermission, verifyRecaptcha, isJsonString } = require('@/utils/utils.js');

var config = require('@/config/config.js');

var amounts = {};
var fees = {};

var updating = {
	value: false
};

var COINGECKO_IDS = {
    btc: 'bitcoin',
    eth: 'ethereum',
    ltc: 'litecoin',
    bch: 'bitcoin-cash',
    doge: 'dogecoin',
    sol: 'solana',
    xrp: 'ripple',
    trx: 'tron',
    ton: 'the-open-network',
    bnbbsc: 'binancecoin',
    usdttrc20: 'tether',
    usdterc20: 'tether',
    usdtbsc: 'tether',
    usdtsol: 'tether',
    usdtmatic: 'tether',
    usdc: 'usd-coin'
};

function initializeCurrencies(){
	loggerDebug('[CRYPTO] Loading Currencies');
	updating.value = true;

	updateCurrencies(0, function(err1){
        if(err1) {
            loggerInfo('[CRYPTO] Error In Loading Currencies: ' + (err1.message || err1));
            // Don't block deposits forever — retry later, allow house-wallet flow
            updating.value = false;

            return setTimeout(function(){
                initializeCurrencies();
            }, 60 * 1000);
        }

        updating.value = false;
        loggerInfo('[CRYPTO] Currencies loaded');

        setTimeout(function(){
            initializeCurrencies();
        }, 5 * 60 * 1000);
	});
}

/* ----- INTERNAL USAGE ----- */
function updateCurrencies(item, callback){
    var keys = Object.keys(config.settings.payments.methods.crypto);
    if(item >= keys.length) return callback(null);

    var currency = keys[item];

    getCurrencyAmount(currency, function(err1, price){
        if(err1 || !(price > 0)) {
            loggerInfo('[CRYPTO] Skip price for ' + currency.toUpperCase() + ': ' + ((err1 && err1.message) || 'invalid'));
            fees[currency] = fees[currency] || 0;
            return updateCurrencies(item + 1, callback);
        }

        getCurrencyWithdrawFee(currency, function(err2, fee){
            amounts[currency] = price;
            fees[currency] = (err2 || !(fee >= 0)) ? 0 : fee;

            loggerDebug('[CRYPTO] Price And Withdraw Fee Loaded for ' + currency.toUpperCase() + ' Currency');

            updateCurrencies(item + 1, callback);
        });
    });
}

/* ----- INTERNAL USAGE ----- */
function getCurrencyAmount(currency, callback){
    var apiKey = config.trading.crypto.nowpayments && config.trading.crypto.nowpayments.api_key;

    if(!apiKey) {
        return getCurrencyAmountCoinGecko(currency, callback);
    }

    var options = {
        'method': 'GET',
        'url': 'https://api.nowpayments.io/v1/estimate?amount=1&currency_from=' + currency + '&currency_to=usd',
        'timeout': 10000,
        'headers': {
            'x-api-key': apiKey
        }
    };

	request(options, function(err1, response1, body1) {
		if(err1 || !response1 || response1.statusCode != 200 || !isJsonString(body1)) {
            loggerError(err1 || ('NOWPayments estimate HTTP ' + (response1 && response1.statusCode)));
            return getCurrencyAmountCoinGecko(currency, callback);
        }

        var body = JSON.parse(body1);
        var price = parseFloat(body['estimated_amount']);

        if(!(price > 0)) return getCurrencyAmountCoinGecko(currency, callback);

        callback(null, price);
	});
}

function getCurrencyAmountCoinGecko(currency, callback) {
    currency = String(currency || '').toLowerCase();
    if(['usdttrc20', 'usdterc20', 'usdtbsc', 'usdtsol', 'usdtmatic', 'usdc'].indexOf(currency) !== -1) {
        return callback(null, 1);
    }

    var id = COINGECKO_IDS[currency];
    if(!id) return callback(new Error('No price source for ' + currency.toUpperCase()));

    request({
        method: 'GET',
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=' + encodeURIComponent(id) + '&vs_currencies=usd',
        json: true,
        timeout: 15000
    }, function(err, res, body) {
        if(err || !body || !body[id] || !(body[id].usd > 0)) {
            return callback(new Error('Could not load price for ' + currency.toUpperCase()));
        }
        callback(null, parseFloat(body[id].usd));
    });
}

/* ----- INTERNAL USAGE ----- */
function getCurrencyWithdrawFee(currency, callback){
    var apiKey = config.trading.crypto.nowpayments && config.trading.crypto.nowpayments.api_key;
    if(!apiKey) return callback(null, 0);

    var options = {
        'method': 'GET',
        'url': 'https://api.nowpayments.io/v1/payout/fee?currency=' + currency + '&amount=10',
        'timeout': 10000,
        'headers': {
            'x-api-key': apiKey
        }
    };

	request(options, function(err1, response1, body1) {
		if(err1 || !response1 || response1.statusCode != 200 || !isJsonString(body1)) {
            return callback(null, 0);
        }

        try {
            var body = JSON.parse(body1);
            var fee = parseFloat(body.fee != null ? body.fee : 0);
            return callback(null, fee > 0 ? fee : 0);
        } catch (e) {
            return callback(null, 0);
        }
	});
}

function updateTransaction(transaction, callback){
    var transactionid = transaction.payment_id;

    pool.query('SELECT `id`, `type`, `status`, `userid`, `currency`, `exchange`, `paid` FROM `crypto_transactions` WHERE `transactionid` = ' + pool.escape(transactionid), function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while updating transaction (1)'));

        if(row1.length <= 0) return callback(new Error('An error occurred while updating transaction (2)'));

        var id = row1[0].id;
        var type = row1[0].type;

        var status = {
            'deposit': {
                'waiting': 0,
                'confirming': 1,
                'confirmed': 2,
                'sending': 3,
                'partially_paid': 4,
                'finished': 5,
                'expired': -1,
                'failed': -2,
                'refunded': -3
            },
            'withdraw': {
                'creating': 0,
                'waiting': 1,
                'processing': 2,
                'sending': 3,
                'finished': 4,
                'rejected': -1,
                'failed': -2
            }
        }[type][transaction.payment_status.toLowerCase()];

        if(status === undefined) {
            loggerError('[CRYPTO] Transaction ' + type + ' status ' + transaction.payment_status.toLowerCase() + ' unmapped');

            return callback(new Error('Transaction status unmapped'));
        }

        if(status == parseInt(row1[0].status) && (type != 'deposit' || status != 4)) return callback(null);

		var currency = row1[0].currency;

		var userid = row1[0].userid;

        if(type == 'deposit'){
			if(status == 5){
                var paid = parseFloat(transaction.actually_paid);

		        var exchange = parseFloat(row1[0].exchange);
                var amount = getFormatAmount(paid * exchange);

                pool.query('UPDATE `crypto_transactions` SET `status` = ' + status + ', `paid` = ' + paid + ' WHERE `id` = ' + pool.escape(id), function(err2, row2) {
                    if(err2) return callback(new Error('An error occurred while updating transaction (3)'));

                    if(row2.affectedRows <= 0) return callback(new Error('An error occurred while updating transaction (4)'));

                    //EDIT BALANCE
                    userService.editBalance(userid, amount, currency + '_deposit', function(err3, newbalance1){
                        if(err3) return callback(err3);

                        pool.query('UPDATE `users` SET `rollover` = `rollover` + ' + amount + ' WHERE `userid` = ' + pool.escape(userid), function(err4) {
                            if(err4) return callback(new Error('An error occurred while updating transaction (5)'));

                            //REGISTER AFFILIATES
                            userService.registerAffiliates(userid, amount, 'deposit', function(err5){
                                if(err5) return callback(err5);

                                //REGISTER DEPOSIT BONUS
                                userService.registerDepositBonus(userid, amount, function(err6, newbalance2){
                                    if(err6) return callback(err6);

                                    if(newbalance2) userService.updateBalance(userid, 'main', newbalance2);
                                    else userService.updateBalance(userid, 'main', newbalance1);

                                    pool.query('INSERT INTO `users_trades` SET `type` = ' + pool.escape(type) + ', `method` = ' + pool.escape("crypto") + ', `option` = ' + pool.escape(currency) + ', `userid` = ' + pool.escape(userid) + ', `amount` = ' + amount + ', `value` = ' + paid + ', `tradeid` = ' + parseInt(id) + ', `time` = ' + pool.escape(time()), function(err7){
                                        if(err7) return callback(new Error('An error occurred while updating transaction (6)'));

                                        emitSocketToRoom(userid, 'message', 'success', {
                                            message: 'Your crypto deposit order has been finished! You received the money.'
                                        });

                                        loggerDebug('[CRYPTO] Deposit order #' + id + ' has been finished');

                                        callback(null);
                                    });
                                });
                            });
                        });
                    });
                });
            } else if(status < 0){
				var paid = parseFloat(row1[0].paid);

                if(transaction.actually_paid !== undefined) paid = parseFloat(transaction.actually_paid);

                pool.query('UPDATE `crypto_transactions` SET `status` = ' + status + ', `paid` = ' + paid + ' WHERE `id` = ' + pool.escape(id), function(err2, row2) {
					if(err2) return callback(new Error('An error occurred while updating transaction (7)'));

					if(row2.affectedRows <= 0) return callback(new Error('An error occurred while updating transaction (8)'));

					emitSocketToRoom(userid, 'message', 'info', {
                        message: 'Your crypto deposit order has been canceled!'
                    });

                    loggerDebug('[CRYPTO] Deposit order #' + id + ' has been canceled');

                    callback(null);
				});
			} else {
                var paid = parseFloat(row1[0].paid);

                if(transaction.actually_paid !== undefined) paid = parseFloat(transaction.actually_paid);

                pool.query('UPDATE `crypto_transactions` SET `status` = ' + status + ', `paid` = ' + paid + ' WHERE `id` = ' + pool.escape(id), function(err2, row2) {
                    if(err2) return callback(new Error('An error occurred while updating transaction (9)'));

                    if(row2.affectedRows <= 0) return callback(new Error('An error occurred while updating transaction (10)'));

                    callback(null);
                });
            }
		} else if(type == 'withdraw'){
			if(status == 4){
                var amount = getFormatAmount(transaction.amount);

                var exchange = parseFloat(row1[0].exchange);
                var value = roundedToFixed(amount / exchange, 6);

				pool.query('UPDATE `crypto_transactions` SET `status` = ' + status + ' WHERE `id` = ' + pool.escape(id), function(err2, row2) {
					if(err2) return callback(new Error('An error occurred while updating transaction (11)'));

					if(row2.affectedRows <= 0) return callback(new Error('An error occurred while updating transaction (12)'));

					pool.query('INSERT INTO `users_trades` SET `type` = ' + pool.escape(type) + ', `method` = ' + pool.escape("crypto") + ', `option` = ' + pool.escape(currency) + ', `userid` = ' + pool.escape(userid) + ', `amount` = ' + amount + ', `value` = ' + value + ', `tradeid` = '+ parseInt(id) + ', `time` = ' + pool.escape(time()), function(err3){
						if(err3) return callback(new Error('An error occurred while updating transaction (13)'));

						emitSocketToRoom(userid, 'message', 'success', {
                            message: 'Your crypto withdraw order has been finished!'
                        });

                        loggerDebug('[CRYPTO] Withdraw order #' + id + ' has been finished');

                        callback(null);
					});
				});
			} else if(status < 0){
				var amount = getFormatAmount(transaction.amount);

                pool.query('UPDATE `crypto_transactions` SET `status` = ' + status + ' WHERE `id` = ' + pool.escape(id), function(err2, row2) {
					if(err2) return callback(new Error('An error occurred while updating transaction (14)'));

					if(row2.affectedRows <= 0) return callback(new Error('An error occurred while updating transaction (15)'));

					//EDIT BALANCE
					userService.editBalance(userid, amount, currency + '_withdraw_refund', function(err3, newbalance){
						if(err3) return callback(err3);

						userService.updateBalance(userid, 'main', newbalance);

						emitSocketToRoom(userid, 'message', 'info', {
                            message: 'Your crypto withdraw order has been canceled!'
                        });

                        loggerDebug('[CRYPTO] Withdraw order #' + id + ' has been refunded');

                        callback(null);
					});
				});
			} else {
                pool.query('UPDATE `crypto_transactions` SET `status` = ' + status + ' WHERE `id` = ' + pool.escape(id), function(err2, row2) {
					if(err2) return callback(new Error('An error occurred while updating transaction (16)'));

                    if(row2.affectedRows <= 0) return callback(new Error('An error occurred while updating transaction (17)'));

                    callback(null);
                });
            }
		} else callback(null);
    });
}

/* ----- INTERNAL USAGE ----- */
function generateToken(callback){
    var options = {
        'method': 'POST',
        'url': 'https://api.nowpayments.io/v1/auth',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'email': config.trading.crypto.nowpayments.email,
            'password': config.trading.crypto.nowpayments.password
        })
    };

    request(options, function(err1, response1, body1) {
		if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while generating token (1)'));
        }

        if(!response1 || response1.statusCode != 200) return callback(new Error('An error occurred while generating token (2)'));
		if(!isJsonString(body1)) return callback(new Error('An error occurred while generating token (3)'));

        var body = JSON.parse(body1);

        callback(null, body.token);
	});
}

/* ----- INTERNAL USAGE ----- */
function verifyAddress(address, currency, callback){
    var options = {
        'method': 'POST',
        'url': 'https://api.nowpayments.io/v1/payout/validate-address',
        'headers': {
            'x-api-key': config.trading.crypto.nowpayments.api_key,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'address': address,
            'currency': currency
        })
    };

    request(options, function(err1, response1, body1) {
		if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while verifying address (1)'));
        }

        if(!response1 || response1.statusCode != 200) return callback(null, false);

        callback(null, true);
	});
}

/* ----- INTERNAL USAGE ----- */
function verifyBalance(currency, token, callback){
    var options = {
        'method': 'GET',
        'url': 'https://api.nowpayments.io/v1/balance',
        'headers': {
            'x-api-key': config.trading.crypto.nowpayments.api_key,
            'Authorization': 'Bearer ' + token
        }
    };

    request(options, function(err1, response1, body1) {
		if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while verifying balance (1)'));
        }

        if(!response1 || response1.statusCode != 200) return callback(new Error('An error occurred while verifying balance (2)'));
		if(!isJsonString(body1)) return callback(new Error('An error occurred while verifying balance (3)'));

        var body = JSON.parse(body1);

        if(body[currency] === undefined) return callback(null, 0);

        callback(null, body[currency].amount);
	});
}

/* ----- INTERNAL USAGE ----- */
function getMinimumDeposit(currency, callback){
    var options = {
        'method': 'GET',
        'url': 'https://api.nowpayments.io/v1/min-amount',
        'qs': {
            'currency_from': currency,
            'currency_to': currency,
            'is_fixed_rate': true,
            'is_fee_paid_by_user': true
        },
        'headers': {
            'x-api-key': config.trading.crypto.nowpayments.api_key
        }
    };

    request(options, function(err1, response1, body1) {
		if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while getting minimum deposit (1)'));
        }

        if(!response1 || response1.statusCode != 200) return callback(new Error('An error occurred while getting minimum deposit (2)'));
		if(!isJsonString(body1)) return callback(new Error('An error occurred while getting minimum deposit (3)'));

        var body = JSON.parse(body1);

        callback(null, parseFloat(body['min_amount']));
	});
}

/* ----- INTERNAL USAGE ----- */
function getMinimumWithdraw(currency, callback){
    var options = {
        'method': 'GET',
        'url': 'https://api.nowpayments.io/v1/payout-withdrawal/min-amount/' + currency,
        'headers': {
            'x-api-key': config.trading.crypto.nowpayments.api_key
        }
    };

    request(options, function(err1, response1, body1) {
		if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while getting minimum withdraw (1)'));
        }

        if(!response1 || response1.statusCode != 200) return callback(new Error('An error occurred while getting minimum withdraw (2)'));
		if(!isJsonString(body1)) return callback(new Error('An error occurred while getting minimum withdraw (3)'));

        var body = JSON.parse(body1);

        callback(null, parseFloat(body['result']));
	});
}

/* ----- INTERNAL USAGE ----- */
function createPayout(address, currency, value, token, callback){
    var options = {
        'method': 'POST',
        'url': 'https://api.nowpayments.io/v1/payout',
        'headers': {
            'Authorization': 'Bearer ' + token,
            'x-api-key': config.trading.crypto.nowpayments.api_key,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'ipn_callback_url': config.app.url + config.trading.crypto.nowpayments.callback_url,
            'withdrawals': [{
                'address': address,
                'currency': currency,
                'amount': value,
                'ipn_callback_url': config.app.url + config.trading.crypto.nowpayments.callback_url
            }]
        })
    };

    request(options, function(err1, response1, body1) {
        if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while creating payout (1)'));
        }

        if(!response1 || response1.statusCode != 200) return callback(new Error('An error occurred while creating payout (2)'));
        if(!isJsonString(body1)) return callback(new Error('An error occurred while creating payout (3)'));

        var body = JSON.parse(body1);

        callback(null, body);
    });
}

/* ----- INTERNAL USAGE ----- */
function verifyPayout(id, token, callback){
    var options = {
        'method': 'POST',
        'url': 'https://api.nowpayments.io/v1/payout/' + id + '/verify',
        'headers': {
            'Authorization': 'Bearer ' + token,
            'x-api-key': config.trading.crypto.nowpayments.api_key,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'verification_code': totp.generateToken(config.trading.crypto.nowpayments.twofa_secret_key)
        })
    };

    request(options, function(err1, response1, body1) {
        if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while verifying payout (1)'));
        }

        if(!response1 || response1.statusCode != 200) return callback(new Error('An error occurred while verifying payout (2)'));

        callback(null);
    });
}

/* ----- INTERNAL USAGE ----- */
function createPayment(currency, value, callback){
    var options = {
        'method': 'POST',
        'url': 'https://api.nowpayments.io/v1/payment',
        'headers': {
            'x-api-key': config.trading.crypto.nowpayments.api_key,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'price_amount': value,
            'price_currency': currency,
            'pay_currency': currency,
            'is_fixed_rate': true,
            'is_fee_paid_by_user': true,
            'ipn_callback_url': config.app.url + config.trading.crypto.nowpayments.callback_url
        })
    };

    request(options, function(err1, response1, body1) {
        if(err1) {
            loggerError(err1);

            return callback(new Error('An error occurred while creating payment (1)'));
        }

        if(!response1 || response1.statusCode != 201) return callback(new Error('An error occurred while creating payment (2)'));
        if(!isJsonString(body1)) return callback(new Error('An error occurred while creating payment (3)'));

        var body = JSON.parse(body1);

        callback(null, body);
    });
}

/* ----- CLIENT USAGE ----- */
function placeDeposit(user, socket, currency, value, cooldown){
	cooldown(true, true);

    currency = String(currency || '').toLowerCase();

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

    var blockchainVerify = require('@/services/trading/blockchainVerify.js');
    var houseWallet = blockchainVerify.getWallet(currency);

    // House-wallet deposits: show exact amount + your address (no NOWPayments)
    if(houseWallet) {
        return placeHouseWalletDeposit(user, socket, currency, value, houseWallet, cooldown);
    }

	if(amounts[currency] === undefined || amounts[currency] <= 0){
        // Try load price on the fly
        return getCurrencyAmount(currency, function(errP, price){
            if(errP || !(price > 0)) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'The prices are not loaded. Please try again later!'
                });
                return cooldown(false, true);
            }
            amounts[currency] = price;
            placeDeposit(user, socket, currency, value, cooldown);
        });
    }

    if(isNaN(Number(value))){
		emitSocketToUser(socket, 'message', 'error', {
			message: 'Invalid deposit value!'
		});

		return cooldown(false, true);
	}

    value = roundedToFixed(parseFloat(value), 8);

    getMinimumDeposit(currency, function(err1, minvalue){
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', {
                message: err1.message
            });

            return cooldown(false, true);
        }

        if(value < minvalue){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid deposit value. Please deposit at least ' + minvalue + ' ' + currency.toUpperCase() + '!'
            });

            return cooldown(false, true);
        }

        var exchange = amounts[currency];
        var amount = getFormatAmount(value * exchange);

        if(amount < config.app.intervals.amounts.deposit_crypto.min || amount > config.app.intervals.amounts.deposit_crypto.max){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid deposit amount [' + getFormatAmountString(config.app.intervals.amounts.deposit_crypto.min) + '-' + getFormatAmountString(config.app.intervals.amounts.deposit_crypto.max) + ']!'
            });

            return cooldown(false, true);
        }

        createPayment(currency, value, function(err2, payment){
            if(err2) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: err2.message
                });

                return cooldown(false, true);
            }

            var status = {
                'waiting': 0,
                'confirming': 1,
                'confirmed': 2,
                'sending': 3,
                'partially_paid': 4,
                'finished': 5,
                'expired': -1,
                'failed': -2
            }[payment.payment_status.toLowerCase()];

            pool.query('INSERT INTO `crypto_transactions` SET `status` = ' + status + ', `type` = ' + pool.escape('deposit') + ', `userid` = ' + pool.escape(user.userid) + ', `name` = ' + pool.escape(user.name) + ', `avatar` = ' + pool.escape(user.avatar) + ', `xp` = ' + pool.escape(user.xp) + ', `transactionid` = ' + pool.escape(payment.payment_id) + ', `address` = ' + pool.escape(payment.pay_address) + ', `currency` = ' + pool.escape(currency) + ', `amount` = ' + amount + ', `value` = ' + value + ', `exchange` = ' + exchange + ', `time` = ' + pool.escape(time()), function(err3, row3) {
                if(err3) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while placing deposit (1)'
                    });

                    return cooldown(false, true);
                }

                emitSocketToUser(socket, 'offers', 'crypto_payment', {
                    payment: {
                        address: payment.pay_address,
                        value: value,
                        amount: amount
                    }
                });

                emitSocketToUser(socket, 'message', 'info', {
                    message: 'Your crypto deposit payment has been created!'
                });

                cooldown(false, false);
            });
        });
    });
}

function placeHouseWalletDeposit(user, socket, currency, value, houseWallet, cooldown) {
    function withRate(rate) {
        if(isNaN(Number(value))){
            emitSocketToUser(socket, 'message', 'error', { message: 'Invalid deposit value!' });
            return cooldown(false, true);
        }

        value = roundedToFixed(parseFloat(value), 8);
        if(!(value > 0)) {
            emitSocketToUser(socket, 'message', 'error', { message: 'Invalid deposit value!' });
            return cooldown(false, true);
        }

        var amount = getFormatAmount(value * rate);
        var limits = config.app.intervals.amounts.deposit_crypto_hash || config.app.intervals.amounts.deposit_crypto;

        if(amount < limits.min || amount > limits.max){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid deposit amount [' + getFormatAmountString(limits.min) + '-' + getFormatAmountString(limits.max) + ']!'
            });
            return cooldown(false, true);
        }

        emitSocketToUser(socket, 'offers', 'crypto_payment', {
            payment: {
                address: houseWallet,
                value: value,
                amount: amount,
                currency: currency,
                house: true
            }
        });

        emitSocketToUser(socket, 'message', 'success', {
            message: 'Send exactly ' + value + ' ' + currency.toUpperCase() + ' to ' + houseWallet + ' then paste your TX hash below and submit.'
        });

        cooldown(false, false);
    }

    if(amounts[currency] > 0) return withRate(amounts[currency]);

    getCurrencyAmount(currency, function(err1, price) {
        if(err1 || !(price > 0)) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Could not load ' + currency.toUpperCase() + ' price. Please try again.'
            });
            return cooldown(false, true);
        }
        amounts[currency] = price;
        withRate(price);
    });
}

/* ----- CLIENT USAGE ----- */
function placeWithdraw(user, socket, currency, amount, address, recaptcha, cooldown){
	cooldown(true, true);

	verifyRecaptcha(recaptcha, function(verified){
		if(!verified){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Invalid recaptcha!'
			});

			return cooldown(false, true);
		}

        if((user.restrictions.trade >= time() || user.restrictions.trade == -1) && !haveRankPermission('exclude_ban_trade', user.rank)){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'You are restricted to use our trade. The restriction expires ' + ((user.restrictions.trade == -1) ? 'never' : makeDate(new Date(user.restrictions.trade * 1000))) + '.'
            });

            return cooldown(false, true);
        }

        if(amounts[currency] === undefined || amounts[currency] <= 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'The prices are not loaded. Please try again later!'
            });

            return cooldown(false, true);
        }

        verifyFormatAmount(amount, function(err1, amount){
            if(err1){
                emitSocketToUser(socket, 'message', 'error', {
                    message: err1.message
                });

                return cooldown(false, true);
            }

            if((amount < config.app.intervals.amounts.withdraw_crypto.min || amount > config.app.intervals.amounts.withdraw_crypto.max) && !haveRankPermission('withdraw', user.rank)){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'Invalid withdraw amount [' + getFormatAmountString(config.app.intervals.amounts.withdraw_crypto.min) + '-' + getFormatAmountString(config.app.intervals.amounts.withdraw_crypto.max) + ']!'
                });

                return cooldown(false, true);
            }

            pool.query('SELECT SUM(`amount`) AS `amount` FROM `users_trades` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `type` = ' + pool.escape('deposit') + ' AND `time` > ' + pool.escape(config.trading.withdraw_requirements.deposit.time == -1 ? 0 : time() - config.trading.withdraw_requirements.deposit.time), function(err2, row2) {
                if(err2){
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while placing withdraw (1)'
                    });

                    return cooldown(false, true);
                }

                if(getFormatAmount(row2[0].amount) < config.trading.withdraw_requirements.deposit.amount && !haveRankPermission('withdraw', user.rank)) {
                    if(config.trading.withdraw_requirements.deposit.time == -1){
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'You need to deposit minimum ' + getFormatAmountString(config.trading.withdraw_requirements.deposit.amount) + ' coins to unlock withdraw!'
                        });

                        return cooldown(false, true);
                    } else {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'You need to deposit minimum ' + getFormatAmountString(config.trading.withdraw_requirements.deposit.amount) + ' coins in the last ' + Math.floor(config.trading.withdraw_requirements.deposit.time / (24 * 60 * 60)) + ' days to unlock withdraw!'
                        });

                        return cooldown(false, true);
                    }
                }

                //CHECK BALANCE
                userService.getBalance(user.userid, function(err3, balance){
                    if(err3){
                        emitSocketToUser(socket, 'message', 'error', {
                            message: err3.message
                        });

                        return cooldown(false, true);
                    }

                    if(balance < amount){
                        emitSocketToRoom(user.userid, 'modal', 'insufficient_balance', {
                            amount: getFormatAmount(amount - balance)
                        });

                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'You don\'t have enough money to withdraw!'
                        });

                        return cooldown(false, true);
                    }

                    if(user.rollover > 0 && !haveRankPermission('withdraw', user.rank)) {
                        emitSocketToRoom(user.userid, 'modal', 'withdraw_rollover', {
                            amount: getFormatAmount(user.rollover)
                        });

                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'You have to play ' + getFormatAmountString(user.rollover) + ' coins to withdraw!'
                        });

                        return cooldown(false, true);
                    }

                    verifyAddress(address, currency, function(err4, valid){
                        if(err4){
                            emitSocketToUser(socket, 'message', 'error', {
                                message: err4.message
                            });

                            return cooldown(false, true);
                        }

                        if(!valid){
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'The address provided is not valid!'
                            });

                            return cooldown(false, true);
                        }

                        getMinimumWithdraw(currency, function(err5, minvalue){
                            if(err5){
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: err5.message
                                });

                                return cooldown(false, true);
                            }

                            var exchange = amounts[currency];
                            var value = roundedToFixed(amount / exchange, 6);

                            if(value < minvalue){
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: 'Invalid withdraw value. Please withdraw at least ' + minvalue + ' ' + currency.toUpperCase() + '!'
                                });

                                return cooldown(false, true);
                            }

                            if(config.settings.payments.manually.enable.crypto && amount >= getFormatAmount(config.settings.payments.manually.amount)) {
                                return continueWithdrawManually(user, currency, amount, address, function(err6, transactionid){
                                    if(err6){
                                        emitSocketToUser(socket, 'message', 'error', {
                                            message: err6.message
                                        });

                                        return cooldown(false, true);
                                    }

                                    emitSocketToUser(socket, 'message', 'info', {
                                        message: 'Your crypto withdraw order was listed. Admin confirmations required!'
                                    });

                                    cooldown(false, false);
                                });
                            }

                            continueWithdrawAutomatically(user, currency, amount, address, function(err6, listingid){
                                if(err6){
                                    emitSocketToUser(socket, 'message', 'error', {
                                        message: err6.message
                                    });

                                    return cooldown(false, true);
                                }

                                emitSocketToUser(socket, 'message', 'info', {
                                    message: 'Your crypto withdraw order was prepared!'
                                });

                                cooldown(false, false);
                            });
                        });
                    });
                });
            });
        });
	});
}

/* ----- INTERNAL USAGE ----- */
function continueWithdrawManually(user, currency, amount, address, callback){
    //EDIT BALANCE
    userService.editBalance(user.userid, -amount, currency + '_withdraw', function(err1, newbalance){
        if(err1) return callback(err1);

        userService.updateBalance(user.userid, 'main', newbalance);

        pool.query('INSERT INTO `crypto_listings` SET `type` = ' + pool.escape('withdraw') + ', `userid` = ' + pool.escape(user.userid) + ', `address` = ' + pool.escape(address) + ', `currency` = ' + pool.escape(currency) + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err2, row2) {
            if(err2) return callback(new Error('An error occurred while continuing withdraw manually (1)'));

            loggerDebug('[CRYPTO] Withdraw listing #' + row2.insertId + ' has been listed. Admin confirmations required');

            callback(null, row2.insertId);
        });
    });
}

function continueWithdrawAutomatically(user, currency, amount, address, callback){
    var exchange = amounts[currency];
    var value = roundedToFixed(amount / exchange, 6);

    generateToken(function(err1, token){
        if(err1) return callback(err1);

        verifyBalance(currency, token, function(err2, bank){
            if(err2) return callback(err2);

            if(bank < value) return callback(new Error('The bank dont\'t have enough money!'));

            createPayout(address, currency, value, token, function(err3, payout){
                if(err3) return callback(err3);

                verifyPayout(payout.withdrawals[0].batch_withdrawal_id, token, function(err4){
                    if(err4) return callback(err4);

                    //EDIT BALANCE
                    userService.editBalance(user.userid, -amount, currency + '_withdraw', function(err5, newbalance){
                        if(err5) return callback(err5);

                        userService.updateBalance(user.userid, 'main', newbalance);

                        var status = {
                            'creating': 0,
                            'waiting': 1,
                            'processing': 2,
                            'sending': 3,
                            'finished': 4,
                            'rejected': -1,
                            'failed': -2
                        }[payout.withdrawals[0].status.toLowerCase()];

                        pool.query('INSERT INTO `crypto_transactions` SET `status` = ' + status + ', `type` = ' + pool.escape('withdraw') + ', `userid` = ' + pool.escape(user.userid) + ', `name` = ' + pool.escape(user.name) + ', `avatar` = ' + pool.escape(user.avatar) + ', `xp` = ' + pool.escape(user.xp) + ', `transactionid` = ' + pool.escape(payout.withdrawals[0].id) + ', `address` = ' + pool.escape(address) + ', `currency` = ' + pool.escape(currency) + ', `amount` = ' + amount + ', `value` = ' + value + ', `exchange` = ' + exchange + ', `time` = ' + pool.escape(time()), function(err6, row6) {
                            if(err6) return callback(new Error('An error occurred while continuing withdraw automatically (2)'));

                            loggerDebug('[CRYPTO] Withdraw order #' + row6.insertId + ' has been prepared');

                            callback(null, row6.insertId);
                        });
                    });
                });
            });
        });
    });
}

function confirmWithdrawListing(user, id, callback){
	pool.query('SELECT `id`, `canceled`, `confirmed`, `userid`, `currency`, `address`, `amount` FROM `crypto_listings` WHERE `id` = ' + pool.escape(id), function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while confirming withdraw listing (1)'));

		if(row1.length <= 0) return callback(new Error('Unknown crypto withdraw listing!'));
		if(parseInt(row1[0].confirmed)) return callback(new Error('Crypto withdraw listing already confirmed!'));
		if(parseInt(row1[0].canceled)) return callback(new Error('Crypto withdraw listing is canceled!'));

		pool.query('SELECT `userid`, `name`, `avatar`, `xp` FROM `users` WHERE `userid` = ' + pool.escape(row1[0].userid), function(err2, row2) {
			if(err2) return callback(new Error('An error occurred while confirming withdraw listing (2)'));

			if(row2.length <= 0) return callback(new Error('Unknown user listing!'));

			var currency = row1[0].currency;
			var address = row1[0].address;

			var amount = getFormatAmount(row1[0].amount);
            var exchange = amounts[currency];
            var value = roundedToFixed(amount / exchange, 6);

            if(amounts[currency] === undefined || amounts[currency] <= 0) return callback(new Error('The prices are not loaded. Please try again later!'));

            getMinimumWithdraw(currency, function(err3, minvalue){
                if(err3) return callback(err3);

                if(value < minvalue) return callback(new Error('Invalid withdraw value. Please withdraw at least ' + minvalue + ' ' + currency.toUpperCase() + '!'));

                generateToken(function(err4, token){
                    if(err4) return callback(err4);

                    verifyBalance(currency, token, function(err5, bank){
                        if(err5) return callback(err5);

                        if(bank < value) return callback(new Error('The bank dont\'t have enough money!'));

                        createPayout(address, currency, value, token, function(err6, payout){
                            if(err6) return callback(err6);

                            verifyPayout(payout.withdrawals[0].batch_withdrawal_id, token, function(err7){
                                if(err7) return callback(err7);

                                var status = {
                                    'creating': 0,
                                    'waiting': 1,
                                    'processing': 2,
                                    'sending': 3,
                                    'finished': 4,
                                    'rejected': -1,
                                    'failed': -2
                                }[payout.withdrawals[0].status.toLowerCase()];

                                pool.query('INSERT INTO `crypto_transactions` SET `status` = ' + status + ', `type` = ' + pool.escape('withdraw') + ', `userid` = ' + pool.escape(row2[0].userid) + ', `name` = ' + pool.escape(row2[0].name) + ', `avatar` = ' + pool.escape(row2[0].avatar) + ', `xp` = ' + pool.escape(row2[0].xp) + ', `transactionid` = ' + pool.escape(payout.withdrawals[0].id) + ', `address` = ' + pool.escape(address) + ', `currency` = ' + pool.escape(currency) + ', `amount` = ' + amount + ', `value` = ' + value + ', `exchange` = ' + exchange + ', `time` = ' + pool.escape(time()), function(err8, row8) {
                                    if(err8) return callback(new Error('An error occurred while confirming withdraw listing (3)'));

                                    emitSocketToRoom(row2[0].userid, 'message', 'info', {
                                        message: 'Your crypto withdraw order was confirmed. Admin confirmations required!'
                                    });

                                    loggerDebug('[CRYPTO] Withdraw listing #' + row8.insertId + ' has been listed. Admin confirmations required');

                                    pool.query('UPDATE `crypto_listings` SET `confirmed` = 1 WHERE `id` = ' + pool.escape(row1[0].id) + ' AND `confirmed` = 0 AND `canceled` = 0', function(err9) {
                                        if(err9) return callback(new Error('An error occurred while confirming withdraw listing (4)'));

                                        pool.query('INSERT INTO `crypto_confirmations` SET `userid` = ' + pool.escape(user.userid) + ', `listingid` = ' + pool.escape(row1[0].id) + ', `transactionid` = ' + pool.escape(row8.insertId) + ', `time` = ' + pool.escape(time()), function(err10) {
                                            if(err10) return callback(new Error('An error occurred while confirming withdraw listing (5)'));

                                            callback(null, row8.insertId);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
		});
	});
}

function cancelWithdrawListing(user, id, callback){
	pool.query('SELECT `id`, `canceled`, `confirmed`, `userid`, `currency`, `amount` FROM `crypto_listings` WHERE `id` = ' + pool.escape(id), function(err1, row1) {
		if(err1) return callback(new Error('An error occurred while canceling withdraw listing (1)'));

		if(row1.length <= 0) return callback(new Error('Unknown crypto withdraw listing!'));
		if(parseInt(row1[0].confirmed)) return callback(new Error('Crypto withdraw listing id confirmed!'));
		if(parseInt(row1[0].canceled)) return callback(new Error('Crypto withdraw listing already canceled!'));

		var currency = row1[0].currency;
		var amount = getFormatAmount(row1[0].amount);

		//EDIT BALANCE
		userService.editBalance(row1[0].userid, amount, currency + '_withdraw_refund', function(err2, newbalance){
			if(err2) return callback(err2);

			userService.updateBalance(row1[0].userid, 'main', newbalance);

            pool.query('UPDATE `crypto_listings` SET `canceled` = 1 WHERE `id` = ' + pool.escape(row1[0].id) + ' AND `confirmed` = 0 AND `canceled` = 0', function(err3) {
                if(err3) return callback(new Error('An error occurred while canceling withdraw listing (2)'));

                emitSocketToRoom(row1[0].userid, 'message', 'info', {
                    message: 'Your crypto withdraw order was canceled!'
                });

                loggerDebug('[CRYPTO] Withdraw listing #' + row1[0].id + ' has been canceled');

                callback(null);
            });
		});
	});
}

module.exports = {
	amounts, fees, updating,
	initializeCurrencies, updateTransaction, confirmWithdrawListing, cancelWithdrawListing,
	placeDeposit, placeWithdraw
};