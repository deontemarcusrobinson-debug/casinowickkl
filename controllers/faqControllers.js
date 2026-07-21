var { roundedToFixed, getFormatAmountString } = require('@/utils/formatAmount.js');

var config = require('@/config/config.js');

exports.faq = async (req, res) => {
    res.render('faq', {
        page: 'faq',
        name: config.app.pages['faq'],
        response: {
            faq: {
                rewards: {
                    referral: getFormatAmountString(config.app.rewards.amounts.refferal_code)
                },
                affiliates: {
                    earnings: Object.keys(config.app.affiliates.earnings).reduce((acc, cur) => ({ ...acc, [cur]: roundedToFixed(config.app.affiliates.earnings[cur].slice(-1)[0], 2).toFixed(2) }), {})
                }
            }
        }
    });
};