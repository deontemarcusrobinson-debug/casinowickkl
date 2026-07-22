/**
 * Verify crypto deposits against public blockchain explorers.
 * Returns { ok, cryptoAmount, confirmations, fromAddress, toAddress, raw } or { ok:false, error }.
 */
var request = require('request');
var config = require('@/config/config.js');

var USDT_ERC20 = '0xdac17f958d2ee523a2206206994597c13d831ec7';
var USDC_ERC20 = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
var USDT_BSC = '0x55d398326f99059ff775485246999027b3197955';

function httpGetJson(url, headers, callback) {
    request({
        url: url,
        method: 'GET',
        json: true,
        timeout: 20000,
        headers: Object.assign({
            'Accept': 'application/json',
            'User-Agent': 'GoldWitch-DepositVerify/1.0'
        }, headers || {})
    }, function(err, res, body) {
        if(err) return callback(err);
        if(!res || res.statusCode < 200 || res.statusCode >= 300) {
            return callback(new Error('Explorer HTTP ' + (res && res.statusCode)));
        }
        callback(null, body);
    });
}

function normalizeHash(currency, txHash) {
    var h = String(txHash || '').trim();
    if(!h) return '';
    if(currency === 'btc' || currency === 'ltc' || currency === 'bch' || currency === 'doge') {
        return h.toLowerCase();
    }
    if(currency === 'usdttrc20' || currency === 'trx' || currency === 'ton' || currency === 'sol' || currency === 'usdtsol' || currency === 'xrp') {
        return h;
    }
    // EVM hashes
    if(h.indexOf('0x') !== 0) h = '0x' + h;
    return h.toLowerCase();
}

function addrEq(a, b) {
    if(!a || !b) return false;
    var left = String(a).trim().replace(/^bitcoincash:/i, '').toLowerCase();
    var right = String(b).trim().replace(/^bitcoincash:/i, '').toLowerCase();
    return left === right;
}

function getWallet(currency) {
    var wallets = (config.trading.crypto.hash_deposits && config.trading.crypto.hash_deposits.wallets) || {};
    return String(wallets[currency] || '').trim();
}

function minConfirmations() {
    return (config.trading.crypto.hash_deposits && config.trading.crypto.hash_deposits.min_confirmations) || 1;
}

function verifyBtcLike(explorerBase, txHash, wallet, callback) {
    httpGetJson(explorerBase + '/tx/' + encodeURIComponent(txHash), null, function(err, tx) {
        if(err) return callback(null, { ok: false, error: 'Could not fetch transaction: ' + err.message });
        if(!tx || tx.txid == null && !tx.hash) return callback(null, { ok: false, error: 'Transaction not found' });

        var outs = tx.vout || tx.outputs || [];
        var received = 0;
        var matched = false;

        outs.forEach(function(o) {
            var addr = '';
            if(o.scriptpubkey_address) addr = o.scriptpubkey_address;
            else if(o.addresses && o.addresses[0]) addr = o.addresses[0];
            else if(o.addr) addr = o.addr;

            var val = 0;
            if(o.value != null) {
                // blockstream uses sats; blockcypher uses BTC float sometimes
                val = Number(o.value);
                if(val > 1000) val = val / 1e8; // sats → BTC
            }

            if(addrEq(addr, wallet)) {
                matched = true;
                received += val;
            }
        });

        if(!matched) return callback(null, { ok: false, error: 'No payment to deposit address found in this transaction' });

        var conf = 0;
        if(typeof tx.confirmations === 'number') conf = tx.confirmations;
        else if(tx.status && tx.status.confirmed) conf = 1;
        else if(tx.block_height) conf = 1;

        if(conf < minConfirmations()) {
            return callback(null, { ok: false, error: 'Not enough confirmations (' + conf + '/' + minConfirmations() + ')' });
        }

        var from = '';
        var vins = tx.vin || tx.inputs || [];
        if(vins[0]) {
            from = vins[0].prevout && vins[0].prevout.scriptpubkey_address
                ? vins[0].prevout.scriptpubkey_address
                : (vins[0].addresses && vins[0].addresses[0]) || '';
        }

        callback(null, {
            ok: true,
            cryptoAmount: received,
            confirmations: conf,
            fromAddress: from,
            toAddress: wallet,
            raw: { explorer: explorerBase }
        });
    });
}

