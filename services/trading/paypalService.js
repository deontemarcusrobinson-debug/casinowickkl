var crypto = require('crypto');
var request = require('request');

var config = require('@/config/config.js');

function isConfigured(){
    return !!(config.trading.paypal.client_id && config.trading.paypal.client_secret);
}

function getApiBase(mode){
    var useMode = mode || config.trading.paypal.mode;
    return useMode === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
}

function getWebBase(mode){
    var useMode = mode || config.trading.paypal.mode;
    return useMode === 'live'
        ? 'https://www.paypal.com'
        : 'https://www.sandbox.paypal.com';
}

function getCallbackUrl(){
    var path = config.trading.paypal.callback_url || '/admin/paypal/callback';
    if(path.indexOf('http') === 0) return path;
    return config.app.url.replace(/\/$/, '') + (path.charAt(0) === '/' ? path : '/' + path);
}

function generateState(){
    return crypto.randomBytes(24).toString('hex');
}

function getAuthorizeUrl(state){
    var params = new URLSearchParams({
        client_id: config.trading.paypal.client_id,
        response_type: 'code',
        scope: 'openid profile email https://uri.paypal.com/services/paypalattributes',
        redirect_uri: getCallbackUrl(),
        state: state,
        nonce: crypto.randomBytes(16).toString('hex')
    });

    return getWebBase() + '/signin/authorize?' + params.toString();
}

function getClientToken(callback){
    if(!isConfigured()) return callback(new Error('PayPal not configured'));

    var auth = Buffer.from(config.trading.paypal.client_id + ':' + config.trading.paypal.client_secret).toString('base64');
    var mode = config.trading.paypal.mode;

    function tryMode(tryMode, next){
        request({
            method: 'POST',
            url: getApiBase(tryMode) + '/v1/oauth2/token',
            headers: {
                Authorization: 'Basic ' + auth,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                grant_type: 'client_credentials'
            }
        }, function(err1, response1, body1) {
            if(err1) return next(err1);

            var status = response1 && response1.statusCode;
            var body;

            try {
                body = typeof body1 === 'string' ? JSON.parse(body1) : body1;
            } catch(e) {
                return next(new Error('Invalid token response from PayPal'));
            }

            if(status === 200 && body.access_token) {
                return callback(null, {
                    access_token: body.access_token,
                    expires_in: body.expires_in,
                    mode: tryMode,
                    app_id: body.app_id || ''
                });
            }

            next(new Error((body && (body.error_description || body.error)) || 'PayPal auth failed'));
        });
    }

    // Never fall back to the other environment — mixing live SDK + sandbox orders
    // causes approve/capture to look like "still processing".
    tryMode(mode, function(err1) {
        callback(err1 || new Error('PayPal auth failed'));
    });
}

function exchangeCode(code, callback){
    var auth = Buffer.from(config.trading.paypal.client_id + ':' + config.trading.paypal.client_secret).toString('base64');

    request({
        method: 'POST',
        url: getApiBase() + '/v1/oauth2/token',
        headers: {
            Authorization: 'Basic ' + auth,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: getCallbackUrl()
        }
    }, function(err1, response1, body1) {
        if(err1) return callback(err1);

        var status = response1 && response1.statusCode;
        var body;

        try {
            body = typeof body1 === 'string' ? JSON.parse(body1) : body1;
        } catch(e) {
            return callback(new Error('Invalid token response from PayPal'));
        }

        if(status !== 200 || !body.access_token) {
            return callback(new Error((body && (body.error_description || body.error)) || 'PayPal token exchange failed'));
        }

        callback(null, body);
    });
}

function getUserInfo(accessToken, callback){
    request({
        method: 'GET',
        url: getApiBase() + '/v1/identity/oauth2/userinfo?schema=paypalv1.1',
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        }
    }, function(err1, response1, body1) {
        if(err1) return callback(err1);

        var status = response1 && response1.statusCode;
        var body;

        try {
            body = typeof body1 === 'string' ? JSON.parse(body1) : body1;
        } catch(e) {
            return callback(new Error('Invalid userinfo response from PayPal'));
        }

        if(status !== 200) {
            return callback(new Error((body && (body.error_description || body.error)) || 'PayPal userinfo failed'));
        }

        callback(null, body);
    });
}

