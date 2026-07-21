var { haveRankPermission } = require('@/utils/utils.js');

var config = require('@/config/config.js');

exports.jackpot = async (req, res, next) => {
    if(!config.settings.games.games.original.jackpot.enable && !haveRankPermission('play_disabled', res.locals.user ? res.locals.user.rank : 0)) return next();

    res.render('jackpot', {
        page: 'jackpot',
        name: config.app.pages['jackpot']
    });
};