function verifyEthNative(txHash, wallet, apiKey, callback) {
    var key = apiKey ? '&apikey=' + encodeURIComponent(apiKey) : '';
    var base = 'https://api.etherscan.io/api';

    httpGetJson(base + '?module=proxy&action=eth_getTransactionByHash&txhash=' + encodeURIComponent(txHash) + key, null, function(err, body) {
        if(err) return callback(null, { ok: false, error: 'Could not fetch ETH transaction' });
        var tx = body && body.result;
        if(!tx || !tx.hash) return callback(null, { ok: false, error: 'Transaction not found' });
        if(!addrEq(tx.to, wallet)) return callback(null, { ok: false, error: 'Transaction was not sent to the deposit address' });

        var wei = parseInt(tx.value, 16);
        if(!(wei > 0)) return callback(null, { ok: false, error: 'Transaction value is zero (token transfers need USDT/USDC method)' });

        httpGetJson(base + '?module=proxy&action=eth_getTransactionReceipt&txhash=' + encodeURIComponent(txHash) + key, null, function(err2, body2) {
            if(err2) return callback(null, { ok: false, error: 'Could not fetch ETH receipt' });
            var receipt = body2 && body2.result;
            if(!receipt || parseInt(receipt.status, 16) !== 1) {
                return callback(null, { ok: false, error: 'Transaction failed or not confirmed' });
            }

            callback(null, {
                ok: true,
                cryptoAmount: wei / 1e18,
                confirmations: receipt.blockNumber ? 1 : 0,
                fromAddress: tx.from || '',
                toAddress: wallet,
                raw: { chain: 'eth' }
            });
        });
    });
}

function verifyErc20(txHash, wallet, tokenContract, decimals, apiKey, chain, callback) {
    var key = apiKey ? '&apikey=' + encodeURIComponent(apiKey) : '';
    var base = chain === 'bsc' ? 'https://api.bscscan.com/api' : 'https://api.etherscan.io/api';

    httpGetJson(base + '?module=proxy&action=eth_getTransactionReceipt&txhash=' + encodeURIComponent(txHash) + key, null, function(err, body) {
        if(err) return callback(null, { ok: false, error: 'Could not fetch token receipt' });
        var receipt = body && body.result;
        if(!receipt || !receipt.logs) return callback(null, { ok: false, error: 'Transaction not found' });
        if(parseInt(receipt.status, 16) !== 1) return callback(null, { ok: false, error: 'Transaction failed' });

        // Transfer(address,address,uint256) topic
        var transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        var received = 0;
        var from = '';
        var matched = false;

        (receipt.logs || []).forEach(function(log) {
            if(!addrEq(log.address, tokenContract)) return;
            if(!log.topics || log.topics[0] !== transferTopic) return;
            var toTopic = log.topics[2] || '';
            var toAddr = '0x' + toTopic.slice(-40);
            if(!addrEq(toAddr, wallet)) return;
            matched = true;
            from = '0x' + String(log.topics[1] || '').slice(-40);
            try {
                received += parseInt(log.data, 16) / Math.pow(10, decimals);
            } catch (e) {}
        });

        if(!matched || !(received > 0)) {
            return callback(null, { ok: false, error: 'No token transfer to deposit address found' });
        }

        callback(null, {
            ok: true,
            cryptoAmount: received,
            confirmations: 1,
            fromAddress: from,
            toAddress: wallet,
            raw: { chain: chain, token: tokenContract }
        });
    });
}

