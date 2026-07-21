var { pool } = require('@/lib/database.js');

var config = require('@/config/config.js');

var { getFormatAmountString } = require('@/utils/formatAmount.js');
var { makeDate } = require('@/utils/formatDate.js');

exports.adminInvoices = async (req, res, next) => {
    if(!res.locals.user) return next();
    if(!res.locals.settings.allowed.admin.includes(res.locals.user.userid)) return next();

    var response = {
        admin: {
            invoices: {
                invoices: {
                    list: [],
                    pages: 1,
                    page: 1
                }
            }
        }
    };

    function render(){
        res.render('admin/adminInvoices', {
            layout: 'layouts/admin',
            page: 'admin',
            name: config.app.pages['admin'],
            breadcrumb: [{
                page: 'invoices',
                name: 'Customer In Game Invoices'
            }],
            response: response
        });
    }

    if(!res.locals.user.authorized.admin) return render();

    pool.query('SELECT `id`, `invoiceid`, `customer`, `product`, `amount`, `currency`, `status`, `time` FROM `invoices` ORDER BY `id` DESC LIMIT 10', function(err1, row1) {
        if(err1) return res.status(409).render('409', { layout: 'layouts/error', error: 'An error occurred while rendering admin invoices page (1)' });

        response.admin.invoices.invoices.list = row1.map(a => ({
            id: a.id,
            invoiceid: a.invoiceid,
            customer: a.customer,
            product: a.product,
            amount: getFormatAmountString(a.amount),
            currency: a.currency,
            status: a.status,
            time: makeDate(new Date(a.time * 1000))
        }));

        render();
    });
};
