var { pool } = require('@/lib/database.js');

var config = require('@/config/config.js');

var { roundedToFixed, getFormatAmount, getFormatAmountString } = require('@/utils/formatAmount.js');
var { makeDate } = require('@/utils/formatDate.js');
var { getUserInfo } = require('@/utils/user.js');

exports.adminReferrals = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    var response = {
        admin: {
            referrals: {
                list: [],
                pages: 1,
                page: 1
            }
        }
    };

    if(!res.locals.user.authorized.admin){
        return res.render('admin/adminReferrals', {
            layout: 'layouts/admin',
            page: 'admin',
            name: config.app.pages['admin'],
            breadcrumb: [{
                page: 'referrals',
                name: 'Referrals'
            }],
            response: response
        });
    }

    pool.query('SELECT COUNT(*) AS `count` FROM `referral_codes` INNER JOIN `users` ON referral_codes.userid = users.userid', function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin referrals page (1)' });

        pool.query('SELECT users.userid, users.name, users.avatar, users.xp, referral_codes.code, (referral_codes.collected + referral_codes.available) AS `earnings`, referral_codes.time FROM `referral_codes` INNER JOIN `users` ON referral_codes.userid = users.userid ORDER BY referral_codes.time ASC LIMIT 10', function(err2, row2) {
            if(err2) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin referrals page (2)' });

            var pages = Math.ceil(row1[0].count / 10);

            response.admin.referrals.list = row2.map(a => ({
                user: getUserInfo({
                    userid: a.userid,
                    name: a.name,
                    avatar: a.avatar,
                    xp: parseInt(a.xp),
                    anonymous: 0
                }),
                code: a.code,
                earnings: getFormatAmountString(a.earnings),
                created: makeDate(new Date(a.time * 1000))
            }));

            if(pages > 0) {
                response.admin.referrals.pages = pages;
            }

            res.render('admin/adminReferrals', {
                layout: 'layouts/admin',
                page: 'admin',
                name: config.app.pages['admin'],
                breadcrumb: [{
                    page: 'referrals',
                    name: 'Referrals'
                }],
                response: response
            });
        });
    });
};