function verifyUsdtTrc20(txHash, wallet, callback) {
    httpGetJson('https://apilist.tronscanapi.com/api/transaction-info?hash=' + encodeURIComponent(txHash), null, function(err, body) {
        if(err) return callback(null, { ok: false, error: 'Could not fetch TRON transaction' });
        if(!body || !body.hash) return callback(null, { ok: false, error: 'Transaction not found' });
        if(body.confirmed === false && !(body.confirmations > 0)) {
            return callback(null, { ok: false, error: 'Transaction not confirmed yet' });
        }

        var transfers = body.trc20TransferInfo || body.tokenTransferInfo || [];
        if(!Array.isArray(transfers)) transfers = transfers ? [transfers] : [];

        var received = 0;
        var from = '';
        var matched = false;

        transfers.forEach(function(t) {
            var symbol = String(t.symbol || t.tokenName || '').toUpperCase();
            var to = t.to_address || t.toAddress || t.to || '';
            if(!addrEq(to, wallet)) return;
            if(symbol && symbol.indexOf('USDT') === -1 && String(t.contract_address || '').indexOf('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t') === -1) return;
            matched = true;
            from = t.from_address || t.fromAddress || t.from || '';
            var dec = parseInt(t.decimals != null ? t.decimals : 6, 10) || 6;
            var amt = Number(t.amount_str != null ? t.amount_str : t.amount);
            if(amt > 1e6) amt = amt / Math.pow(10, dec);
            received += amt;
        });

        // Fallback: contract data amount
        if(!matched && body.contractData && addrEq(body.contractData.to_address || body.toAddress, wallet)) {
            matched = true;
            received = Number(body.contractData.amount || 0);
            if(received > 1e6) received = received / 1e6;
            from = body.ownerAddress || '';
        }

        if(!matched || !(received > 0)) {
            return callback(null, { ok: false, error: 'No USDT-TRC20 transfer to deposit address found' });
        }

        callback(null, {
            ok: true,
            cryptoAmount: received,
            confirmations: body.confirmations || 1,
            fromAddress: from,
            toAddress: wallet,
            raw: { chain: 'tron' }
        });
    });
}

function verifyTon(txHash, wallet, callback) {
    httpGetJson('https://tonapi.io/v2/blockchain/transactions/' + encodeURIComponent(txHash), null, function(err, body) {
        if(err) return callback(null, { ok: false, error: 'Could not fetch TON transaction' });
        if(!body || !body.hash) return callback(null, { ok: false, error: 'Transaction not found' });

        var received = 0;
        var from = '';
        var matched = false;

        function checkMsg(msg) {
            if(!msg) return;
            var dest = (msg.destination && (msg.destination.address || msg.destination)) || msg.dst || '';
            if(String(dest).indexOf(wallet) === -1 && !addrEq(dest, wallet) && String(wallet).indexOf(String(dest)) === -1) {
                if(String(dest) !== String(wallet)) return;
            }
            var val = Number(msg.value || 0);
            if(val > 0) {
                matched = true;
                received += val / 1e9;
                from = (msg.source && (msg.source.address || msg.source)) || '';
            }
        }

        if(body.in_msg) checkMsg(body.in_msg);
        (body.out_msgs || []).forEach(checkMsg);

        if(!matched || !(received > 0)) {
            return callback(null, {
                ok: true,
                cryptoAmount: received > 0 ? received : 0,
                confirmations: body.success === false ? 0 : 1,
                fromAddress: from,
                toAddress: wallet,
                needsAdminAmount: !(received > 0),
                raw: { chain: 'ton', note: 'TON amount may need admin review' }
            });
        }

        callback(null, {
            ok: true,
            cryptoAmount: received,
            confirmations: 1,
            fromAddress: from,
            toAddress: wallet,
            raw: { chain: 'ton' }
        });
    });
}

function verifySol(txHash, wallet, callback) {
    request({
        url: 'https://api.mainnet-beta.solana.com',
        method: 'POST',
        json: true,
        timeout: 20000,
        body: {
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [txHash, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]
        }
    }, function(err, res, body) {
        if(err || !body) return callback(null, { ok: false, error: 'Could not fetch Solana transaction' });
        var tx = body.result;
        if(!tx) return callback(null, { ok: false, error: 'Transaction not found on Solana' });
        if(tx.meta && tx.meta.err) return callback(null, { ok: false, error: 'Solana transaction failed' });

        var received = 0;
        var from = '';
        var matched = false;
        var keys = (((tx.transaction || {}).message || {}).accountKeys) || [];
        var pre = (tx.meta && tx.meta.preBalances) || [];
        var post = (tx.meta && tx.meta.postBalances) || [];

        keys.forEach(function(k, i) {
            var addr = typeof k === 'string' ? k : (k.pubkey || '');
            if(!addrEq(addr, wallet)) return;
            var delta = (Number(post[i] || 0) - Number(pre[i] || 0)) / 1e9;
            if(delta > 0) {
                matched = true;
                received += delta;
            }
        });

        // SPL token transfers (USDT on Sol)
        var instructions = ((((tx.transaction || {}).message || {}).instructions) || []);
        instructions.forEach(function(ix) {
            var parsed = ix.parsed;
            if(!parsed || parsed.type !== 'transfer') return;
            var info = parsed.info || {};
            if(addrEq(info.destination, wallet) || addrEq(info.dest, wallet)) {
                matched = true;
                var amt = Number(info.lamports != null ? info.lamports : info.amount || 0);
                if(info.lamports != null) received += amt / 1e9;
                else received += amt; // token amount already decimalized in some parsers
                from = info.source || from;
            }
        });

        if(!matched || !(received > 0)) {
            return callback(null, { ok: false, error: 'No payment to Solana deposit address found' });
        }

        callback(null, {
            ok: true,
            cryptoAmount: received,
            confirmations: tx.slot ? 1 : 0,
            fromAddress: from,
            toAddress: wallet,
            raw: { chain: 'sol' }
        });
    });
}

