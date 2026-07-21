(function () {
    'use strict';

    if (!window.PAYPAL_CHECKOUT || !window.paypal) return;

    var cfg = window.PAYPAL_CHECKOUT;
    var messageEl = document.getElementById('paypal-checkout-message');
    var submitBtn = document.getElementById('card-field-submit-button');
    var paying = false;
    var minAmount = Number(cfg.minAmount || 10);

    var ISSUE_MESSAGES = {
        PAYER_CANNOT_PAY: 'PayPal blocked this card for this business. Use Pay with PayPal above, or try a different card.',
        INSTRUMENT_DECLINED: 'Your card was declined. Please try a different card or Pay with PayPal.',
        CARD_EXPIRED: 'This card is expired. Please use a different card.',
        INVALID_SECURITY_CODE: 'The CVV / security code looks incorrect. Please check and try again.',
        CVV_FAILURE: 'The CVV / security code looks incorrect. Please check and try again.',
        INVALID_ACCOUNT_NUMBER: 'That card number could not be used. Please check the number or try another card.',
        CARD_CLOSED: 'This card is closed and cannot be used. Please try another card.',
        CARD_TYPE_NOT_SUPPORTED: 'This card type is not supported. Please try another card.',
        TRANSACTION_REFUSED: 'PayPal refused this transaction. Please try Pay with PayPal or another card.',
        PAYMENT_DENIED: 'Payment was denied. Please try another card or Pay with PayPal.',
        PAYMENT_SOURCE_DECLINED_BY_PROCESSOR: 'Your bank declined this card. Please try another card.',
        PAYEE_NOT_ENABLED_FOR_CARD_PROCESSING: 'Card payments are not fully enabled on this PayPal business account yet. Use Pay with PayPal, or enable Advanced Card Payments in the PayPal Live app.',
        ORDER_NOT_APPROVED: 'Payment was not approved. Please try again.',
        INTERNAL_SERVER_ERROR: 'PayPal had a temporary issue. Please try again in a moment.'
    };

    function extractIssue(raw) {
        if (!raw) return '';
        var issueMatch = String(raw).match(/"issue"\s*:\s*"([A-Z0-9_]+)"/i);
        if (issueMatch) return issueMatch[1].toUpperCase();
        for (var key in ISSUE_MESSAGES) {
            if (Object.prototype.hasOwnProperty.call(ISSUE_MESSAGES, key) && String(raw).indexOf(key) !== -1) {
                return key;
            }
        }
        return '';
    }

    function friendlyError(err) {
        var raw = '';
        if (!err) return 'Payment could not be completed. Please try again.';
        if (typeof err === 'string') raw = err;
        else if (err.message) raw = String(err.message);
        else {
            try { raw = JSON.stringify(err); } catch (e) { raw = String(err); }
        }

        var issue = extractIssue(raw);
        if (issue && ISSUE_MESSAGES[issue]) return ISSUE_MESSAGES[issue];

        if (/confirm-payment-source|CARD_CONTINGENCY|3DS|CONTINGENCY/i.test(raw)) {
            return 'PayPal could not confirm this card. Try Pay with PayPal above, or another card.';
        }

        if (/422|UNPROCESSABLE_ENTITY/i.test(raw)) {
            return 'PayPal could not process this card. Try Pay with PayPal above, or another card.';
        }

        if (raw.indexOf('/v2/') !== -1 || raw.length > 180) {
            return 'Payment could not be completed. Please try Pay with PayPal or another card.';
        }

        return raw;
    }

    function setMessage(text, isError) {
        if (!messageEl) return;
        messageEl.textContent = text || '';
        messageEl.className = 'text-sm font-bold ' + (isError ? 'text-danger' : 'text-muted-foreground');
    }

    function getAmount() {
        var el = document.getElementById('cash_deposit_amount');
        return el ? String(el.value || '').trim() : '';
    }

    function validateAmount() {
        var amount = parseFloat(getAmount());
        if (!(amount > 0)) {
            return 'Enter a deposit amount first.';
        }
        if (amount < minAmount) {
            return 'Minimum deposit is ' + minAmount.toFixed(2) + '.';
        }
        return null;
    }

    function createOrder(source) {
        var amountError = validateAmount();
        if (amountError) return Promise.reject(new Error(amountError));

        setMessage('Creating secure PayPal order…');

        return fetch(cfg.createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                amount: getAmount(),
                source: source || 'card'
            })
        }).then(function (res) {
            return res.json().then(function (data) {
                if (!res.ok || !data.id) {
                    throw new Error(data.error || 'Could not create PayPal order');
                }
                return data.id;
            });
        });
    }

    function captureOrder(orderID, attempt) {
        attempt = attempt || 1;
        setMessage(attempt > 1 ? 'PayPal is still confirming… retrying (' + attempt + ')…' : 'Verifying payment with PayPal…');

        return fetch(cfg.captureUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ orderID: orderID })
        }).then(function (res) {
            return res.json().then(function (data) {
                if (!res.ok) {
                    var errMsg = data.error || 'Payment verification failed';
                    var retryable = /still processing|not completed yet|try Pay again|PAYER_ACTION_REQUIRED|ORDER_NOT_APPROVED/i.test(errMsg);
                    if (retryable && attempt < 4) {
                        return new Promise(function (resolve, reject) {
                            setTimeout(function () {
                                captureOrder(orderID, attempt + 1).then(resolve).catch(reject);
                            }, 900 * attempt);
                        });
                    }
                    throw new Error(errMsg);
                }
                if (String(data.status || '').toUpperCase() !== 'COMPLETED' || !data.verified) {
                    throw new Error('Payment was not verified by PayPal. Your balance was not credited.');
                }
                if (!(Number(data.amount) > 0)) {
                    throw new Error('Payment amount was $0.00 — nothing was charged and no balance was added.');
                }
                return data;
            });
        });
    }

    function onApprove(data) {
        return captureOrder(data.orderID).then(function (result) {
            setMessage('Payment verified with PayPal. Redirecting…');
            if (window.toastr) toastr['success']('Payment verified — balance credited');

            // Only pass order id — paid page loads amount from the server DB after verification
            window.location.href = cfg.successUrl + '?order=' + encodeURIComponent(result.order_id || data.orderID || '');
        }).catch(function (err) {
            var msg = friendlyError(err);
            setMessage(msg, true);
            if (window.toastr) toastr['error'](msg);
            paying = false;
            if (submitBtn) submitBtn.disabled = false;
        });
    }

    function onError(err) {
        console.error('[paypal]', err);
        var msg = friendlyError(err);
        setMessage(msg, true);
        if (window.toastr) toastr['error'](msg);
        paying = false;
        if (submitBtn) submitBtn.disabled = false;
    }

    var fieldStyle = {
        input: {
            'font-size': '15px',
            'font-family': 'Roboto, Ubuntu, sans-serif',
            'font-weight': '600',
            color: '#ffffff',
            'background-color': '#000000',
            background: '#000000',
            padding: '14px 10px'
        },
        body: {
            background: '#000000',
            'background-color': '#000000'
        },
        '.invalid': {
            color: '#ff8a7a'
        },
        ':focus': {
            color: '#ffffff',
            'background-color': '#000000',
            background: '#000000'
        }
    };

    function markShell(containerId, state) {
        var el = document.getElementById(containerId);
        if (!el) return;
        el.classList.remove('is-focused', 'is-invalid');
        if (state) el.classList.add(state);
    }

    function renderWalletButton(fundingSource, containerId, styleOverrides) {
        var container = document.getElementById(containerId);
        if (!container) return;
        if (paypal.isFundingEligible && !paypal.isFundingEligible(fundingSource)) {
            return;
        }

        var style = {
            layout: 'vertical',
            shape: 'rect',
            height: 45,
            color: fundingSource === paypal.FUNDING.APPLEPAY ? 'white' : 'gold',
            label: 'paypal'
        };
        if (styleOverrides) {
            for (var k in styleOverrides) {
                if (Object.prototype.hasOwnProperty.call(styleOverrides, k)) style[k] = styleOverrides[k];
            }
        }

        paypal.Buttons({
            fundingSource: fundingSource,
            style: style,
            createOrder: function () {
                return createOrder('wallet');
            },
            onApprove: onApprove,
            onError: onError,
            onCancel: function () {
                setMessage('Payment canceled. Nothing was charged.');
            }
        }).render('#' + containerId).catch(function () {
            container.innerHTML = '';
        });
    }

    if (paypal.FUNDING) {
        if (paypal.FUNDING.PAYPAL) {
            renderWalletButton(paypal.FUNDING.PAYPAL, 'paypal-button-container', {
                color: 'gold',
                label: 'paypal',
                height: 48
            });
        }
        if (paypal.FUNDING.APPLEPAY) {
            renderWalletButton(paypal.FUNDING.APPLEPAY, 'applepay-button-container', {
                color: 'white',
                label: 'pay'
            });
        }
        if (paypal.FUNDING.GOOGLEPAY) {
            renderWalletButton(paypal.FUNDING.GOOGLEPAY, 'googlepay-button-container', {
                color: 'black',
                label: 'pay'
            });
        }
    }

    if (paypal.CardFields) {
        var cardField = paypal.CardFields({
            style: fieldStyle,
            createOrder: function () {
                return createOrder('card');
            },
            onApprove: onApprove,
            onError: onError,
            onCancel: function () {
                setMessage('Payment canceled. Nothing was charged.');
                paying = false;
                if (submitBtn) submitBtn.disabled = false;
            }
        });

        if (cardField.isEligible()) {
            cardField.NameField({
                placeholder: 'Name on card',
                style: fieldStyle,
                inputEvents: {
                    onFocus: function () { markShell('card-name-field-container', 'is-focused'); },
                    onBlur: function () { markShell('card-name-field-container'); }
                }
            }).render('#card-name-field-container');

            cardField.NumberField({
                placeholder: 'Card number',
                style: fieldStyle,
                inputEvents: {
                    onFocus: function () { markShell('card-number-field-container', 'is-focused'); },
                    onBlur: function () { markShell('card-number-field-container'); }
                }
            }).render('#card-number-field-container');

            cardField.ExpiryField({
                placeholder: 'MM / YY',
                style: fieldStyle,
                inputEvents: {
                    onFocus: function () { markShell('card-expiry-field-container', 'is-focused'); },
                    onBlur: function () { markShell('card-expiry-field-container'); }
                }
            }).render('#card-expiry-field-container');

            cardField.CVVField({
                placeholder: 'CVV',
                style: fieldStyle,
                inputEvents: {
                    onFocus: function () { markShell('card-cvv-field-container', 'is-focused'); },
                    onBlur: function () { markShell('card-cvv-field-container'); }
                }
            }).render('#card-cvv-field-container');

            if (submitBtn) {
                submitBtn.addEventListener('click', function () {
                    if (paying) return;

                    var amountError = validateAmount();
                    if (amountError) {
                        setMessage(amountError, true);
                        return;
                    }

                    paying = true;
                    submitBtn.disabled = true;
                    setMessage('Processing card…');

                    cardField.submit().then(function () {
                        // onApprove handles success after charge
                    }).catch(function (err) {
                        paying = false;
                        submitBtn.disabled = false;
                        var msg = friendlyError(err);
                        setMessage(msg, true);
                        if (window.toastr) toastr['error'](msg);
                    });
                });
            }
        } else {
            setMessage('Card fields are not available for this PayPal account yet. Enable Advanced Credit and Debit Card Payments in your PayPal Live app.', true);
            var form = document.getElementById('paypal-card-form');
            if (form) form.classList.add('opacity-50');
            if (submitBtn) submitBtn.disabled = true;
        }
    }
})();
