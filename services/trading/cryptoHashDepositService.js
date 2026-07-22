/**
 * Crypto tx-hash deposits: user submits hash → blockchain verify → pending admin → approve credits balance.
 * Duplicate prevention via UNIQUE(tx_hash) + atomic status flip on approve.
 */
var request = require('request');
var { pool } = require('@/lib/database.js');
var { loggerDebug } = require('@/lib/logger.js');

var userService = require('@/services/userService.js');
var cryptoService = require('@/services/trading/cryptoService.js');
var blockchainVerify = require('@/services/trading/blockchainVerify.js');

var { makeDate, time } = require('@/utils/formatDate.js');
var { getFormatAmount, getFormatAmountString, verifyFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');
var { getUserInfo } = require('@/utils/user.js');
var { haveRankPermission } = require('@/utils/utils.js');

var config = require('@/config/config.js');

var STATUS_PENDING = 0;
var STATUS_APPROVED = 1;
var STATUS_REJECTED = 2;

var COINGECKO_IDS = {
    btc: 'bitcoin',
    eth: 'ethereum',
    ltc: 'litecoin',
    bch: 'bitcoin-cash',
    doge: 'dogecoin',
    sol: 'solana',
    xrp: 'ripple',
    trx: 'tron',
    ton: 'the-open-network'
};

function isStable(currency) {
    return ['usdttrc20', 'usdterc20', 'usdtbsc', 'usdc', 'usdtsol', 'usdtmatic'].indexOf(currency) !== -1;
}

function getUsdRate(currency, callback) {
    currency = String(currency || '').toLowerCase();

    if(isStable(currency)) return callback(null, 1);

    // Prefer NOWPayments-loaded rates when available (USD per 1 coin ≈ 1/amounts? )
    // In cryptoService: amount = value * exchange where value is crypto amount and exchange is USD per coin
    // Actually placeDeposit: amount = getFormatAmount(value * exchange) where value is crypto and exchange = amounts[currency]
    // Looking at getCurrencyAmount - estimated_amount from NOWPayments for converting TO crypto from fiat...
    // amounts[currency] used as: amount = value * exchange where value is crypto amount → so exchange is USD per 1 crypto unit
    if(cryptoService.amounts && cryptoService.amounts[currency] > 0) {
        return callback(null, cryptoService.amounts[currency]);
    }

    var id = COINGECKO_IDS[currency];
    if(!id) return callback(new Error('No price source for ' + currency.toUpperCase()));

    request({
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=' + encodeURIComponent(id) + '&vs_currencies=usd',
        method: 'GET',
        json: true,
        timeout: 15000
    }, function(err, res, body) {
        if(err || !body || !body[id] || !(body[id].usd > 0)) {
            return callback(new Error('Could not load market price for ' + currency.toUpperCase()));
        }
        callback(null, body[id].usd);
    });
}

function creditDeposit(adminUser, row, callback) {
    var userid = row.userid;
    var amount = getFormatAmount(row.amount);
    var currency = row.currency;

    userService.editBalance(userid, amount, currency + '_deposit', function(err1, newbalance1) {
        if(err1) return callback(err1);

        pool.query('UPDATE `users` SET `rollover` = `rollover` + ' + amount + ' WHERE `userid` = ' + pool.escape(userid), function(err2) {
            if(err2) return callback(new Error('An error occurred while approving crypto deposit (rollover)'));

            userService.registerAffiliates(userid, amount, 'deposit', function(err3) {
                if(err3) return callback(err3);

                userService.registerDepositBonus(userid, amount, function(err4, newbalance2) {
                    if(err4) return callback(err4);

                    pool.query(
                        'INSERT INTO `users_trades` SET `type` = ' + pool.escape('deposit') +
                        ', `method` = ' + pool.escape('crypto') +
                        ', `option` = ' + pool.escape('hash') +
                        ', `userid` = ' + pool.escape(userid) +
                        ', `amount` = ' + amount +
                        ', `value` = ' + amount +
                        ', `tradeid` = ' + parseInt(row.id, 10) +
                        ', `time` = ' + pool.escape(time()),
                        function(err5) {
                            if(err5) return callback(new Error('An error occurred while approving crypto deposit (trade)'));

                            if(newbalance2) userService.updateBalance(userid, 'main', newbalance2);
                            else userService.updateBalance(userid, 'main', newbalance1);

                            callback(null, newbalance2 || newbalance1);
                        }
                    );
                });
            });
        });
    });
}

/* ----- USER: submit tx hash ----- */
function submitHashDeposit(user, socket, currency, txHash, cooldown) {
    cooldown(true, true);

    if(!(config.trading.crypto.hash_deposits && config.trading.crypto.hash_deposits.enabled)) {
        emitSocketToUser(socket, 'message', 'error', { message: 'Crypto hash deposits are disabled!' });
        return cooldown(false, true);
    }

    currency = String(currency || '').toLowerCase().trim();
    var hash = blockchainVerify.normalizeHash(currency, txHash);

    if(!currency || !blockchainVerify.getWallet(currency)) {
        emitSocketToUser(socket, 'message', 'error', { message: 'Invalid or unsupported currency!' });
        return cooldown(false, true);
    }

    if(!hash || hash.length < 16) {
        emitSocketToUser(socket, 'message', 'error', { message: 'Invalid transaction hash!' });
        return cooldown(false, true);
    }

    pool.query('SELECT `expire` FROM `users_restrictions` WHERE `userid` = ' + pool.escape(user.userid) + ' AND `restriction` = ' + pool.escape('trade') + ' AND `removed` = 0 AND (`expire` = -1 OR `expire` > ' + pool.escape(time()) + ')', function(errR, rowR) {
        if(errR) {
            emitSocketToUser(socket, 'message', 'error', { message: 'An error occurred while submitting deposit (0)' });
            return cooldown(false, true);
        }

        if(rowR.length > 0 && !haveRankPermission('exclude_ban_trade', user.rank)) {
            emitSocketToUser(socket, 'message', 'error', { message: 'You are restricted from trading.' });
            return cooldown(false, true);
        }

        // Duplicate check early
        pool.query('SELECT `id`, `status` FROM `crypto_hash_deposits` WHERE `tx_hash` = ' + pool.escape(hash) + ' LIMIT 1', function(err1, row1) {
            if(err1) {
                emitSocketToUser(socket, 'message', 'error', { message: 'An error occurred while submitting deposit (1)' });
                return cooldown(false, true);
            }

            if(row1.length > 0) {
                emitSocketToUser(socket, 'message', 'error', {
                    message: row1[0].status === STATUS_APPROVED
                        ? 'This transaction was already credited!'
                        : 'This transaction hash was already submitted!'
                });
                return cooldown(false, true);
            }

            blockchainVerify.verifyDeposit(currency, hash, function(err2, verified) {
                if(err2 || !verified || !verified.ok) {
                    emitSocketToUser(socket, 'message', 'error', {
                        message: (verified && verified.error) || 'Could not verify transaction on blockchain'
                    });
                    return cooldown(false, true);
                }

                if(!(verified.cryptoAmount > 0) && !verified.needsAdminAmount) {
                    emitSocketToUser(socket, 'message', 'error', { message: 'Verified amount is zero!' });
                    return cooldown(false, true);
                }

                getUsdRate(currency, function(err3, rate) {
                    if(err3 && !(verified.cryptoAmount > 0 && isStable(currency))) {
                        // Allow pending with 0 amount for admin to set? Prefer fail unless needsAdminAmount
                        if(!verified.needsAdminAmount) {
                            emitSocketToUser(socket, 'message', 'error', { message: err3.message || 'Could not price deposit' });
                            return cooldown(false, true);
                        }
                        rate = 0;
                    }

                    rate = Number(rate) || 0;
                    var amount = getFormatAmount((verified.cryptoAmount || 0) * rate);
                    var limits = config.app.intervals.amounts.deposit_crypto_hash || { min: 5, max: 10000 };

                    if(amount > 0 && (amount < limits.min || amount > limits.max)) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'Deposit amount out of range [' + getFormatAmountString(limits.min) + '-' + getFormatAmountString(limits.max) + ']!'
                        });
                        return cooldown(false, true);
                    }

                    if(!(amount > 0) && !verified.needsAdminAmount) {
                        emitSocketToUser(socket, 'message', 'error', { message: 'Deposit amount too small after conversion!' });
                        return cooldown(false, true);
                    }

                    var wallet = blockchainVerify.getWallet(currency);
                    var verifyJson = JSON.stringify({
                        confirmations: verified.confirmations || 0,
                        needsAdminAmount: !!verified.needsAdminAmount,
                        raw: verified.raw || null
                    }).slice(0, 60000);

                    pool.query(
                        'INSERT INTO `crypto_hash_deposits` SET ' +
                        '`status` = ' + STATUS_PENDING +
                        ', `userid` = ' + pool.escape(user.userid) +
                        ', `name` = ' + pool.escape(user.name) +
                        ', `avatar` = ' + pool.escape(user.avatar) +
                        ', `xp` = ' + pool.escape(user.xp) +
                        ', `currency` = ' + pool.escape(currency) +
                        ', `tx_hash` = ' + pool.escape(hash) +
                        ', `to_address` = ' + pool.escape(verified.toAddress || wallet) +
                        ', `from_address` = ' + pool.escape(verified.fromAddress || '') +
                        ', `crypto_amount` = ' + Number(verified.cryptoAmount || 0) +
                        ', `amount` = ' + amount +
                        ', `exchange` = ' + rate +
                        ', `confirmations` = ' + parseInt(verified.confirmations || 0, 10) +
                        ', `verify_json` = ' + pool.escape(verifyJson) +
                        ', `time` = ' + pool.escape(time()),
                        function(err4, row4) {
                            if(err4) {
                                if(err4.code === 'ER_DUP_ENTRY') {
                                    emitSocketToUser(socket, 'message', 'error', { message: 'This transaction hash was already submitted!' });
                                    return cooldown(false, true);
                                }
                                emitSocketToUser(socket, 'message', 'error', { message: 'An error occurred while submitting deposit (2)' });
                                return cooldown(false, true);
                            }

                            emitSocketToUser(socket, 'message', 'success', {
                                message: 'Deposit submitted! Waiting for admin approval. #' + row4.insertId +
                                    (amount > 0 ? (' (~' + getFormatAmountString(amount) + ' coins)') : '')
                            });

                            emitSocketToUser(socket, 'crypto', 'hash_deposit_submitted', {
                                id: row4.insertId,
                                amount: amount,
                                currency: currency,
                                tx_hash: hash
                            });

                            loggerDebug('[CRYPTO-HASH] Pending deposit #' + row4.insertId + ' by ' + user.userid + ' ' + currency + ' ' + hash);

                            cooldown(false, false);
                        }
                    );
                });
            });
        });
    });
}