function getCurrency(){
    return String(config.trading.cash.stripe.currency || 'usd').toUpperCase();
}

function friendlyPayPalError(body, fallback){
    var issue = '';
    var description = '';

    if(body && body.details && body.details[0]) {
        issue = String(body.details[0].issue || '').toUpperCase();
        description = body.details[0].description || '';
    }

    var messages = {
        PAYER_CANNOT_PAY: 'PayPal blocked this card for this business. Use Pay with PayPal, or try a different card.',
        INSTRUMENT_DECLINED: 'Your card was declined. Please try a different card.',
        CARD_EXPIRED: 'This card is expired. Please use a different card.',
        INVALID_SECURITY_CODE: 'The CVV / security code looks incorrect. Please check and try again.',
        CVV_FAILURE: 'The CVV / security code looks incorrect. Please check and try again.',
        INVALID_ACCOUNT_NUMBER: 'That card number could not be used. Please check the number or try another card.',
        CARD_CLOSED: 'This card is closed and cannot be used. Please try another card.',
        CARD_TYPE_NOT_SUPPORTED: 'This card type is not supported. Please try another card.',
        TRANSACTION_REFUSED: 'PayPal refused this transaction. Please try another payment method.',
        TRANSACTION_BLOCKED_BY_PAYEE: 'This payment was blocked. Please try another card.',
        COMPLIANCE_VIOLATION: 'This payment could not be processed for compliance reasons.',
        MAX_NUMBER_OF_PAYMENT_ATTEMPTS_EXCEEDED: 'Too many payment attempts. Wait a moment and try again.',
        ORDER_NOT_APPROVED: 'Payment was not approved. Please try again.',
        ORDER_ALREADY_CAPTURED: 'This payment was already completed.',
        DUPLICATE_INVOICE_ID: 'This payment looks like a duplicate. Refresh and try again.',
        PAYMENT_DENIED: 'Payment was denied. Please try another card.',
        PAYMENT_SOURCE_INFO_CANNOT_BE_VERIFIED: 'We could not verify this card. Please try another card.',
        PAYMENT_SOURCE_DECLINED_BY_PROCESSOR: 'Your bank declined this card. Please try another card.',
        PAYEE_NOT_ENABLED_FOR_CARD_PROCESSING: 'Card payments are not fully enabled on this PayPal account yet. Use Pay with PayPal, or enable Advanced Card Payments in your Live app.',
        MERCHANT_ACCOUNT_RESTRICTED: 'Your PayPal business account is restricted. Log in to paypal.com, open the Account Limitations / Resolution Center, finish any required verification, then try again.',
        PERMISSION_DENIED: 'PayPal denied permission for this payment. Please try again later.',
        INTERNAL_SERVER_ERROR: 'PayPal had a temporary issue. Please try again in a moment.'
    };

    if(issue && messages[issue]) return messages[issue];

    // PayPal sometimes returns the restriction only as a top-level message
    var topMessage = (body && (body.message || body.error_description || body.error)) || '';
    if(/merchant account is restricted/i.test(topMessage) || /account is restricted/i.test(description)) {
        return messages.MERCHANT_ACCOUNT_RESTRICTED;
    }

    if(description && description.indexOf('/v2/') === -1 && description.length < 160) {
        return description;
    }

    if(topMessage && topMessage.indexOf('/v2/') === -1 && String(topMessage).length < 160) {
        return String(topMessage);
    }

    return fallback || 'Payment could not be completed. Please try another card or payment method.';
}

