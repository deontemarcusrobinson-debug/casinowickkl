var config = require('@/config/config.js');

exports.adminDashboardUnset = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    res.redirect('/admin/dashboard/summary');
};

exports.adminDashboardSummary = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    res.render('admin/adminDashboardSummary', {
        layout: 'layouts/admin',
        page: 'admin',
        name: config.app.pages['dashboard'],
        breadcrumb: [{
            page: 'dashboard',
            name: 'Dashboard'
        }, {
            page: 'summary',
            name: 'Summary'
        }]
    });
};

exports.adminDashboardGamesUnset = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    res.redirect('/admin/dashboard/games/summary');
};

exports.adminDashboardGamesSummary = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    res.render('admin/adminDashboardGamesSummary', {
        layout: 'layouts/admin',
        page: 'admin',
        name: config.app.pages['dashboard'],
        breadcrumb: [{
            page: 'dashboard',
            name: 'Dashboard'
        }, {
            page: 'games',
            name: 'Games'
        }, {
            page: 'summary',
            name: 'Summary'
        }]
    });
};

exports.adminDashboardGame = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    if(config.settings.games.games.original[req.params.game] === undefined && config.settings.games.games.classic[req.params.game] === undefined) return next();

    res.render('admin/adminDashboardGame', {
        layout: 'layouts/admin',
        page: 'admin',
        name: config.app.pages['dashboard'],
        breadcrumb: [{
            page: 'dashboard',
            name: 'Dashboard'
        }, {
            page: 'games',
            name: 'Games'
        }, {
            page: req.params.game,
            name: config.app.pages[req.params.game]
        }],
        response: {
            admin: {
                dashboard: {
                    game: req.params.game
                }
            }
        }
    });
};

exports.adminDashboardPaymentsDefault = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    res.redirect('/admin/dashboard/payments/summary');
};

exports.adminDashboardPaymentsSummary = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    res.render('admin/adminDashboardPaymentsSummary', {
        layout: 'layouts/admin',
        page: 'admin',
        name: config.app.pages['dashboard'],
        breadcrumb: [{
            page: 'dashboard',
            name: 'Dashboard'
        }, {
            page: 'payments',
            name: 'Payments'
        }, {
            page: 'summary',
            name: 'Summary'
        }]
    });
};

exports.adminDashboardPaymentsDeposits = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    res.render('admin/adminDashboardPaymentsDeposits', {
        layout: 'layouts/admin',
        page: 'admin',
        name: config.app.pages['dashboard'],
        breadcrumb: [{
            page: 'dashboard',
            name: 'Dashboard'
        }, {
            page: 'payments',
            name: 'Payments'
        }, {
            page: 'deposits',
            name: 'Deposits'
        }]
    });
};

exports.adminDashboardPaymentsWithdrawals = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    res.render('admin/adminDashboardPaymentsWithdrawals', {
        layout: 'layouts/admin',
        page: 'admin',
        name: config.app.pages['dashboard'],
        breadcrumb: [{
            page: 'dashboard',
            name: 'Dashboard'
        }, {
            page: 'payments',
            name: 'Payments'
        }, {
            page: 'withdrawals',
            name: 'Withdrawals'
        }]
    });
};