/* ----- ADMIN: list pending ----- */
function getPendingHashDeposits(user, socket, page, cooldown) {
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)) {
        emitSocketToUser(socket, 'message', 'error', { message: 'You don\'t have permission to use that!' });
        return cooldown(false, true);
    }

    if(isNaN(Number(page))) {
        emitSocketToUser(socket, 'message', 'error', { message: 'Invalid page!' });
        return cooldown(false, true);
    }

    page = parseInt(page, 10);

    pool.query('SELECT COUNT(*) AS `count` FROM `crypto_hash_deposits` WHERE `status` = ' + STATUS_PENDING, function(err1, row1) {
        if(err1) {
            emitSocketToUser(socket, 'message', 'error', { message: 'An error occurred while getting hash deposits (1)' });
            return cooldown(false, true);
        }

        var pages = Math.ceil(row1[0].count / 10) || 1;

        if(row1[0].count <= 0) {
            emitSocketToUser(socket, 'pagination', 'admin_crypto_hash_deposits', { list: [], pages: 1, page: 1 });
            return cooldown(false, false);
        }

        if(page <= 0 || page > pages) {
            emitSocketToUser(socket, 'message', 'error', { message: 'Invalid page!' });
            return cooldown(false, true);
        }

        pool.query(
            'SELECT users.userid, users.name, users.avatar, users.xp, crypto_hash_deposits.* FROM `crypto_hash_deposits` ' +
            'INNER JOIN `users` ON crypto_hash_deposits.userid = users.userid ' +
            'WHERE crypto_hash_deposits.status = ' + STATUS_PENDING +
            ' ORDER BY crypto_hash_deposits.id ASC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10),
            function(err2, row2) {
                if(err2) {
                    emitSocketToUser(socket, 'message', 'error', { message: 'An error occurred while getting hash deposits (2)' });
                    return cooldown(false, true);
                }

                emitSocketToUser(socket, 'pagination', 'admin_crypto_hash_deposits', {
                    list: row2.map(mapAdminRow),
                    pages: pages,
                    page: page
                });

                cooldown(false, false);
            }
        );
    });
}

