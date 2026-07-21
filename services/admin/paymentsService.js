var { pool } = require('@/lib/database.js');
var { loggerDebug } = require('@/lib/logger.js');

var userService = require('@/services/userService.js');

var settingsService = require('@/services/admin/settingsService.js');

var cryptoService = require('@/services/trading/cryptoService.js');

var { makeDate, time } = require('@/utils/formatDate.js');
var { roundedToFixed, getFormatAmount, getFormatAmountString, verifyFormatAmount } = require('@/utils/formatAmount.js');
var { emitSocketToUser, emitSocketToRoom } = require('@/utils/socket.js');
var { getUserInfo } = require('@/utils/user.js');
var { haveRankPermission } = require('@/utils/utils.js');

var config = require('@/config/config.js');

/* ----- CLIENT USAGE ----- */
function createDepositBonus(user, socket, referral, code, secret, cooldown){
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
        });

        return cooldown(false, true);
    }

    if(!config.app.access_secrets.includes(secret)) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid secret!'
        });

        return cooldown(false, true);
    }

    /* CHECK DATA */

    code = code.trim().toLowerCase();

    if(code.length < config.app.admin.deposit_bonuses.requirements.code_length.min || code.length > config.app.admin.deposit_bonuses.requirements.code_length.max){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid code length [' + config.app.admin.deposit_bonuses.requirements.code_length.min + '-' + config.app.admin.deposit_bonuses.requirements.code_length.max + ']!'
        });

        return cooldown(false, true);
    }

    /* END CHECK DATA */

    pool.query('SELECT `userid` FROM `users` WHERE `userid` = ' + pool.escape(referral), function(err1, row1){
        if(err1){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while creating deposit bonus (1)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Unknown user referral!'
            });

            return cooldown(false, true);
        }

        pool.query('SELECT `id` FROM `deposit_codes` WHERE `code` = ' + pool.escape(code), function(err2, row2){
            if(err2){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while creating deposit bonus (2)'
                });

                return cooldown(false, true);
            }

            if(row2.length > 0){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'Deposit bonus code already used!'
                });

                return cooldown(false, true);
            }

            pool.query('INSERT INTO `deposit_codes` SET `userid` = ' + pool.escape(user.userid) + ', `referral` = ' + pool.escape(row1[0].userid) + ', `code` = ' + pool.escape(code) + ', `time` = ' + pool.escape(time()), function(err3, row3){
                if(err3){
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'An error occurred while creating deposit bonus (3)'
                    });

                    return cooldown(false, true);
                }

                emitSocketToUser(socket, 'message', 'success', {
                    message: 'Deposit bonus code created successfully!'
                });

                emitSocketToUser(socket, 'site', 'refresh');

                cooldown(false, false);
            });
        });
    });
}

/* ----- CLIENT USAGE ----- */
function removeDepositBonus(user, socket, id, secret, cooldown){
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
        });

        return cooldown(false, true);
    }

    if(!config.app.access_secrets.includes(secret)) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid secret!'
        });

        return cooldown(false, true);
    }

    pool.query('SELECT `id` FROM `deposit_codes` WHERE `id` = ' + pool.escape(id) + ' AND `removed` = 0', function(err1, row1){
        if(err1){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while removing deposit bonus (1)'
            });

            return cooldown(false, true);
        }

        if(row1.length <= 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Unknown deposit bonus code!'
            });

            return cooldown(false, true);
        }

        pool.query('UPDATE `deposit_codes` SET `removed` = 1 WHERE `id` = ' + pool.escape(id) + ' AND `removed` = 0', function(err2, row2){
            if(err2){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while removing deposit bonus (2)'
                });

                return cooldown(false, true);
            }

            emitSocketToUser(socket, 'message', 'success', {
                message: 'Deposit bonus code removed successfully!'
            });

            emitSocketToUser(socket, 'site', 'refresh');

            cooldown(false, false);
        });
    });
}

