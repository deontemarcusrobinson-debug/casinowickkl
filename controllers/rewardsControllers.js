var { pool } = require('@/lib/database.js');

var { capitalizeText } = require('@/utils/utils.js');
var { getFormatAmountString } = require('@/utils/formatAmount.js');

var config = require('@/config/config.js');

exports.rewardsUnset = async (req, res, next) => {
    res.redirect('/rewards/' + [
        'tasks'
    ][0]);
};

exports.rewardsTasks = async (req, res, next) => {
    var response = {
        rewards: {
            referral: {
                amount: getFormatAmountString(config.app.rewards.amounts.refferal_code),
                redemeed: false,
                name: null
            },
            tasks: {
                ...Object.keys(config.settings.server.auth).reduce((acc, cur) => ({ ...acc, [cur]: {
                    id: cur,
                    title: 'Connect',
                    description: 'Link your ' + capitalizeText(cur) + ' to your account',
                    amount: getFormatAmountString(config.app.rewards.amounts[cur]),
                    completed: false
                } }), {})
            }
        }
    }

    if(!res.locals.user) return res.render('rewardsTasks', {
        page: 'rewards',
        name: config.app.pages['rewards'],
        response: response
    });

    pool.query('SELECT users.name FROM `referral_uses` INNER JOIN `users` ON referral_uses.referral = users.userid WHERE referral_uses.userid = ' + pool.escape(res.locals.user.userid), function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering rewards page (1)' });

        pool.query('SELECT `reward` FROM `users_rewards` WHERE `reward` IN (' + Object.keys(config.settings.server.auth).map(a => '"' + a + '"').join(', ') + ') AND `userid` = ' + pool.escape(res.locals.user.userid), function(err2, row2) {
            if(err2) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering rewards page (2)' });

            if(row1.length > 0) {
                if(row1.length > 0) {
                    response.rewards.referral.redemeed = true;
                    response.rewards.referral.name = row1[0].name;
                }
            }

            response.rewards.tasks = {
                ...response.rewards.tasks,
                ...row2.reduce((acc, cur) => ({ ...acc, [cur.reward]: {
                    ...response.rewards.tasks[cur.reward],
                    completed: true
                } }), {})
            }

            res.render('rewardsTasks', {
                page: 'rewards',
                name: config.app.pages['rewards'],
                response: response
            });
        });
    });
};