function mapAdminRow(a) {
    return {
        id: a.id,
        user: getUserInfo({
            userid: a.userid,
            name: a.name,
            avatar: a.avatar,
            xp: parseInt(a.xp, 10),
            anonymous: 0
        }),
        amount: getFormatAmountString(a.amount),
        crypto_amount: a.crypto_amount,
        currency: a.currency,
        tx_hash: a.tx_hash,
        to_address: a.to_address,
        date: makeDate(new Date(a.time * 1000))
    };
}

/* ----- ADMIN: approve ----- */
function approveHashDeposit(user, socket, id, secret, cooldown) {
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)) {
        emitSocketToUser(socket, 'message', 'error', { message: 'You don\'t have permission to use that!' });
        return cooldown(false, true);
    }

    if(!config.app.access_secrets.includes(secret)) {
        emitSocketToUser(socket, 'message', 'error', { message: 'Invalid secret!' });
        return cooldown(false, true);
    }

    id = parseInt(id, 10);
    if(!(id > 0)) {
        emitSocketToUser(socket, 'message', 'error', { message: 'Invalid deposit id!' });
        return cooldown(false, true);
    }

    // Atomic claim — prevents double credit
    pool.query(
        'UPDATE `crypto_hash_deposits` SET `status` = ' + STATUS_APPROVED +
        ', `adminid` = ' + pool.escape(user.userid) +
        ', `approved_time` = ' + pool.escape(time()) +
        ' WHERE `id` = ' + pool.escape(id) + ' AND `status` = ' + STATUS_PENDING,
        function(err1, result1) {
            if(err1) {
                emitSocketToUser(socket, 'message', 'error', { message: 'An error occurred while approving deposit (1)' });
                return cooldown(false, true);
            }

            if(!result1 || result1.affectedRows !== 1) {
                emitSocketToUser(socket, 'message', 'error', { message: 'Deposit already processed or not found!' });
                return cooldown(false, true);
            }

            pool.query('SELECT * FROM `crypto_hash_deposits` WHERE `id` = ' + pool.escape(id) + ' LIMIT 1', function(err2, row2) {
                if(err2 || !row2.length) {
                    emitSocketToUser(socket, 'message', 'error', { message: 'An error occurred while approving deposit (2)' });
                    return cooldown(false, true);
                }

                var row = row2[0];
                if(!(getFormatAmount(row.amount) > 0)) {
                    // Roll back to pending if amount missing
                    pool.query('UPDATE `crypto_hash_deposits` SET `status` = ' + STATUS_PENDING + ', `adminid` = NULL, `approved_time` = NULL WHERE `id` = ' + pool.escape(id), function() {});
                    emitSocketToUser(socket, 'message', 'error', { message: 'Deposit amount is zero — cannot credit. Reject or fix amount first.' });
                    return cooldown(false, true);
                }

                creditDeposit(user, row, function(err3) {
                    if(err3) {
                        emitSocketToUser(socket, 'message', 'error', { message: err3.message || 'Credit failed' });
                        return cooldown(false, true);
                    }

                    emitSocketToRoom(row.userid, 'message', 'success', {
                        message: 'Your crypto deposit #' + row.id + ' was approved! +' + getFormatAmountString(row.amount)
                    });

                    emitSocketToUser(socket, 'message', 'info', {
                        message: 'Crypto hash deposit #' + row.id + ' approved and credited!'
                    });

                    emitSocketToUser(socket, 'site', 'refresh');

                    loggerDebug('[CRYPTO-HASH] Approved deposit #' + row.id + ' by admin ' + user.userid);

                    cooldown(false, false);
                });
            });
        }
    );
}