/* ----- CLIENT USAGE ----- */
function getDepositBonuses(user, socket, page, search, cooldown){
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
        });

        return cooldown(false, true);
    }

    /* CHECK DATA */

    if(isNaN(Number(page))){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid page!'
        });

        return cooldown(false, true);
    }

    page = parseInt(page);
    search = search.trim();

    /* END CHECK DATA */

    pool.query('SELECT COUNT(*) AS `count` FROM `deposit_codes` WHERE (`referral` LIKE ' + pool.escape('%' + search + '%') + ' OR `code` LIKE ' + pool.escape('%' + search.toLowerCase() + '%') + ') AND `removed` = 0', function(err1, row1){
        if(err1){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting deposit bonuses (1)'
            });

            return cooldown(false, true);
        }

        var pages = Math.ceil(row1[0].count / 10);

        if(pages <= 0){
            emitSocketToUser(socket, 'pagination', 'admin_deposit_bonuses', {
                list: [],
                pages: 1,
                page: 1
            });

            return cooldown(false, false);
        }

        if(page <= 0 || page > pages) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid page!'
            });

            return cooldown(false, true);
        }

        pool.query('SELECT `id`, `referral`, `code`, `uses`, `amount` FROM `deposit_codes` WHERE (`referral` LIKE ' + pool.escape('%' + search + '%') + ' OR `code` LIKE ' + pool.escape('%' + search + '%') + ') AND `removed` = 0 ORDER BY `id` ASC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
            if(err2){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting deposit bonuses (2)'
                });

                return cooldown(false, true);
            }

            emitSocketToUser(socket, 'pagination', 'admin_deposit_bonuses', {
                list: row2.map(a => ({
                    id: a.id,
                    code: a.code.toUpperCase(),
                    referral: a.referral,
                    uses: parseInt(a.uses),
                    amount: roundedToFixed(a.amount, 5).toFixed(5)
                })),
                pages: pages,
                page: page
            });

            cooldown(false, false);
        });
    });
}

