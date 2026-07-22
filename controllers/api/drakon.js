var casinoService = require('@/services/games/casinoService.js');

var config = require('@/config/config.js');

function agentAuth(req) {
    var agent = (config.games.games.casino.drakon && config.games.games.casino.drakon.agent) || {};
    var code = String(req.body.agent_code || '').trim();
    var token = String(req.body.agent_token || '').trim();
    // Drakon docs sometimes use agent_secret; our panel uses agent_secret_key
    var secret = String(req.body.agent_secret_key || req.body.agent_secret || '').trim();

    var expectCode = String(agent.code || '').trim();
    var expectToken = String(agent.token || '').trim();
    var expectSecret = String(agent.secret_key || '').trim();

    if(!expectCode || !expectToken || !expectSecret) {
        console.error('[DRAKON] Webhook rejected: DRAKON_* env missing on server');
        return false;
    }

    if(code !== expectCode || token !== expectToken || secret !== expectSecret) {
        console.error('[DRAKON] Webhook auth mismatch codeOk=' + (code === expectCode) +
            ' tokenOk=' + (token === expectToken) +
            ' secretOk=' + (secret === expectSecret) +
            ' gotLens=' + code.length + '/' + token.length + '/' + secret.length +
            ' expectLens=' + expectCode.length + '/' + expectToken.length + '/' + expectSecret.length);
        return false;
    }

    return true;
}

exports.webhook = async (req, res) => {
    var method = req.body && req.body.method;

    if(method == 'account_details'){
        if(!agentAuth(req)) return res.status(200).json({ 'status': false, 'error': 'INVALID_REQUEST' });

        casinoService.getUserDetails(req.body.user_id, function(err1, user){
            if(err1) return res.status(400).json({ 'status': false, 'error': err1 });

            res.status(200).json({ 'status': true, 'data': user });
        });
    } else if(method == 'user_balance'){
        if(!agentAuth(req)) return res.status(200).json({ 'status': false, 'error': 'INVALID_REQUEST' });

        casinoService.getUserBalance(req.body.user_id, function(err1, balance){
            if(err1) return res.status(400).json({ 'status': false, 'error': err1 });

            res.status(200).json({ 'status': true, 'balance': balance });
        });
    } else if(method == 'transaction_bet'){
        if(!agentAuth(req)) return res.status(200).json({ 'status': false, 'error': 'INVALID_REQUEST' });

        casinoService.placeBet(req.body.user_id, req.body.bet, req.body.transaction_id, req.body.round_id, req.body.game, function(err1, newbalance){
            if(err1) return res.status(400).json({ 'status': false, 'error': err1 });

            res.status(200).json({ 'status': true, 'balance': newbalance });
        });
    } else if(method == 'transaction_win'){
        if(!agentAuth(req)) return res.status(200).json({ 'status': false, 'error': 'INVALID_REQUEST' });

        casinoService.finishBet(req.body.user_id, req.body.win, req.body.round_id, function(err1, newbalance){
            if(err1) return res.status(400).json({ 'status': false, 'error': err1 });

            res.status(200).json({ 'status': true, 'balance': newbalance });
        });
    } else if(method == 'refund'){
        if(!agentAuth(req)) return res.status(200).json({ 'status': false, 'error': 'INVALID_REQUEST' });

        casinoService.refundBet(req.body.user_id, req.body.amount, req.body.round_id, function(err1, newbalance){
            if(err1) return res.status(400).json({ 'status': false, 'error': err1 });

            res.status(200).json({ 'status': true, 'balance': newbalance });
        });
    } else res.status(200).json({ 'status': false, 'error': 'INVALID_METHOD' });
};
