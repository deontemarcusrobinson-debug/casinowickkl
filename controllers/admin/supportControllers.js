var { pool } = require('@/lib/database.js');

var config = require('@/config/config.js');

var { makeDate } = require('@/utils/formatDate.js');
var { getUserInfo } = require('@/utils/user.js');

exports.adminSupportUnset = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    res.redirect('/admin/support/requests');
};

exports.adminSupportRequests = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    var response = {
        admin: {
            support: {
                requests: {
                    list: [],
                    pages: 1,
                    page: 1
                }
            }
        }
    };

    if(!res.locals.user.authorized.admin){
        return res.render('admin/adminSupportRequests', {
            layout: 'layouts/admin',
            page: 'admin',
            name: config.app.pages['admin'],
            breadcrumb: [{
                page: 'support',
                name: 'Support'
            }, {
                page: 'requests',
                name: 'Requests'
            }],
            response: response
        });
    }

    pool.query('SELECT COUNT(*) AS `count` FROM `support_requests`', function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin support requests page (1)' });

        pool.query('SELECT support_requests.subject, support_requests.department, support_requests.closed, support_requests.status, support_requests.requestid, support_requests.update, support_requests.time, support_claims.userid, support_claims.name, support_claims.avatar, support_claims.xp FROM `support_requests` LEFT JOIN `support_claims` ON support_requests.id = support_claims.requestid AND support_claims.ended = 0 ORDER BY support_requests.status ASC, support_requests.id DESC LIMIT 10', function(err2, row2) {
            if(err2) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin support requests page (2)' });

            var pages = Math.ceil(row1[0].count / 10);

            response.admin.support.requests.list = row2.map(a => ({
                id: a.requestid,
                subject: a.subject,
                department: parseInt(a.department),
                closed: parseInt(a.closed),
                status: parseInt(a.status),
                assigned: parseInt(a.status) > 0 ? getUserInfo({
                    userid: a.userid,
                    name: a.name,
                    avatar: a.avatar,
                    xp: parseInt(a.xp),
                    anonymous: 0
                }) : null,
                created: makeDate(new Date(a.time * 1000)),
                updated: makeDate(new Date(a.update * 1000))
            }));

            if(pages > 0) {
                response.admin.support.requests.pages = pages;
            }

            res.render('admin/adminSupportRequests', {
                layout: 'layouts/admin',
                page: 'admin',
                name: config.app.pages['admin'],
                breadcrumb: [{
                    page: 'support',
                    name: 'Support'
                }, {
                    page: 'requests',
                    name: 'Requests'
                }],
                response: response
            });
        });
    });
};

exports.adminSupportRequest = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    if(!res.locals.user.authorized.admin) return res.redirect('/admin/support');

    var { id } = req.params;

    pool.query('SELECT `id`, `closed`, `status`, `name`, `subject`, `department`, `requestid`, `update`, `time` FROM `support_requests` WHERE `requestid` = ' + pool.escape(id), function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin support request page (1)' });

        if(row1.length <= 0) return next();

        pool.query('SELECT `userid`, `name`, `avatar`, `xp`, `response`, `message`, `time` FROM `support_messages` WHERE `requestid` = ' + pool.escape(row1[0].id) + ' ORDER BY `id` ASC', function(err2, row2) {
            if(err2) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin support request page (2)' });

            res.render('admin/adminSupportRequest', {
                layout: 'layouts/admin',
                page: 'admin',
                name: config.app.pages['admin'],
                breadcrumb: [{
                    page: 'support',
                    name: 'Support'
                }, {
                    page: 'request',
                    name: 'Request'
                }],
                response: {
                    admin: {
                        support: {
                            request: {
                                id: row1[0].requestid,
                                requester: row1[0].name,
                                subject: row1[0].subject,
                                department: parseInt(row1[0].department),
                                closed: parseInt(row1[0].closed),
                                status: parseInt(row1[0].status),
                                created: makeDate(new Date(row1[0].time * 1000)),
                                updated: makeDate(new Date(row1[0].update * 1000))
                            },
                            messages: row2.map(a => ({
                                user: getUserInfo({
                                    userid: a.userid,
                                    name: a.name,
                                    avatar: a.avatar,
                                    xp: parseInt(a.xp),
                                    anonymous: 0
                                }),
                                response: parseInt(a.response) == 1,
                                message: a.message,
                                date: makeDate(new Date(a.time * 1000))
                            }))
                        }
                    }
                }
            });
        });
    });
};