/* ----- CLIENT USAGE ----- */
function createManualDeposit(user, socket, userid, amount, secret, cooldown){
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
        });

        return cooldown(false, true);
    }

    if(!config.app.access_secrets.includes(secret)) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid secret!'
        });

        return cooldown(false, true);
    }

    pool.query('SELECT `name`, `avatar`, `xp`, `rank`, `exclusion` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while creating manual deposit (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown user!'
			});

			return cooldown(false, true);
		}

        pool.query('SELECT `expire` FROM `users_restrictions` WHERE `userid` = '+ pool.escape(userid) + ' AND `restriction` = ' + pool.escape('trade') + ' AND `removed` = 0 AND (`expire` = -1 OR `expire` > ' + pool.escape(time()) + ')', function(err2, row2){
            if(err2) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while creating manual deposit (2)'
                });
            }

            if(row2.length > 0 && (row2[0].expire >= time() || row2[0].expire == -1) && !haveRankPermission('exclude_ban_trade', row1[0].rank)){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'The user restricted to use our trade. The restriction expires ' + (row2[0].expire == -1 ? 'never' : makeDate(new Date(row2[0].expire * 1000))) + '.'
                });

                return cooldown(false, true);
            }

            if(row1[0].exclusion > time()){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'The user exclusion expires ' + makeDate(new Date(row1[0].exclusion * 1000)) + '.'
                });

                return cooldown(false, true);
            }

            verifyFormatAmount(amount, function(err3, amount){
                if(err3){
                    emitSocketToUser(socket, 'message', 'error', {
                        message: err3.message
                    });

                    return cooldown(false, true);
                }

                if(amount < config.app.intervals.amounts.deposit_manual.min || amount > config.app.intervals.amounts.deposit_manual.max){
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'Invalid deposit amount [' + getFormatAmountString(config.app.intervals.amounts.deposit_manual.min) + '-' + getFormatAmountString(config.app.intervals.amounts.deposit_manual.max) + ']!'
                    });

                    return cooldown(false, true);
                }

                //EDIT BALANCE
                userService.editBalance(userid, amount, 'manual_deposit', function(err4, newbalance1){
                    if(err4) {
                        emitSocketToUser(socket, 'message', 'error', {
                            message: err4.message
                        });

                        return cooldown(false, true);
                    }

                    pool.query('INSERT INTO `manual_transactions` SET `type` = ' + pool.escape('deposit') + ', `adminid` = ' + pool.escape(user.userid) + ', `userid` = ' + pool.escape(userid) + ', `name` = ' + pool.escape(row1[0].name) + ', `avatar` = ' + pool.escape(row1[0].avatar) + ', `xp` = ' + pool.escape(row1[0].xp) + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err5, row5) {
                        if(err5){
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'An error occurred while creating manual deposit (3)'
                            });

                            return cooldown(false, true);
                        }

                        pool.query('UPDATE `users` SET `rollover` = `rollover` + ' + amount + ' WHERE `userid` = ' + pool.escape(userid), function(err6) {
                            if(err6){
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: 'An error occurred while creating manual deposit (4)'
                                });

                                return cooldown(false, true);
                            }

                            //REGISTER AFFILIATES
                            userService.registerAffiliates(userid, amount, 'deposit', function(err7){
                                if(err7){
                                    emitSocketToUser(socket, 'message', 'error', {
                                        message: err7.message
                                    });

                                    return cooldown(false, true);
                                }

                                //REGISTER DEPOSIT BONUS
                                userService.registerDepositBonus(userid, amount, function(err8, newbalance2){
                                    if(err8){
                                        emitSocketToUser(socket, 'message', 'error', {
                                            message: err8.message
                                        });

                                        return cooldown(false, true);
                                    }

                                    pool.query('INSERT INTO `users_trades` SET `type` = ' + pool.escape('deposit') + ', `method` = ' + pool.escape('manual') + ', `option` = ' + pool.escape('manual') + ', `userid` = ' + pool.escape(userid) + ', `amount` = ' + amount + ', `value` = ' + amount + ', `tradeid` = '+ parseInt(row5.insertId) + ', `time` = ' + pool.escape(time()), function(err9){
                                        if(err9){
                                            emitSocketToUser(socket, 'message', 'error', {
                                                message: 'An error occurred while creating manual deposit (5)'
                                            });

                                            return cooldown(false, true);
                                        }

                                        if(newbalance2) userService.updateBalance(userid, 'main', newbalance2);
                                        else userService.updateBalance(userid, 'main', newbalance1);

                                        emitSocketToRoom(userid, 'message', 'success', {
                                            message: 'A manual deposit order has been created!'
                                        });

                                        emitSocketToUser(socket, 'message', 'info', {
                                            message: 'Manual deposit order was created successfully!'
                                        });

                                        loggerDebug('[ADMIN] Manual deposit order #' + row5.insertId + ' has been created');

                                        cooldown(false, false);
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

/* ----- CLIENT USAGE ----- */
function createManualWithdrawal(user, socket, userid, amount, secret, cooldown){
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
        });

        return cooldown(false, true);
    }

    if(!config.app.access_secrets.includes(secret)) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid secret!'
        });

        return cooldown(false, true);
    }

    pool.query('SELECT `name`, `avatar`, `xp`, `rank`, `rollover` FROM `users` WHERE `userid` = ' + pool.escape(userid), function(err1, row1){
		if(err1){
			emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while creating manual withdrawal (1)'
            });

			return cooldown(false, true);
		}

		if(row1.length <= 0){
			emitSocketToUser(socket, 'message', 'error', {
				message: 'Unknown user!'
			});

			return cooldown(false, true);
		}

        pool.query('SELECT `expire` FROM `users_restrictions` WHERE `userid` = '+ pool.escape(userid) + ' AND `restriction` = ' + pool.escape('trade') + ' AND `removed` = 0 AND (`expire` = -1 OR `expire` > ' + pool.escape(time()) + ')', function(err2, row2){
            if(err2) {
                return emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while creating manual withdrawal (2)'
                });
            }

            if(row2.length > 0 && (row2[0].expire >= time() || row2[0].expire == -1) && !haveRankPermission('exclude_ban_trade', row1[0].rank)){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'The user restricted to use our trade. The restriction expires ' + (row2[0].expire == -1 ? 'never' : makeDate(new Date(row2[0].expire * 1000))) + '.'
                });

                return cooldown(false, true);
            }

            verifyFormatAmount(amount, function(err3, amount){
                if(err3){
                    emitSocketToUser(socket, 'message', 'error', {
                        message: err3.message
                    });

                    return cooldown(false, true);
                }

                if((amount < config.app.intervals.amounts.withdraw_manual.min || amount > config.app.intervals.amounts.withdraw_manual.max)){
                    emitSocketToUser(socket, 'message', 'error', {
                        message: 'Invalid withdraw amount [' + getFormatAmountString(config.app.intervals.amounts.withdraw_manual.min) + '-' + getFormatAmountString(config.app.intervals.amounts.withdraw_manual.max) + ']!'
                    });

                    return cooldown(false, true);
                }

                pool.query('SELECT SUM(`amount`) AS `amount` FROM `users_trades` WHERE `userid` = ' + pool.escape(userid) + ' AND `type` = ' + pool.escape('deposit') + ' AND `time` > ' + pool.escape(config.trading.withdraw_requirements.deposit.time == -1 ? 0 : time() - config.trading.withdraw_requirements.deposit.time), function(err4, row4) {
                    if(err4){
                        emitSocketToUser(socket, 'message', 'error', {
                            message: 'An error occurred while creating manual withdrawal (3)'
                        });

                        return cooldown(false, true);
                    }

                    if(getFormatAmount(row4[0].amount) < config.trading.withdraw_requirements.deposit.amount && !haveRankPermission('withdraw', row1[0].rank)) {
                        if(config.trading.withdraw_requirements.deposit.time == -1){
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'The user needs to deposit minimum ' + getFormatAmountString(config.trading.withdraw_requirements.deposit.amount) + ' coins to unlock withdraw!'
                            });

                            return cooldown(false, true);
                        } else {
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'The user needs to deposit minimum ' + getFormatAmountString(config.trading.withdraw_requirements.deposit.amount) + ' coins in the last ' + Math.floor(config.trading.withdraw_requirements.deposit.time / (24 * 60 * 60)) + ' days to unlock withdraw!'
                            });

                            return cooldown(false, true);
                        }
                    }

                    //CHECK BALANCE
                    userService.getBalance(userid, function(err5, balance){
                        if(err5){
                            emitSocketToUser(socket, 'message', 'error', {
                                message: err5.message
                            });

                            return cooldown(false, true);
                        }

                        if(balance < amount){
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'The user don\'t have enough money to withdraw!'
                            });

                            return cooldown(false, true);
                        }

                        if(row1[0].rollover > 0 && !haveRankPermission('withdraw', row1[0].rank)) {
                            emitSocketToUser(socket, 'message', 'error', {
                                message: 'The user have to play ' + getFormatAmountString(row1[0].rollover) + ' coins to withdraw!'
                            });

                            return cooldown(false, true);
                        }

                        //EDIT BALANCE
                        userService.editBalance(userid, -amount, 'manual_withdraw', function(err6, newbalance){
                            if(err6) {
                                emitSocketToUser(socket, 'message', 'error', {
                                    message: err6.message
                                });

                                return cooldown(false, true);
                            }

                            pool.query('INSERT INTO `manual_transactions` SET `type` = ' + pool.escape('withdraw') + ', `adminid` = ' + pool.escape(user.userid) + ', `userid` = ' + pool.escape(userid) + ', `name` = ' + pool.escape(row1[0].name) + ', `avatar` = ' + pool.escape(row1[0].avatar) + ', `xp` = ' + pool.escape(row1[0].xp) + ', `amount` = ' + amount + ', `time` = ' + pool.escape(time()), function(err7, row7) {
                                if(err7){
                                    emitSocketToUser(socket, 'message', 'error', {
                                        message: 'An error occurred while creating manual withdrawal (4)'
                                    });

                                    return cooldown(false, true);
                                }

                                pool.query('INSERT INTO `users_trades` SET `type` = ' + pool.escape('withdraw') + ', `method` = ' + pool.escape('manual') + ', `option` = ' + pool.escape('manual') + ', `userid` = ' + pool.escape(userid) + ', `amount` = ' + amount + ', `value` = ' + amount + ', `tradeid` = '+ parseInt(row7.insertId) + ', `time` = ' + pool.escape(time()), function(err8){
                                    if(err8){
                                        emitSocketToUser(socket, 'message', 'error', {
                                            message: 'An error occurred while creating manual withdrawal (5)'
                                        });

                                        return cooldown(false, true);
                                    }

                                    userService.updateBalance(userid, 'main', newbalance);

                                    emitSocketToRoom(userid, 'message', 'success', {
                                        message: 'A manual withdraw order has been created!'
                                    });

                                    emitSocketToUser(socket, 'message', 'info', {
                                        message: 'Manual withdraw order was created successfully!'
                                    });

                                    loggerDebug('[ADMIN] Manual withdraw order #' + row7.insertId + ' has been created');

                                    cooldown(false, false);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

/* ----- CLIENT USAGE ----- */
function confirmWithdrawListing(user, socket, method, trade, secret, cooldown){
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
        });

        return cooldown(false, true);
    }

    if(!config.app.access_secrets.includes(secret)) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid secret!'
        });

        return cooldown(false, true);
    }

    /* CHECK DATA */

    var allowed_method = [
        'crypto'
    ];

    if(!allowed_method.includes(method)) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid method!'
        });

        return cooldown(false, true);
    }

    /* END CHECK DATA */

    if(method == 'crypto') {
        cryptoService.confirmWithdrawListing(user, trade, function(err1, transactionid){
            if(err1){
                emitSocketToUser(socket, 'message', 'error', {
                    message: err1.message
                });

                return cooldown(false, true);
            }

            emitSocketToUser(socket, 'message', 'info', {
                message: 'Crypto withdraw order was confirmed successfully!'
            });

            emitSocketToUser(socket, 'site', 'refresh');

            cooldown(false, false);
        });
    }
}

