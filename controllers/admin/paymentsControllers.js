var { pool } = require('@/lib/database.js');

var config = require('@/config/config.js');

var { roundedToFixed, getFormatAmountString } = require('@/utils/formatAmount.js');
var { makeDate } = require('@/utils/formatDate.js');
var { getUserInfo } = require('@/utils/user.js');

exports.adminPayments = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    var response = {
        admin: {
            payments: {
                status: false,
                crypto: {
                    list: [],
                    pages: 1,
                    page: 1
                },
                manually: {
                    amount: '0.00',
                    enable: {
                        crypto: false
                    }
                },
                deposit_bonuses: {
                    list: [],
                    pages: 1,
                    page: 1
                },
                enable: {
                    ...[
                        'crypto'
                    ].reduce((acc, cur) => ({ ...acc, [cur]: [] }), {}),
                    ...[
                        'cash'
                    ].reduce((acc, cur) => ({ ...acc, [cur]: [] }), {})
                }
            }
        }
    };

    if(!res.locals.user.authorized.admin){
        return res.render('admin/adminPayments', {
            layout: 'layouts/admin',
            page: 'admin',
            name: config.app.pages['admin'],
            breadcrumb: [{
                page: 'payments',
                name: 'Payments'
            }],
            response: response
        });
    }

    //CRYPTO PAYMENTS
            pool.query('SELECT COUNT(*) AS `count` FROM `crypto_listings` INNER JOIN `users` ON crypto_listings.userid = users.userid WHERE crypto_listings.confirmed = 0 AND crypto_listings.canceled = 0', function(err3, row3) {
                if(err3) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin payments page (3)' });

                pool.query('SELECT users.userid, users.name, users.avatar, users.xp, crypto_listings.id, crypto_listings.amount, crypto_listings.currency, crypto_listings.time FROM `crypto_listings` INNER JOIN `users` ON crypto_listings.userid = users.userid WHERE crypto_listings.confirmed = 0 AND crypto_listings.canceled = 0 ORDER BY crypto_listings.id ASC LIMIT 10', function(err4, row4) {
                    if(err4) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin payments page (4)' });

                    pool.query('SELECT COUNT(*) AS `count` FROM `deposit_codes` WHERE `removed` = 0', function(err5, row5) {
                        if(err5) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin payments page (5)' });

                        pool.query('SELECT `id`, `referral`, `code`, `uses`, `amount` FROM `deposit_codes` WHERE `removed` = 0 ORDER BY `id` ASC LIMIT 10', function(err6, row6) {
                            if(err6) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin payments page (6)' });

                            var pages2 = Math.ceil(row3[0].count / 10);
                            var pages3 = Math.ceil(row5[0].count / 10);

                            response.admin.payments.status = config.settings.payments.status;

                            response.admin.payments.crypto.list = row4.map(a => ({
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

                            if(pages2 > 0) {
                                response.admin.payments.crypto.pages = pages2;
                            }

                            response.admin.payments.manually.amount = getFormatAmountString(config.settings.payments.manually.amount);
                            response.admin.payments.manually.enable.crypto = config.settings.payments.manually.enable.crypto;

                            response.admin.payments.deposit_bonuses.list = row6.map(a => ({
                                id: a.id,
                                code: a.code.toUpperCase(),
                                referral: a.referral,
                                uses: parseInt(a.uses),
                                amount: roundedToFixed(a.amount, 5).toFixed(5)
                            }));

                            if(pages3 > 0) {
                                response.admin.payments.deposit_bonuses.pages = pages3;
                            }

                            response.admin.payments.enable = {
                                ...[
                                    'crypto'
                                ].reduce((acc, cur) => ({ ...acc, [cur]: Object.keys(config.settings.payments.methods[cur]).map(a => ({
                                    method: a,
                                    enable: {
                                        deposit: config.settings.payments.methods[cur][a].enable.deposit,
                                        withdraw: config.settings.payments.methods[cur][a].enable.withdraw
                                    },
                                    name: config.settings.payments.methods[cur][a].name
                                })) }), {}),
                                ...[
                                    'cash'
                                ].reduce((acc, cur) => ({ ...acc, [cur]: Object.keys(config.settings.payments.methods[cur]).map(a => ({
                                    method: a,
                                    enable: {
                                        deposit: config.settings.payments.methods[cur][a].enable.deposit
                                    },
                                    name: config.settings.payments.methods[cur][a].name
                                })) }), {})
                            };

                            res.render('admin/adminPayments', {
                                layout: 'layouts/admin',
                                page: 'admin',
                                name: config.app.pages['admin'],
                                breadcrumb: [{
                                    page: 'payments',
                                    name: 'Payments'
                                }],
                                response: response
                            });
                        });
                    });
    });
            });
};