exports.adminReferral = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    if(!res.locals.user.authorized.admin) return res.redirect('/admin/referrals');

    var { userid } = req.params;

    pool.query('SELECT `userid`, `name` FROM `users` WHERE `bot` = 0 AND `userid` = ' + pool.escape(userid), function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin referral page (1)' });

        if(row1.length <= 0) return next();

        var response = {
            admin: {
                referrals: {
                    user: {
                        userid: row1[0].userid,
                        name: row1[0].name
                    },
                    referral: null,
                    overview: {
                        users: 0,
                        earnings: {
                            wagered: '0.00',
                            deposited: '0.00',
                            total: '0.00',
                            available: '0.00'
                        }
                    },
                    referred_users: {
                        list: [],
                        pages: 1,
                        page: 1
                    },
                    tier: {
                        tier: 1,
                        name: 'steel',
                        progress: '0.00',
                        deposited: '0.00',
                        target: config.app.affiliates.requirements[1].toFixed(2)
                    },
                    tiers: config.app.affiliates.requirements.map((a, i) => ({
                        unlocked: i == 0,
                        tier: i + 1,
                        name: [ 'steel', 'bronze', 'silver', 'gold', 'diamond' ][i],
                        required: getFormatAmountString(a),
                        earnings: Object.keys(config.app.affiliates.earnings).reduce((acc, cur) => ({ ...acc, [cur]: roundedToFixed(config.app.affiliates.earnings[cur][i], 2).toFixed(2) }), {})
                    }))
                }
            }
        }

        // REFERRAL CODE
        pool.query('SELECT `code`, `collected`, `available` FROM `referral_codes` WHERE `userid` = ' + pool.escape(row1[0].userid), function(err2, row2) {
            if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering referral page (2)' });

            // TOTAL
            pool.query('SELECT COUNT(*) AS `total` FROM `referral_uses` WHERE `referral` = ' + pool.escape(row1[0].userid), function(err3, row3) {
                if(err3) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering referral page (3)' });

                // EARNINGS WAGERED
                pool.query('SELECT COALESCE(SUM(`commission`), 0) AS `commission` FROM `referral_wagered` WHERE `referral` = ' + pool.escape(row1[0].userid), function(err4, row4) {
                    if(err4) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering referral page (4)' });

                    // EARNINGS DEPOSITED
                    pool.query('SELECT COALESCE(SUM(`amount`), 0) AS `amount`, COALESCE(SUM(`commission`), 0) AS `commission` FROM `referral_deposited` WHERE `referral` = ' + pool.escape(row1[0].userid), function(err5, row5) {
                        if(err5) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering referral page (5)' });

                        pool.query('SELECT COUNT(*) AS `count` FROM `referral_uses` INNER JOIN `users` ON referral_uses.userid = users.userid WHERE referral_uses.referral = ' + pool.escape(row1[0].userid), function(err6, row6) {
                            if(err6) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering referral page (6)' });

                            pool.query('SELECT users.userid, users.name, users.avatar, users.xp, COALESCE(deposited.amount, 0) AS `deposited`, COALESCE(deposited.commission, 0) AS `commission_deposited`, COALESCE(wagered.amount, 0) AS `wagered`, COALESCE(wagered.commission, 0) AS `commission_wagered` FROM `referral_uses` INNER JOIN `users` ON referral_uses.userid = users.userid LEFT JOIN (SELECT `userid`, SUM(`amount`) AS `amount`, SUM(`commission`) AS `commission` FROM `referral_deposited` WHERE `referral` = ' + pool.escape(row1[0].userid) + ' GROUP BY `userid`) `deposited` ON referral_uses.userid = deposited.userid LEFT JOIN (SELECT `userid`, SUM(`amount`) AS `amount`, SUM(`commission`) AS `commission` FROM `referral_wagered` WHERE `referral` = ' + pool.escape(row1[0].userid) + ' GROUP BY `userid`) `wagered` ON referral_uses.userid = wagered.userid WHERE referral_uses.referral = ' + pool.escape(row1[0].userid) + ' ORDER BY referral_uses.time ASC LIMIT 10', function(err7, row7) {
                                if(err7) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering referral page (7)' });

                                if(row2.length > 0) {
                                    response.admin.referrals.referral = row2[0].code;

                                    response.admin.referrals.overview.earnings.total = getFormatAmountString(row2[0].collected);
                                    response.admin.referrals.overview.earnings.available = getFormatAmountString(row2[0].available);
                                }

                                response.admin.referrals.overview.users = parseInt(row3[0].total);

                                response.admin.referrals.overview.earnings.wagered = getFormatAmountString(row4[0].commission);
                                response.admin.referrals.overview.earnings.deposited = getFormatAmountString(row5[0].commission);

                                var pages = Math.ceil(row6[0].count / 10);

                                response.admin.referrals.referred_users.pages = pages > 0 ? pages : 1;
                                response.admin.referrals.referred_users.list = row7.map(a => ({
                                    user: getUserInfo({
                                        userid: a.userid,
                                        name: a.name,
                                        avatar: a.avatar,
                                        xp: parseInt(a.xp),
                                        anonymous: 0
                                    }),
                                    wagered: getFormatAmountString(a.wagered),
                                    deposited: getFormatAmountString(a.deposited),
                                    earnings: {
                                        wagered: getFormatAmountString(a.commission_wagered),
                                        deposited: getFormatAmountString(a.commission_deposited),
                                        total: getFormatAmountString(a.commission_wagered + a.commission_deposited)
                                    }
                                }));

                                var deposited = getFormatAmount(row5[0].amount);

                                var tiers = config.app.affiliates.requirements.map((amount, tier) => ({ amount, tier })).filter(a => deposited < a.amount);
                                var tier = tiers.length > 0 ? tiers[0].tier - 1 : config.app.affiliates.requirements.length - 1;

                                response.admin.referrals.tiers = response.admin.referrals.tiers.map(a => ({
                                    ...a,
                                    unlocked: a.tier <= tier + 1
                                }))

                                response.admin.referrals.tier.tier = tier + 1;
                                response.admin.referrals.tier.name = [ 'steel', 'bronze', 'silver', 'gold', 'diamond' ][tier];
                                response.admin.referrals.tier.progress = roundedToFixed(Math.min(deposited, config.app.affiliates.requirements.slice(-1)[0]) / config.app.affiliates.requirements[Math.min(tier + 1, config.app.affiliates.requirements.length - 1)] * 100, 2).toFixed(2);
                                response.admin.referrals.tier.deposited = getFormatAmountString(deposited);
                                response.admin.referrals.tier.target = getFormatAmountString(config.app.affiliates.requirements[Math.min(tier + 1, config.app.affiliates.requirements.length - 1)]);

                                res.render('admin/adminReferral', {
                                    layout: 'layouts/admin',
                                    page: 'admin',
                                    name: config.app.pages['admin'],
                                    breadcrumb: [{
                                        page: 'referrals',
                                        name: 'Referrals'
                                    },
                                    {
                                        page: row1[0].userid,
                                        name: row1[0].name
                                    }],
                                    response: response
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};