var { loggerDebug, loggerError } = require('@/lib/logger.js');

var cashService = require('@/services/trading/cashService.js');
var paypalService = require('@/services/trading/paypalService.js');

exports.webhook = async (req, res) => {
    var event = req.body || {};
    var eventType = String(event.event_type || '');

    paypalService.verifyWebhookSignature(req.headers, event, function(err1) {
        if(err1) {
            loggerError('[PAYPAL WEBHOOK] signature verify failed: ' + (err1.message || err1));
            return res.sendStatus(400);
        }

        // Only act on completed payment events — always re-verify via Orders GET before credit
        var interesting = (
            eventType === 'PAYMENT.CAPTURE.COMPLETED' ||
            eventType === 'CHECKOUT.ORDER.APPROVED' ||
            eventType === 'CHECKOUT.ORDER.COMPLETED'
        );

        if(!interesting) {
            return res.sendStatus(200);
        }

        var orderId = '';
        try {
            if(event.resource && event.resource.supplementary_data && event.resource.supplementary_data.related_ids) {
                orderId = event.resource.supplementary_data.related_ids.order_id || '';
            }
            if(!orderId && event.resource && event.resource.id && eventType.indexOf('CHECKOUT.ORDER') === 0) {
                orderId = event.resource.id;
            }
            if(!orderId && event.resource && event.resource.custom_id) {
                orderId = event.resource.custom_id;
            }
        } catch(e) {
            orderId = '';
        }

        if(!orderId) {
            loggerDebug('[PAYPAL WEBHOOK] no order id for ' + eventType);
            return res.sendStatus(200);
        }

        cashService.completePayPalDeposit(orderId, { source: 'webhook' }, function(err2, result) {
            if(err2) {
                loggerError('[PAYPAL WEBHOOK] complete failed for ' + orderId + ': ' + (err2.message || err2));
                // 200 so PayPal does not endless-retry clearly invalid/canceled orders
                return res.sendStatus(200);
            }

            loggerDebug('[PAYPAL WEBHOOK] verified credit for order ' + orderId + (result && result.already ? ' (already)' : ''));
            res.sendStatus(200);
        });
    });
};