function verifyXrp(txHash, wallet, callback) {
    httpGetJson('https://api.xrpscan.com/api/v1/tx/' + encodeURIComponent(txHash), null, function(err, body) {
        if(err) {
            // Fallback: xrpl.org data API style via rippled public
            return httpGetJson('https://xrplcluster.com/', null, function() {
                request({
                    url: 'https://s1.ripple.com:51234/',
                    method: 'POST',
                    json: true,
                    timeout: 20000,
                    body: { method: 'tx', params: [{ transaction: txHash, binary: false }] }
                }, function(err2, res2, body2) {
                    if(err2 || !body2 || !body2.result) {
                        return callback(null, { ok: false, error: 'Could not fetch XRP transaction' });
                    }
                    var tx = body2.result;
                    if(tx.status === 'error' || !tx.hash) return callback(null, { ok: false, error: 'Transaction not found' });
                    if(!addrEq(tx.Destination, wallet)) {
                        return callback(null, { ok: false, error: 'Transaction was not sent to the deposit address' });
                    }
                    var drops = Number(tx.Amount);
                    if(isNaN(drops) && tx.Amount && tx.Amount.value) drops = Number(tx.Amount.value);
                    var amount = drops > 1000 ? drops / 1e6 : drops;
                    callback(null, {
                        ok: true,
                        cryptoAmount: amount,
                        confirmations: tx.validated ? 1 : 0,
                        fromAddress: tx.Account || '',
                        toAddress: wallet,
                        raw: { chain: 'xrp' }
                    });
                });
            });
        }

        if(!body || (!body.hash && !body.txid)) return callback(null, { ok: false, error: 'Transaction not found' });
        var dest = body.Destination || body.destination || '';
        if(!addrEq(dest, wallet)) return callback(null, { ok: false, error: 'Transaction was not sent to the deposit address' });
        var amount = Number(body.Amount != null ? body.Amount : body.amount);
        if(amount > 1000) amount = amount / 1e6;
        callback(null, {
            ok: true,
            cryptoAmount: amount,
            confirmations: 1,
            fromAddress: body.Account || body.account || '',
            toAddress: wallet,
            raw: { chain: 'xrp' }
        });
    });
}

function verifyTrxNative(txHash, wallet, callback) {
    httpGetJson('https://apilist.tronscanapi.com/api/transaction-info?hash=' + encodeURIComponent(txHash), null, function(err, body) {
        if(err) return callback(null, { ok: false, error: 'Could not fetch TRON transaction' });
        if(!body || !body.hash) return callback(null, { ok: false, error: 'Transaction not found' });

        var to = body.toAddress || (body.contractData && body.contractData.to_address) || '';
        if(!addrEq(to, wallet)) {
            return callback(null, { ok: false, error: 'Transaction was not sent to the deposit address' });
        }

        var sun = Number((body.contractData && body.contractData.amount) || body.amount || 0);
        var trx = sun > 1000 ? sun / 1e6 : sun;
        if(!(trx > 0)) return callback(null, { ok: false, error: 'Transaction amount is zero' });

        callback(null, {
            ok: true,
            cryptoAmount: trx,
            confirmations: body.confirmed === false ? 0 : (body.confirmations || 1),
            fromAddress: body.ownerAddress || '',
            toAddress: wallet,
            raw: { chain: 'trx' }
        });
    });
}

/**
 * Verify a deposit transaction for a supported currency.
 */
