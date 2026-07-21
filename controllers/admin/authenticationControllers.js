var config = require('@/config/config.js');

var { capitalizeText } = require('@/utils/utils.js');

exports.authentication = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    res.render('admin/adminAuthentication', {
        layout: 'layouts/admin',
        page: 'admin',
        name: config.app.pages['admin'],
        breadcrumb: [{
            page: 'authentication',
            name: 'Authentication'
        }],
        response: {
            admin: {
                links: Object.keys(config.settings.server.auth).map(a => ({
                    provider: a,
                    name: capitalizeText(a),
                    enable: config.settings.server.auth[a].enable
                }))
            }
        }
    });
};