/* ----- CLIENT USAGE ----- */
function cancelWithdrawListing(user, socket, method, trade, secret, cooldown){
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
        });

        return cooldown(false, true);
    }

    if(!config.app.access_secrets.includes(secret)) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid secret!'
        });

        return cooldown(false, true);
    }

    /* CHECK DATA */

    var allowed_method = [
        'crypto'
    ];

    if(!allowed_method.includes(method)) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid method!'
        });

        return cooldown(false, true);
    }

    /* END CHECK DATA */

    if(method == 'crypto') {
        cryptoService.cancelWithdrawListing(user, trade, function(err1){
            if(err1){
                emitSocketToUser(socket, 'message', 'error', {
                    message: err1.message
                });

                return cooldown(false, true);
            }

            emitSocketToUser(socket, 'message', 'info', {
                message: 'Crypto withdraw order was canceled successfully!'
            });

            emitSocketToUser(socket, 'site', 'refresh');

            cooldown(false, false);
        });
    }
}

/* ----- CLIENT USAGE ----- */
function setManuallyWithdrawAmount(user, socket, amount, secret, cooldown){
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
        });

        return cooldown(false, true);
    }

    if(!config.app.access_secrets.includes(secret)) {
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid secret!'
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

        if(amount < 0){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'The amount must have a greater value!'
            });

            return cooldown(false, true);
        }

        settingsService.saveSettings('payments..manually..amount', getFormatAmount(amount), function(err1){
            if(err1){
                emitSocketToUser(socket, 'message', 'error', {
                    message: err1.message
                });

                return cooldown(false, true);
            }

            emitSocketToUser(socket, 'message', 'success', {
                message: 'Amount saved!'
            });

            emitSocketToUser(socket, 'site', 'refresh');

            cooldown(false, false);
        });
    });
}