function verifyDeposit(currency, txHash, callback) {
    currency = String(currency || '').toLowerCase();
    var hash = normalizeHash(currency, txHash);
    if(!hash || hash.length < 16) {
        return callback(null, { ok: false, error: 'Invalid transaction hash' });
    }

    var wallet = getWallet(currency);
    if(!wallet) {
        return callback(null, { ok: false, error: 'Deposit wallet is not configured for ' + currency.toUpperCase() });
    }

    var ethKey = (config.trading.crypto.hash_deposits && config.trading.crypto.hash_deposits.etherscan_api_key) || '';
    var bscKey = (config.trading.crypto.hash_deposits && config.trading.crypto.hash_deposits.bscscan_api_key) || '';

    if(currency === 'btc') return verifyBtcLike('https://blockstream.info/api', hash, wallet, callback);
    if(currency === 'ltc') return verifyBtcLike('https://api.blockcypher.com/v1/ltc/main', hash, wallet, function(err, result) {
        if(result && result.ok && result.cryptoAmount > 1000) result.cryptoAmount = result.cryptoAmount / 1e8;
        callback(err, result);
    });
    if(currency === 'doge') return verifyBtcLike('https://api.blockcypher.com/v1/doge/main', hash, wallet, function(err, result) {
        if(result && result.ok && result.cryptoAmount > 1000) result.cryptoAmount = result.cryptoAmount / 1e8;
        callback(err, result);
    });
    if(currency === 'bch') {
        return httpGetJson('https://api.blockchair.com/bitcoin-cash/dashboards/transaction/' + encodeURIComponent(hash), null, function(err2, body) {
            if(err2) return callback(null, { ok: false, error: 'Could not fetch BCH transaction' });
            var data = body && body.data && body.data[hash];
            if(!data || !data.outputs) return callback(null, { ok: false, error: 'Transaction not found' });
            var received = 0;
            var matched = false;
            data.outputs.forEach(function(o) {
                if(addrEq(o.recipient, wallet)) {
                    matched = true;
                    received += Number(o.value) / 1e8;
                }
            });
            if(!matched) return callback(null, { ok: false, error: 'No payment to deposit address found' });
            callback(null, {
                ok: true,
                cryptoAmount: received,
                confirmations: (data.transaction && data.transaction.block_id > 0) ? 1 : 0,
                fromAddress: (data.inputs && data.inputs[0] && data.inputs[0].recipient) || '',
                toAddress: wallet,
                raw: { chain: 'bch' }
            });
        });
    }

    if(currency === 'eth') return verifyEthNative(hash, wallet, ethKey, callback);
    if(currency === 'usdterc20') return verifyErc20(hash, wallet, USDT_ERC20, 6, ethKey, 'eth', callback);
    if(currency === 'usdc') return verifyErc20(hash, wallet, USDC_ERC20, 6, ethKey, 'eth', callback);
    if(currency === 'usdtbsc') return verifyErc20(hash, wallet, USDT_BSC, 18, bscKey, 'bsc', callback);
    if(currency === 'usdttrc20') return verifyUsdtTrc20(hash, wallet, callback);
    if(currency === 'trx') return verifyTrxNative(hash, wallet, callback);
    if(currency === 'sol' || currency === 'usdtsol') return verifySol(hash, wallet, callback);
    if(currency === 'xrp') return verifyXrp(hash, wallet, callback);
    if(currency === 'ton') return verifyTon(hash, wallet, callback);

    return callback(null, { ok: false, error: 'Unsupported currency for hash verification: ' + currency });
}

function getConfiguredCurrencies() {
    var wallets = (config.trading.crypto.hash_deposits && config.trading.crypto.hash_deposits.wallets) || {};
    var methods = (config.settings.payments && config.settings.payments.methods && config.settings.payments.methods.crypto) || {};
    var order = ['btc', 'eth', 'ltc', 'bch', 'sol', 'xrp', 'trx', 'doge', 'usdttrc20', 'usdterc20', 'usdc', 'usdtsol'];
    var keys = order.filter(function(c) { return wallets[c] && String(wallets[c]).trim(); });
    Object.keys(wallets).forEach(function(c) {
        if(keys.indexOf(c) === -1 && wallets[c] && String(wallets[c]).trim()) keys.push(c);
    });
    return keys.map(function(c) {
        var meta = methods[c] || {};
        return {
            method: c,
            name: meta.name || c.toUpperCase(),
            network: meta.network || c.toUpperCase(),
            address: String(wallets[c]).trim()
        };
    });
}

module.exports = {
    verifyDeposit,
    normalizeHash,
    getWallet,
    getConfiguredCurrencies
};
