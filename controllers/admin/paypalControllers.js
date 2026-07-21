var { pool } = require('@/lib/database.js');

var config = require('@/config/config.js');

var { time } = require('@/utils/formatDate.js');

var paypalService = require('@/services/trading/paypalService.js');

function loadConnection(callback){
    pool.query('SELECT `mode`, `payer_id`, `email`, `display_name`, `access_token`, `refresh_token`, `token_expire`, `connected_at`, `active`, `business_email` FROM `paypal_config` WHERE `id` = 1', function(err1, row1) {
        if(err1) return callback(err1);

        if(row1.length <= 0) {
            return callback(null, {
                mode: config.trading.paypal.mode,
                payer_id: '',
                email: '',
                display_name: '',
                access_token: null,
                refresh_token: null,
                token_expire: 0,
                connected_at: 0,
                active: 0,
                business_email: ''
            });
        }

        callback(null, row1[0]);
    });
}

function ensureRow(callback){
    pool.query('INSERT IGNORE INTO `paypal_config` (`id`) VALUES (1)', function(err1) {
        callback(err1 || null);
    });
}

function saveConnection(token, callback){
    var connectedAt = time();
    var expireAt = connectedAt + (parseInt(token.expires_in, 10) || 28800);
    var mode = token.mode || config.trading.paypal.mode;
    var displayName = config.app.name || 'GoldWitch';
    var payerId = token.app_id || ('app:' + String(config.trading.paypal.client_id).slice(0, 24));

    ensureRow(function(err1) {
        if(err1) return callback(err1);

        pool.query(
            'UPDATE `paypal_config` SET ' +
            '`mode` = ' + pool.escape(mode) + ', ' +
            '`client_id` = ' + pool.escape(config.trading.paypal.client_id) + ', ' +
            '`secret` = ' + pool.escape(config.trading.paypal.client_secret) + ', ' +
            '`payer_id` = ' + pool.escape(payerId) + ', ' +
            '`email` = \'\', ' +
            '`display_name` = ' + pool.escape(displayName) + ', ' +
            '`business_email` = \'\', ' +
            '`access_token` = ' + pool.escape(token.access_token || '') + ', ' +
            '`refresh_token` = NULL, ' +
            '`token_expire` = ' + pool.escape(expireAt) + ', ' +
            '`connected_at` = ' + pool.escape(connectedAt) + ', ' +
            '`active` = 1, ' +
            '`time` = ' + pool.escape(connectedAt) + ' ' +
            'WHERE `id` = 1',
            callback
        );
    });
}

exports.adminPaypal = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    loadConnection(function(err1, cfg) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin paypal page (1)' });

        var connected = !!(cfg.active && paypalService.isConfigured());

        res.render('admin/adminPaypal', {
            layout: 'layouts/admin',
            page: 'admin',
            name: config.app.pages['admin'],
            breadcrumb: [{
                page: 'paypal',
                name: 'Connect PayPal'
            }],
            response: {
                admin: {
                    paypal: {
                        platform_ready: paypalService.isConfigured(),
                        mode: cfg.mode || config.trading.paypal.mode,
                        connected: connected,
                        email: cfg.email || cfg.business_email || '',
                        display_name: cfg.display_name || config.app.name || 'GoldWitch',
                        payer_id: cfg.payer_id || '',
                        connected_at: cfg.connected_at || 0,
                        just_connected: req.query.connected === '1',
                        disconnected: req.query.disconnected === '1',
                        error: req.query.error || ''
                    }
                }
            }
        });
    });
};

exports.adminPaypalConnect = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    if(!paypalService.isConfigured()) {
        return res.redirect('/admin/paypal?error=not_configured');
    }

    // Link using REST app credentials (no PayPal login redirect — avoids redirect_uri errors)
    paypalService.getClientToken(function(err1, token) {
        if(err1) {
            console.error('[paypal] auto-connect failed:', err1.message || err1);
            return res.redirect('/admin/paypal?error=auth_failed');
        }

        saveConnection(token, function(err2) {
            if(err2) {
                console.error('[paypal] save connection failed:', err2);
                return res.redirect('/admin/paypal?error=save');
            }

            res.redirect('/admin/paypal?connected=1');
        });
    });
};

exports.adminPaypalCallback = async (req, res, next) => {
    // Kept for older OAuth return URLs — just send user to connect page
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();
    res.redirect('/admin/paypal/connect');
};

exports.adminPaypalDisconnect = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    pool.query(
        'UPDATE `paypal_config` SET `payer_id` = \'\', `email` = \'\', `display_name` = \'\', `business_email` = \'\', `client_id` = \'\', `secret` = \'\', `access_token` = NULL, `refresh_token` = NULL, `token_expire` = 0, `connected_at` = 0, `active` = 0, `time` = ' + pool.escape(time()) + ' WHERE `id` = 1',
        function(err1) {
            if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while disconnecting PayPal' });

            res.redirect('/admin/paypal?disconnected=1');
        }
    );
};