/* ----- CLIENT USAGE ----- */
function getCryptoWithdrawListings(user, socket, page, cooldown){
    cooldown(true, true);

    if(!config.settings.allowed.admin.includes(user.userid)){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'You don\'t have permission to use that!'
        });

        return cooldown(false, true);
    }

    /* CHECK DATA */

    if(isNaN(Number(page))){
        emitSocketToUser(socket, 'message', 'error', {
            message: 'Invalid page!'
        });

        return cooldown(false, true);
    }

    page = parseInt(page);

    /* END CHECK DATA */

    pool.query('SELECT COUNT(*) AS `count` FROM `crypto_listings` INNER JOIN `users` ON crypto_listings.userid = users.userid WHERE crypto_listings.confirmed = 0 AND crypto_listings.canceled = 0', function(err1, row1){
        if(err1){
            emitSocketToUser(socket, 'message', 'error', {
                message: 'An error occurred while getting crypto withdraw listings (1)'
            });

            return cooldown(false, true);
        }

        var pages = Math.ceil(row1[0].count / 10);

        if(pages <= 0){
            emitSocketToUser(socket, 'pagination', 'admin_crypto_confirmations', {
                list: [],
                pages: 1,
                page: 1
            });

            return cooldown(false, false);
        }

        if(page <= 0 || page > pages) {
            emitSocketToUser(socket, 'message', 'error', {
                message: 'Invalid page!'
            });

            return cooldown(false, true);
        }

        pool.query('SELECT users.userid, users.name, users.avatar, users.xp, crypto_listings.id, crypto_listings.amount, crypto_listings.currency, crypto_listings.time FROM `crypto_listings` INNER JOIN `users` ON crypto_listings.userid = users.userid WHERE crypto_listings.confirmed = 0 AND crypto_listings.canceled = 0 ORDER BY crypto_listings.id ASC LIMIT 10 OFFSET ' + pool.escape(page * 10 - 10), function(err2, row2){
            if(err2){
                emitSocketToUser(socket, 'message', 'error', {
                    message: 'An error occurred while getting crypto withdraw listings (2)'
                });

                return cooldown(false, true);
            }

            var list = row2.map(a => ({
                id: a.id,
                user: getUserInfo({
                    userid: a.userid,
                    name: a.name,
                    avatar: a.avatar,
                    xp: parseInt(a.xp),
                    anonymous: 0
                }),
                amount: getFormatAmountString(a.amount),
                currency: a.currency,
                date: makeDate(new Date(a.time * 1000))
            }));

            emitSocketToUser(socket, 'pagination', 'admin_crypto_confirmations', {
                list: list,
                pages: pages,
                page: page
            });

            cooldown(false, false);
        });
    });
}

module.exports = {
    createDepositBonus, removeDepositBonus, getDepositBonuses,

    createManualDeposit, createManualWithdrawal,

    confirmWithdrawListing, cancelWithdrawListing, setManuallyWithdrawAmount,

    getCryptoWithdrawListings
};