/* ----- ADMIN: reject ----- */
function rejectHashDeposit(user, socket, id, secret, cooldown) {
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)) {
        emitSocketToUser(socket, 'message', 'error', { message: 'You don\'t have permission to use that!' });
        return cooldown(false, true);
    }

    if(!config.app.access_secrets.includes(secret)) {
        emitSocketToUser(socket, 'message', 'error', { message: 'Invalid secret!' });
        return cooldown(false, true);
    }

    id = parseInt(id, 10);

    pool.query(
        'UPDATE `crypto_hash_deposits` SET `status` = ' + STATUS_REJECTED +
        ', `adminid` = ' + pool.escape(user.userid) +
        ', `approved_time` = ' + pool.escape(time()) +
        ', `reject_reason` = ' + pool.escape('Rejected by admin') +
        ' WHERE `id` = ' + pool.escape(id) + ' AND `status` = ' + STATUS_PENDING,
        function(err1, result1) {
            if(err1) {
                emitSocketToUser(socket, 'message', 'error', { message: 'An error occurred while rejecting deposit' });
                return cooldown(false, true);
            }

            if(!result1 || result1.affectedRows !== 1) {
                emitSocketToUser(socket, 'message', 'error', { message: 'Deposit already processed or not found!' });
                return cooldown(false, true);
            }

            pool.query('SELECT `userid`, `id` FROM `crypto_hash_deposits` WHERE `id` = ' + pool.escape(id), function(err2, row2) {
                if(!err2 && row2.length) {
                    emitSocketToRoom(row2[0].userid, 'message', 'error', {
                        message: 'Your crypto deposit #' + row2[0].id + ' was rejected.'
                    });
                }

                emitSocketToUser(socket, 'message', 'info', { message: 'Crypto hash deposit #' + id + ' rejected.' });
                emitSocketToUser(socket, 'site', 'refresh');
                cooldown(false, false);
            });
        }
    );
}

function loadPendingForPage(limit, callback) {
    pool.query(
        'SELECT users.userid, users.name, users.avatar, users.xp, crypto_hash_deposits.* FROM `crypto_hash_deposits` ' +
        'INNER JOIN `users` ON crypto_hash_deposits.userid = users.userid ' +
        'WHERE crypto_hash_deposits.status = ' + STATUS_PENDING +
        ' ORDER BY crypto_hash_deposits.id ASC LIMIT ' + parseInt(limit || 10, 10),
        function(err, rows) {
            if(err) return callback(err);
            callback(null, (rows || []).map(mapAdminRow));
        }
    );
}

function countPending(callback) {
    pool.query('SELECT COUNT(*) AS `count` FROM `crypto_hash_deposits` WHERE `status` = ' + STATUS_PENDING, function(err, rows) {
        if(err) return callback(err);
        callback(null, rows[0].count);
    });
}

module.exports = {
    submitHashDeposit,
    getPendingHashDeposits,
    approveHashDeposit,
    rejectHashDeposit,
    loadPendingForPage,
    countPending,
    mapAdminRow,
    STATUS_PENDING,
    STATUS_APPROVED,
    STATUS_REJECTED
};