function createOrder(amount, returnUrl, cancelUrl, options, callback){
    if(typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = options || {};

    getClientToken(function(err1, token) {
        if(err1) return callback(err1);

        var value = Number(amount).toFixed(2);
        var currency = getCurrency();

        var payload = {
            intent: 'CAPTURE',
            purchase_units: [{
                description: (config.app.name || 'GoldWitch') + ' deposit',
                amount: {
                    currency_code: currency,
                    value: value
                }
            }],
            application_context: {
                brand_name: config.app.abbreviation || config.app.name || 'GoldWitch',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                shipping_preference: 'NO_SHIPPING',
                return_url: returnUrl,
                cancel_url: cancelUrl
            }
        };

        // Do not attach payment_source.card here — Card Fields / wallet buttons
        // supply the payment source on approve. Pre-attaching an empty card
        // object can leave Live orders stuck in APPROVED with no capture.

        request({
            method: 'POST',
            url: getApiBase(token.mode) + '/v2/checkout/orders',
            headers: {
                Authorization: 'Bearer ' + token.access_token,
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            },
            body: JSON.stringify(payload)
        }, function(err2, response2, body2) {
            if(err2) return callback(err2);

            var status = response2 && response2.statusCode;
            var body;

            try {
                body = typeof body2 === 'string' ? JSON.parse(body2) : body2;
            } catch(e) {
                return callback(new Error('Invalid order response from PayPal'));
            }

            if((status !== 200 && status !== 201) || !body.id) {
                return callback(new Error(friendlyPayPalError(body, 'PayPal could not create this payment. Please try again.')));
            }

            var approve = null;
            if(body.links) {
                for(var i = 0; i < body.links.length; i++) {
                    if(body.links[i].rel === 'approve') {
                        approve = body.links[i].href;
                        break;
                    }
                }
            }

            callback(null, {
                id: body.id,
                status: body.status,
                approve_url: approve,
                currency: currency.toLowerCase(),
                mode: token.mode
            });
        });
    });
}

function getPublicConfig(){
    return {
        client_id: config.trading.paypal.client_id || '',
        mode: config.trading.paypal.mode,
        currency: getCurrency(),
        configured: isConfigured()
    };
}

function captureOrder(orderId, callback){
    getClientToken(function(err1, token) {
        if(err1) return callback(err1);

        request({
            method: 'POST',
            url: getApiBase(token.mode) + '/v2/checkout/orders/' + encodeURIComponent(orderId) + '/capture',
            headers: {
                Authorization: 'Bearer ' + token.access_token,
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            },
            body: '{}'
        }, function(err2, response2, body2) {
            if(err2) return callback(err2);

            var status = response2 && response2.statusCode;
            var body;

            try {
                body = typeof body2 === 'string' ? JSON.parse(body2) : body2;
            } catch(e) {
                return callback(new Error('Invalid capture response from PayPal'));
            }

            var issue = body && body.details && body.details[0] && String(body.details[0].issue || '').toUpperCase();
            var orderStatus = body && body.status ? String(body.status).toUpperCase() : '';

            if(status === 422 && (issue === 'ORDER_ALREADY_CAPTURED' || issue === 'ORDER_ALREADY_COMPLETED')) {
                return callback(null, { already_captured: true, id: orderId, mode: token.mode, token: token, raw: body });
            }

            // Card / 3DS may leave the order APPROVED briefly — treat as retryable, not a hard fail
            if(status === 422 && (issue === 'ORDER_NOT_APPROVED' || issue === 'PAYER_ACTION_REQUIRED')) {
                var pendingErr = new Error(friendlyPayPalError(body, 'Payment is still processing with PayPal. Please wait a second and try Pay again.'));
                pendingErr.retryable = true;
                pendingErr.paypal_issue = issue;
                return callback(pendingErr, { pending: true, id: orderId, mode: token.mode, token: token, raw: body });
            }

            if(status !== 200 && status !== 201) {
                var hardErr = new Error(friendlyPayPalError(body, 'Payment was not charged. Please try another card.'));
                hardErr.retryable = false;
                hardErr.paypal_issue = issue || '';
                hardErr.paypal_status = status;
                return callback(hardErr);
            }

            callback(null, { captured: true, id: orderId, mode: token.mode, token: token, raw: body, order_status: orderStatus });
        });
    });
}

function getOrder(orderId, accessTokenOrCallback, maybeCallback){
    var callback = maybeCallback;
    var tokenInfo = null;

    if(typeof accessTokenOrCallback === 'function') {
        callback = accessTokenOrCallback;
    } else if(accessTokenOrCallback && typeof accessTokenOrCallback === 'object') {
        tokenInfo = accessTokenOrCallback;
    }

    function doGet(token){
        request({
            method: 'GET',
            url: getApiBase(token.mode) + '/v2/checkout/orders/' + encodeURIComponent(orderId),
            headers: {
                Authorization: 'Bearer ' + token.access_token,
                'Content-Type': 'application/json'
            }
        }, function(err2, response2, body2) {
            if(err2) return callback(err2);

            var status = response2 && response2.statusCode;
            var body;

            try {
                body = typeof body2 === 'string' ? JSON.parse(body2) : body2;
            } catch(e) {
                return callback(new Error('Invalid order response from PayPal'));
            }

            if(status !== 200 || !body || !body.id) {
                return callback(new Error(friendlyPayPalError(body, 'Could not verify payment with PayPal.')));
            }

            callback(null, body);
        });
    }

    if(tokenInfo && tokenInfo.access_token) return doGet(tokenInfo);

    getClientToken(function(err1, token) {
        if(err1) return callback(err1);
        doGet(token);
    });
}

function extractVerifiedCapture(orderBody, expectedAmount){
    if(!orderBody || !orderBody.id) {
        return { ok: false, error: 'Invalid PayPal order.', retryable: false };
    }

    var orderStatus = String(orderBody.status || '').toUpperCase();
    var capture = null;

    try {
        var captures = (orderBody.purchase_units && orderBody.purchase_units[0] && orderBody.purchase_units[0].payments && orderBody.purchase_units[0].payments.captures) || [];
        for(var i = 0; i < captures.length; i++) {
            if(String(captures[i].status || '').toUpperCase() === 'COMPLETED') {
                capture = captures[i];
                break;
            }
        }
        if(!capture && captures.length) capture = captures[0];
    } catch(e) {
        capture = null;
    }

    // Prefer a completed capture even if order status is still catching up
    if(capture && String(capture.status || '').toUpperCase() === 'COMPLETED') {
        var paidFast = parseFloat(capture.amount && capture.amount.value);
        if(paidFast > 0) {
            if(expectedAmount !== undefined && expectedAmount !== null) {
                var expectedFast = parseFloat(expectedAmount);
                if(Math.abs(paidFast - expectedFast) > 0.01) {
                    return { ok: false, error: 'Paid amount did not match your deposit. Balance was not credited.', retryable: false };
                }
            }
            return {
                ok: true,
                order_id: orderBody.id,
                capture_id: capture.id || '',
                capture_status: 'COMPLETED',
                paid: paidFast,
                currency: String((capture.amount && capture.amount.currency_code) || getCurrency()).toLowerCase()
            };
        }
    }

    if(orderStatus !== 'COMPLETED') {
        var retryable = (orderStatus === 'APPROVED' || orderStatus === 'CREATED' || orderStatus === 'SAVED' || orderStatus === 'PAYER_ACTION_REQUIRED');
        return {
            ok: false,
            error: retryable
                ? 'Payment is still processing with PayPal. Please wait a second and try Pay again.'
                : 'PayPal could not finish this payment. Please try another card.',
            retryable: retryable,
            order_status: orderStatus
        };
    }

    if(!capture) {
        return { ok: false, error: 'PayPal did not return a completed charge yet. Please try Pay again.', retryable: true };
    }

    if(String(capture.status || '').toUpperCase() !== 'COMPLETED') {
        return { ok: false, error: 'PayPal charge is not completed yet. Please try Pay again in a moment.', retryable: true };
    }

    var paid = parseFloat(capture.amount && capture.amount.value);
    if(!(paid > 0)) {
        return { ok: false, error: 'Payment amount was $0.00 — nothing was charged and no balance was added.', retryable: false };
    }

    if(expectedAmount !== undefined && expectedAmount !== null) {
        var expected = parseFloat(expectedAmount);
        if(Math.abs(paid - expected) > 0.01) {
            return { ok: false, error: 'Paid amount did not match your deposit. Balance was not credited.', retryable: false };
        }
    }

    return {
        ok: true,
        order_id: orderBody.id,
        capture_id: capture.id || '',
        capture_status: String(capture.status).toUpperCase(),
        paid: paid,
        currency: String((capture.amount && capture.amount.currency_code) || getCurrency()).toLowerCase()
    };
}

function captureAndVerifyOrder(orderId, expectedAmount, callback){
    captureOrder(orderId, function(err1, captureResult) {
        // Fast path: use capture API response immediately when it already shows COMPLETED
        if(captureResult && captureResult.raw) {
            var fast = extractVerifiedCapture(captureResult.raw, expectedAmount);
            if(fast.ok) return callback(null, fast);
        }

        // Hard capture failure (declined, restricted, etc.) — do not mask as "still processing"
        if(err1 && !err1.retryable && !(captureResult && captureResult.already_captured)) {
            return getOrder(orderId, captureResult && captureResult.token, function(errGet, orderBody) {
                if(!errGet) {
                    var already = extractVerifiedCapture(orderBody, expectedAmount);
                    if(already.ok) return callback(null, already);
                }
                return callback(err1);
            });
        }

        var tokenInfo = captureResult && captureResult.token ? captureResult.token : null;
        var attempts = 0;
        var maxAttempts = 8;

        function finishPending(verified, lastCaptureErr){
            var msg = (verified && verified.error)
                || (lastCaptureErr && lastCaptureErr.message)
                || 'Payment is still processing with PayPal. Please wait a second and try Pay again.';
            var err = new Error(msg);
            err.retryable = true;
            if(verified && verified.order_status) err.order_status = verified.order_status;
            callback(err);
        }

        function poll(){
            attempts++;
            getOrder(orderId, tokenInfo, function(err2, orderBody) {
                if(err2) {
                    if(err1 && err1.retryable) return finishPending(null, err1);
                    if(err1) return callback(err1);
                    return callback(err2);
                }

                var verified = extractVerifiedCapture(orderBody, expectedAmount);
                if(verified.ok) return callback(null, verified);

                if(verified.retryable && attempts < maxAttempts) {
                    return setTimeout(poll, attempts < 4 ? 400 : 700);
                }

                if(verified.retryable) {
                    return captureOrder(orderId, function(err3, secondCapture) {
                        if(secondCapture && secondCapture.raw) {
                            var again = extractVerifiedCapture(secondCapture.raw, expectedAmount);
                            if(again.ok) return callback(null, again);
                        }

                        // Second capture hard-failed — show that, not a generic pending message
                        if(err3 && !err3.retryable) return callback(err3);

                        getOrder(orderId, secondCapture && secondCapture.token ? secondCapture.token : tokenInfo, function(err4, finalBody) {
                            if(err4) {
                                if(err3 && !err3.retryable) return callback(err3);
                                if(err1 && !err1.retryable) return callback(err1);
                                return finishPending(null, err3 || err1 || err4);
                            }

                            var finalVerified = extractVerifiedCapture(finalBody, expectedAmount);
                            if(finalVerified.ok) return callback(null, finalVerified);

                            if(!finalVerified.retryable) {
                                var fail = new Error(finalVerified.error);
                                fail.retryable = false;
                                return callback(fail);
                            }

                            finishPending(finalVerified, err3 || err1);
                        });
                    });
                }

                var hardFail = new Error(verified.error);
                hardFail.retryable = false;
                callback(hardFail);
            });
        }

        poll();
    });
}

function verifyWebhookSignature(headers, body, callback){
    var webhookId = process.env.PAYPAL_WEBHOOK_ID || '';
    if(!webhookId) {
        // Without a registered webhook id, still allow processing only after Orders GET verify
        return callback(null, true);
    }

    getClientToken(function(err1, token) {
        if(err1) return callback(err1);

        request({
            method: 'POST',
            url: getApiBase(token.mode) + '/v1/notifications/verify-webhook-signature',
            headers: {
                Authorization: 'Bearer ' + token.access_token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                auth_algo: headers['paypal-auth-algo'],
                cert_url: headers['paypal-cert-url'],
                transmission_id: headers['paypal-transmission-id'],
                transmission_sig: headers['paypal-transmission-sig'],
                transmission_time: headers['paypal-transmission-time'],
                webhook_id: webhookId,
                webhook_event: body
            })
        }, function(err2, response2, body2) {
            if(err2) return callback(err2);

            var parsed;
            try {
                parsed = typeof body2 === 'string' ? JSON.parse(body2) : body2;
            } catch(e) {
                return callback(new Error('Invalid webhook verification response'));
            }

            if(!parsed || String(parsed.verification_status).toUpperCase() !== 'SUCCESS') {
                return callback(new Error('PayPal webhook signature verification failed'));
            }

            callback(null, true);
        });
    });
}

module.exports = {
    isConfigured,
    getAuthorizeUrl,
    generateState,
    getClientToken,
    exchangeCode,
    getUserInfo,
    createOrder,
    captureOrder,
    getOrder,
    extractVerifiedCapture,
    captureAndVerifyOrder,
    verifyWebhookSignature,
    getCurrency,
    getPublicConfig,
    friendlyPayPalError,
    getCallbackUrl,
    getApiBase,
    getWebBase
};
