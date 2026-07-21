var { pool } = require('@/lib/database.js');

var config = require('@/config/config.js');

var { getFormatAmountString } = require('@/utils/formatAmount.js');
var { makeDate, time } = require('@/utils/formatDate.js');

exports.adminBonusCodes = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    var response = {
        admin: {
            bonuscodes: {
                bonus_codes: {
                    list: [],
                    pages: 1,
                    page: 1
                }
            }
        }
    };

    if(!res.locals.user.authorized.admin){
        return res.render('admin/adminBonusCodes', {
            layout: 'layouts/admin',
            page: 'admin',
            name: config.app.pages['admin'],
            breadcrumb: [{
                page: 'bonuscodes',
                name: 'Bonus Codes'
            }],
            response: response
        });
    }

    pool.query('SELECT COUNT(*) AS `count` FROM `bonus_codes` WHERE `removed` = 0', function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin bonus codes page (1)' });

        pool.query('SELECT bonus_codes.id, bonus_codes.code, bonus_codes.amount, bonus_codes.uses AS `max`, COUNT(bonus_uses.id) AS `total`, bonus_codes.expire FROM `bonus_codes` LEFT JOIN `bonus_uses` ON bonus_codes.id = bonus_uses.bonusid WHERE bonus_codes.removed = 0 GROUP BY bonus_codes.id ORDER BY bonus_codes.id DESC LIMIT 10', function(err2, row2) {
            if(err2) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin bonus codes page (2)' });

            var pages = Math.ceil(row1[0].count / 10);

            response.admin.bonuscodes.bonus_codes.list = row2.map(a => ({
                id: a.id,
                code: a.code.toUpperCase(),
                amount: getFormatAmountString(a.amount),
                uses: {
                    total: parseInt(a.total),
                    max: parseInt(a.max)
                },
                status: parseInt(a.total) < parseInt(a.max) ? a.expire > time() || a.expire == -1 ? 'active' : 'expired' : 'used',
                expire: a.expire > 0 ? makeDate(new Date(a.expire * 1000)) : 'Unset'
            }));

            if(pages > 0) {
                response.admin.bonuscodes.bonus_codes.pages = pages;
            }

            res.render('admin/adminBonusCodes', {
                layout: 'layouts/admin',
                page: 'admin',
                name: config.app.pages['admin'],
                breadcrumb: [{
                    page: 'bonuscodes',
                    name: 'Bonus Codes'
                }],
                response: response
            });
        });
    });
};