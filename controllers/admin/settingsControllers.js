var { pool } = require('@/lib/database.js');

var config = require('@/config/config.js');

var { time } = require('@/utils/formatDate.js');

exports.adminSettings = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    var response = {
        admin: {
            settings: {
                maintenance: {
                    status: false
                },
                tracking_links: {
                    list: [],
                    pages: 1,
                    page: 1
                },
                allowed: {
                    admin: []
                }
            }
        }
    };

    if(!res.locals.user.authorized.admin){
        return res.render('admin/adminSettings', {
            layout: 'layouts/admin',
            page: 'admin',
            name: config.app.pages['admin'],
            breadcrumb: [{
                page: 'settings',
                name: 'Settings'
            }],
            response: response
        });
    }

    pool.query('SELECT `reason` FROM `maintenance` WHERE `removed` = 0 ORDER BY `id` DESC LIMIT 1', function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin settings page (1)' });

        pool.query('SELECT COUNT(*) AS `count` FROM `tracking_links` WHERE `removed` = 0 AND (`expire` > ' + pool.escape(time()) + ' OR `expire` = -1)', function(err2, row2) {
            if(err2) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin settings page (2)' });

            pool.query('SELECT `id`, `userid`, `referral`, `name` FROM `tracking_links` WHERE `removed` = 0 AND (`expire` > ' + pool.escape(time()) + ' OR `expire` = -1) ORDER BY `id` ASC LIMIT 10', function(err3, row3) {
                if(err3) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin settings page (3)' });

                var pages1 = Math.ceil(row2[0].count / 10);

                if(row1.length > 0) {
                    response.admin.settings.maintenance = {
                        status: true,
                        reason: row1[0].reason
                    };
                }

                response.admin.settings.tracking_links.list = row3.map(a => ({
                    id: a.id,
                    referral: a.referral,
                    userid: a.userid,
                    name: a.name,
                    link: config.app.url + '?ref=' + a.referral
                }));

                if(pages1 > 0) {
                    response.admin.settings.tracking_links.pages = pages1;
                }

                response.admin.settings.allowed.admin = config.settings.allowed.admin;

                res.render('admin/adminSettings', {
                    layout: 'layouts/admin',
                    page: 'admin',
                    name: config.app.pages['admin'],
                    breadcrumb: [{
                        page: 'settings',
                        name: 'Settings'
                    }],
                    response: response
                });
            });
        });
    });
};