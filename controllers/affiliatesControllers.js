var { pool } = require('@/lib/database.js');

var { roundedToFixed, getFormatAmount, getFormatAmountString } = require('@/utils/formatAmount.js');
var { getUserInfo } = require('@/utils/user.js');

var config = require('@/config/config.js');

exports.affiliates = async (req, res, next) => {
    var response = {
        affiliates: {
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

    if(!res.locals.user) return res.render('affiliates', {
        page: 'affiliates',
        name: config.app.pages['affiliates'],
        response: response
    });

    // REFERRAL CODE
    pool.query('SELECT `code`, `collected`, `available` FROM `referral_codes` WHERE `userid` = ' + pool.escape(res.locals.user.userid), function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering affiliates page (1)' });

        // TOTAL
        pool.query('SELECT COUNT(*) AS `total` FROM `referral_uses` WHERE `referral` = ' + pool.escape(res.locals.user.userid), function(err2, row2) {
            if(err2) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering affiliates page (2)' });

            // EARNINGS WAGERED
            pool.query('SELECT COALESCE(SUM(`commission`), 0) AS `commission` FROM `referral_wagered` WHERE `referral` = ' + pool.escape(res.locals.user.userid), function(err3, row3) {
                if(err3) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering affiliates page (3)' });

                // EARNINGS DEPOSITED
                pool.query('SELECT COALESCE(SUM(`amount`), 0) AS `amount`, COALESCE(SUM(`commission`), 0) AS `commission` FROM `referral_deposited` WHERE `referral` = ' + pool.escape(res.locals.user.userid), function(err4, row4) {
                    if(err4) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering affiliates page (4)' });

                    pool.query('SELECT COUNT(*) AS `count` FROM `referral_uses` INNER JOIN `users` ON referral_uses.userid = users.userid WHERE referral_uses.referral = ' + pool.escape(res.locals.user.userid), function(err5, row5) {
                        if(err5) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering affiliates page (5)' });

                        pool.query('SELECT users.userid, users.name, users.avatar, users.xp, COALESCE(deposited.amount, 0) AS `deposited`, COALESCE(deposited.commission, 0) AS `commission_deposited`, COALESCE(wagered.amount, 0) AS `wagered`, COALESCE(wagered.commission, 0) AS `commission_wagered` FROM `referral_uses` INNER JOIN `users` ON referral_uses.userid = users.userid LEFT JOIN (SELECT `userid`, SUM(`amount`) AS `amount`, SUM(`commission`) AS `commission` FROM `referral_deposited` WHERE `referral` = ' + pool.escape(res.locals.user.userid) + ' GROUP BY `userid`) `deposited` ON referral_uses.userid = deposited.userid LEFT JOIN (SELECT `userid`, SUM(`amount`) AS `amount`, SUM(`commission`) AS `commission` FROM `referral_wagered` WHERE `referral` = ' + pool.escape(res.locals.user.userid) + ' GROUP BY `userid`) `wagered` ON referral_uses.userid = wagered.userid WHERE referral_uses.referral = ' + pool.escape(res.locals.user.userid) + ' ORDER BY referral_uses.time ASC LIMIT 10', function(err6, row6) {
                            if(err6) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering affiliates page (6)' });

                            if(row1.length > 0) {
                                response.affiliates.referral = row1[0].code;

                                response.affiliates.overview.earnings.total = getFormatAmountString(row1[0].collected);
                                response.affiliates.overview.earnings.available = getFormatAmountString(row1[0].available);
                            }

                            response.affiliates.overview.users = parseInt(row2[0].total);

                            response.affiliates.overview.earnings.wagered = getFormatAmountString(row3[0].commission);
                            response.affiliates.overview.earnings.deposited = getFormatAmountString(row4[0].commission);

                            var pages = Math.ceil(row5[0].count / 10);

                            response.affiliates.referred_users.pages = pages > 0 ? pages : 1;
                            response.affiliates.referred_users.list = row6.map(a => ({
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

                            var deposited = getFormatAmount(row4[0].amount);

                            var tiers = config.app.affiliates.requirements.map((amount, tier) => ({ amount, tier })).filter(a => deposited < a.amount);
                            var tier = tiers.length > 0 ? tiers[0].tier - 1 : config.app.affiliates.requirements.length - 1;

                            response.affiliates.tiers = response.affiliates.tiers.map(a => ({
                                ...a,
                                unlocked: a.tier <= tier + 1
                            }))

                            response.affiliates.tier.tier = tier + 1;
                            response.affiliates.tier.name = [ 'steel', 'bronze', 'silver', 'gold', 'diamond' ][tier];
                            response.affiliates.tier.progress = roundedToFixed(Math.min(deposited, config.app.affiliates.requirements.slice(-1)[0]) / config.app.affiliates.requirements[Math.min(tier + 1, config.app.affiliates.requirements.length - 1)] * 100, 2).toFixed(2);
                            response.affiliates.tier.deposited = getFormatAmountString(deposited);
                            response.affiliates.tier.target = getFormatAmountString(config.app.affiliates.requirements[Math.min(tier + 1, config.app.affiliates.requirements.length - 1)]);

                            res.render('affiliates', {
                                page: 'affiliates',
                                name: config.app.pages['affiliates'],
                                response: response
                            });
                        });
                    });
                });
            });
        });
    });
};